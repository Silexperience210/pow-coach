/* Tests unitaires de functions/_shared.js (node --test, zéro dépendance).
   Couvre le code le plus critique : vérification de signature LNURL-auth
   (secp256k1), bech32/LNURL, décodage de montant bolt11, scoring serveur. */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  verifyAuthSig, bech32Encode, lnurlDecodeToUrl, bolt11AmountMsat,
  validateRepLog, repMinMs, weeklyGoal, isoWeek, hex,
} from "../functions/_shared.js";

/* Le runtime Node n'expose pas `crypto` en global avant v19 sous certains flags —
   Workers oui. Ici on n'utilise que verifyAuthSig (pas de randHex). */

/* ---------- mini-signeur ECDSA secp256k1 (BigInt) pour générer des vecteurs ----------
   Même arithmétique que _shared.js : sign(z, d, k) → DER. k fixe = OK pour un test. */
const P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const G = [
  0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
];
const mod = (a, m = P) => ((a % m) + m) % m;
function invmod(a, m) {
  let [r0, r] = [mod(a, m), m], [s0, s] = [1n, 0n];
  while (r !== 0n) { const q = r0 / r; [r0, r] = [r, r0 - q * r]; [s0, s] = [s, s0 - q * s]; }
  return mod(s0, m);
}
function ptAdd(p1, p2) {
  if (!p1) return p2; if (!p2) return p1;
  const [x1, y1] = p1, [x2, y2] = p2;
  if (x1 === x2 && mod(y1 + y2) === 0n) return null;
  const m = (x1 === x2 && y1 === y2)
    ? mod((3n * x1 * x1) * invmod(2n * y1, P))
    : mod((y2 - y1) * invmod(x2 - x1, P));
  const x3 = mod(m * m - x1 - x2);
  return [x3, mod(m * (x1 - x3) - y1)];
}
function ptMul(k, p) {
  let r = null, a = p;
  while (k > 0n) { if (k & 1n) r = ptAdd(r, a); a = ptAdd(a, a); k >>= 1n; }
  return r;
}
const h64 = (n) => n.toString(16).padStart(64, "0");
function derInt(n) {
  let h = n.toString(16); if (h.length % 2) h = "0" + h;
  if (parseInt(h.slice(0, 2), 16) >= 0x80) h = "00" + h; // évite le bit de signe
  return "02" + (h.length / 2).toString(16).padStart(2, "0") + h;
}
function signDER(zHex, dHex, kHex) {
  const z = BigInt("0x" + zHex), d = BigInt("0x" + dHex), k = BigInt("0x" + kHex);
  const R = ptMul(k, G);
  const r = mod(R[0], N);
  const s = mod(invmod(k, N) * (z + r * d), N);
  const body = derInt(r) + derInt(s);
  return "30" + (body.length / 2).toString(16).padStart(2, "0") + body;
}
function compressedPub(dHex) {
  const Q = ptMul(BigInt("0x" + dHex), G);
  return ((Q[1] & 1n) ? "03" : "02") + h64(Q[0]);
}

/* ---------- LNURL-auth : vérification de signature ---------- */
const k1 = "a".repeat(32) + "1234567890abcdef".repeat(2); // 64 hex = 32 octets
const priv = h64(0x1234567890deadbeefn);
const nonce = h64(0x424242424242n);
const pub = compressedPub(priv);
const sig = signDER(k1, priv, nonce);

test("verifyAuthSig accepte une signature valide (clé compressée)", () => {
  assert.equal(verifyAuthSig(k1, sig, pub), true);
});
test("verifyAuthSig refuse un k1 différent", () => {
  assert.equal(verifyAuthSig("b".repeat(64), sig, pub), false);
});
test("verifyAuthSig refuse une signature altérée", () => {
  const bad = sig.slice(0, -2) + (sig.endsWith("00") ? "01" : "00");
  assert.equal(verifyAuthSig(k1, bad, pub), false);
});
test("verifyAuthSig refuse la clé d'un autre", () => {
  assert.equal(verifyAuthSig(k1, sig, compressedPub(h64(0x999999n))), false);
});
test("verifyAuthSig accepte une clé non compressée", () => {
  const Q = ptMul(BigInt("0x" + priv), G);
  const uncompressed = "04" + h64(Q[0]) + h64(Q[1]);
  assert.equal(verifyAuthSig(k1, sig, uncompressed), true);
});
test("verifyAuthSig ne jette pas sur des entrées pourries", () => {
  assert.equal(verifyAuthSig(k1, "zz", pub), false);
  assert.equal(verifyAuthSig(k1, sig, "04deadbeef"), false);
  assert.equal(verifyAuthSig("", "", ""), false);
});

/* ---------- bech32 / LNURL ---------- */
test("lnurl : encode → decode roundtrip", () => {
  const url = "https://coach.example.com/auth/callback?tag=login&k1=" + k1;
  const lnurl = bech32Encode("lnurl", Array.from(new TextEncoder().encode(url)));
  assert.equal(lnurlDecodeToUrl(lnurl), url);
  assert.equal(lnurlDecodeToUrl(lnurl.toUpperCase()), url); // wallets envoient souvent en MAJ
});

/* ---------- bolt11 : montant depuis le HRP ---------- */
test("bolt11AmountMsat : multiplicateurs", () => {
  assert.equal(bolt11AmountMsat("lnbc10u1qqqq"), 1000000n);      // 10 µBTC = 1000 sats
  assert.equal(bolt11AmountMsat("lnbc2500n1qqqq"), 250000n);     // 2500 nBTC = 250 sats
  assert.equal(bolt11AmountMsat("lntb1m1qqqq"), 100000000n);     // 1 mBTC testnet
  assert.equal(bolt11AmountMsat("lnbc100p1qqqq"), 10n);          // 100 pico = 10 msat
  assert.equal(bolt11AmountMsat("lnbc1qqqq"), null);             // any-amount
});
test("bolt11AmountMsat : rejets", () => {
  assert.throws(() => bolt11AmountMsat("lnbc105p1qqqq"));  // pico non multiple de 10
  assert.throws(() => bolt11AmountMsat("lnbc10x1qqqq"));   // multiplicateur inconnu
  assert.throws(() => bolt11AmountMsat("bc10u1qqqq"));     // pas une facture ln
  assert.throws(() => bolt11AmountMsat(""));
});

/* ---------- hex ---------- */
test("hex roundtrip", () => {
  const b = new Uint8Array([0, 1, 127, 128, 255]);
  assert.deepEqual(hex.from(hex.to(b)), b);
});

/* ---------- scoring serveur : validateRepLog ---------- */
const env = {}; // défauts : seuil 92, base 1, paliers 10:2/21:3 (alignés client)
const t0 = Date.now() - 10 * 60 * 1000, now = Date.now();

test("reps parfaites espacées → payées, trop rapprochées → ignorées", () => {
  const reps = [{ t: t0, form: 95 }, { t: t0 + 200, form: 95 }, { t: t0 + 1200, form: 95 }];
  assert.deepEqual(validateRepLog(env, "squat", t0, now, reps), { valid: 2, sats: 2 });
});
test("reps hors fenêtre de séance → ignorées", () => {
  const reps = [{ t: t0 - 60000, form: 95 }, { t: now + 60000, form: 95 }, { t: t0 + 1000, form: 95 }];
  const r = validateRepLog(env, "squat", t0, now, reps);
  assert.equal(r.valid, 1);
});
test("combos : les paliers augmentent le tarif", () => {
  // 10 reps parfaites espacées d'1 s → 9×1 + 1×2 (la 10e, palier ×10) = 11
  const reps = Array.from({ length: 10 }, (_, i) => ({ t: t0 + i * 1000, form: 95 }));
  assert.equal(validateRepLog(env, "squat", t0, now, reps).sats, 11);
});
test("combos : le palier ×21 paie 3 sats (défaut aligné client)", () => {
  // 21 reps à rythme humain (base 1,1 s + jitter ≥ plancher squat 0,8 s — sinon
  // rejet "rep trop rapide" ; et jitter sinon l'anti-métronome annule) →
  // 9×1 + 11×2 (×10→2 dès la 10e) + 1×3 (×21) = 34
  const reps = Array.from({ length: 21 }, (_, i) => ({ t: t0 + i * 1100 + ((i * 137) % 400) - 200, form: 95 }));
  assert.equal(validateRepLog(env, "squat", t0, now, reps).sats, 34);
});
test("difficulté signée : easy abaisse le seuil, hard le relève", () => {
  const reps = [{ t: t0, form: 85 }, { t: t0 + 1200, form: 96 }];
  assert.equal(validateRepLog(env, "squat", t0, now, reps).sats, 1);        // défaut 92 : seule 96 paie
  assert.equal(validateRepLog(env, "squat", t0, now, reps, "easy").sats, 2); // seuil 82 : les deux paient
  assert.equal(validateRepLog(env, "squat", t0, now, reps, "hard").sats, 0); // seuil 97 : aucune ne paie
});
test("course : la marche paie le tarif de base, la course les combos", () => {
  // 3 ticks course (form 100) + 2 ticks marche (form 80), espacés de 25 s
  const reps = [0, 1, 2, 3, 4].map((i) => ({ t: t0 + i * 25000, form: i < 3 ? 100 : 80 }));
  assert.deepEqual(validateRepLog(env, "run", t0, now, reps), { valid: 5, sats: 5 });
});
test("course : tick < 20 s/100 m (véhicule) → rejeté", () => {
  const reps = [{ t: t0, form: 100 }, { t: t0 + 5000, form: 100 }];
  assert.equal(validateRepLog(env, "run", t0, now, reps).valid, 1);
});
test("anti-métronome : 25 coups à intervalle CONSTANT → 0 sat", () => {
  const reps = Array.from({ length: 25 }, (_, i) => ({ t: t0 + i * 300, form: 95 }));
  const r = validateRepLog(env, "jab", t0, now, reps);
  assert.equal(r.valid, 25);
  assert.equal(r.sats, 0);
  assert.equal(r.uniform, true);
});
test("anti-métronome : un rythme humain (jitter ±20 %) paie normalement", () => {
  let t = t0;
  const reps = Array.from({ length: 25 }, (_, i) => {
    t += 300 + ((i * 37) % 120) - 60; // pseudo-jitter déterministe (±60 ms bien étalé)
    return { t, form: 95 };
  });
  const r = validateRepLog(env, "jab", t0, now, reps);
  assert.equal(r.valid, 25);
  assert.ok(r.sats > 0);
});
test("anti-métronome : la course régulière reste exemptée", () => {
  const reps = Array.from({ length: 25 }, (_, i) => ({ t: t0 + i * 25000, form: 100 }));
  const r = validateRepLog(env, "run", t0, now, reps);
  assert.ok(r.sats > 0);
});
test("journal invalide → zéro", () => {
  assert.deepEqual(validateRepLog(env, "squat", t0, now, "nope"), { valid: 0, sats: 0 });
});

/* ---------- objectifs hebdo ---------- */
test("weeklyGoal : catalogue serveur", () => {
  assert.equal(weeklyGoal("squat"), 100);
  assert.equal(weeklyGoal("run"), 200); // 200 ticks = 20 km
  assert.equal(weeklyGoal("inconnu"), 0);
});
test("isoWeek : format AAAA-Wnn et stabilité", () => {
  assert.match(isoWeek(new Date(Date.UTC(2026, 0, 8))), /^2026-W2$/);
  assert.equal(isoWeek(new Date(Date.UTC(2026, 6, 13))), isoWeek(new Date(Date.UTC(2026, 6, 19)))); // même semaine ISO
});
test("repMinMs : défauts", () => {
  assert.equal(repMinMs("jab"), 230);
  assert.equal(repMinMs("exo-inconnu"), 600);
});
