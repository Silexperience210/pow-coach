/* PoW Coach — helpers partagés (Pages Functions) 🔒
   secp256k1 minimal (vérification de signature DER pour LNURL-auth),
   bech32 (décodage lnurl / encodage), CORS, appels LNbits.
   Aucune dépendance externe — compatible Workers runtime. */

export function cors(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
export function json(obj, status, env) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", ...cors(env) },
  });
}
export function preflight(env) {
  return new Response(null, { headers: cors(env) });
}

/* ---------- utils bytes ---------- */
export const hex = {
  to(bytes) { return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join(""); },
  from(str) {
    const a = new Uint8Array(str.length / 2);
    for (let i = 0; i < a.length; i++) a[i] = parseInt(str.substr(i * 2, 2), 16);
    return a;
  },
};
export function randHex(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return hex.to(a);
}

/* ---------- bech32 (BIP-173) ---------- */
const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
function bechPolymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((b >> i) & 1) chk ^= GEN[i];
  }
  return chk;
}
function hrpExpand(hrp) {
  const out = [];
  for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) >> 5);
  out.push(0);
  for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) & 31);
  return out;
}
function convertBits(data, from, to, pad) {
  let acc = 0, bits = 0;
  const out = [];
  const maxv = (1 << to) - 1;
  for (const value of data) {
    acc = (acc << from) | value;
    bits += from;
    while (bits >= to) { bits -= to; out.push((acc >> bits) & maxv); }
  }
  if (pad && bits > 0) out.push((acc << (to - bits)) & maxv);
  return out;
}
export function bech32Decode(str) {
  str = str.toLowerCase();
  const pos = str.lastIndexOf("1");
  const hrp = str.slice(0, pos);
  const data = [];
  for (const c of str.slice(pos + 1)) data.push(CHARSET.indexOf(c));
  return { hrp, words: data.slice(0, -6) };
}
export function bech32Encode(hrp, data) {
  const words = convertBits(data, 8, 5, true);
  const values = hrpExpand(hrp).concat(words);
  const mod = bechPolymod(values.concat([0, 0, 0, 0, 0, 0])) ^ 1;
  const checksum = [];
  for (let i = 0; i < 6; i++) checksum.push((mod >> (5 * (5 - i))) & 31);
  let ret = hrp + "1";
  for (const d of words.concat(checksum)) ret += CHARSET[d];
  return ret;
}
export function lnurlDecodeToUrl(lnurl) {
  const { words } = bech32Decode(lnurl);
  const bytes = convertBits(words, 5, 8, false);
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/* =========================================================
   secp256k1 — vérification ECDSA (LNURL-auth)
   Implémentation compacte sur BigInt. Vérifie que la signature DER
   sur le message k1 provient bien de la clé publique fournie.
   ========================================================= */
const P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const Gx = 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
const Gy = 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
const mod = (a, m = P) => ((a % m) + m) % m;
function invmod(a, m) {
  let [old_r, r] = [mod(a, m), m], [old_s, s] = [1n, 0n];
  while (r !== 0n) { const q = old_r / r;
    [old_r, r] = [r, old_r - q * r]; [old_s, s] = [s, old_s - q * s]; }
  return mod(old_s, m);
}
// point (Jacobian evité : arithmétique affine suffisante ici)
function ptAdd(p1, p2) {
  if (!p1) return p2; if (!p2) return p1;
  const [x1, y1] = p1, [x2, y2] = p2;
  if (x1 === x2 && mod(y1 + y2) === 0n) return null;
  let m;
  if (x1 === x2 && y1 === y2) m = mod((3n * x1 * x1) * invmod(2n * y1, P));
  else m = mod((y2 - y1) * invmod(x2 - x1, P));
  const x3 = mod(m * m - x1 - x2);
  const y3 = mod(m * (x1 - x3) - y1);
  return [x3, y3];
}
function ptMul(k, p) {
  let r = null, a = p;
  while (k > 0n) { if (k & 1n) r = ptAdd(r, a); a = ptAdd(a, a); k >>= 1n; }
  return r;
}
function decompressPub(pubHex) {
  const b = hex.from(pubHex);
  if (b[0] === 0x04) return [BigInt("0x" + pubHex.slice(2, 66)), BigInt("0x" + pubHex.slice(66, 130))];
  const x = BigInt("0x" + pubHex.slice(2, 66));
  const ySq = mod(x * x * x + 7n);
  let y = powmod(ySq, (P + 1n) / 4n, P);
  if ((y & 1n) !== BigInt(b[0] & 1)) y = mod(-y);
  return [x, y];
}
function powmod(b, e, m) { let r = 1n; b = mod(b, m);
  while (e > 0n) { if (e & 1n) r = mod(r * b, m); e >>= 1n; b = mod(b * b, m); } return r; }
function parseDER(sigHex) {
  const b = hex.from(sigHex); let i = 2; // 0x30 len
  i++; let rlen = b[i++]; const r = BigInt("0x" + hex.to(b.slice(i, i + rlen))); i += rlen;
  i++; let slen = b[i++]; const s = BigInt("0x" + hex.to(b.slice(i, i + slen)));
  return [r, s];
}
export function verifyAuthSig(k1Hex, sigHex, pubHex) {
  try {
    const [r, s] = parseDER(sigHex);
    if (r <= 0n || r >= N || s <= 0n || s >= N) return false;
    const z = BigInt("0x" + k1Hex);
    const sInv = invmod(s, N);
    const u1 = mod(z * sInv, N), u2 = mod(r * sInv, N);
    const Pub = decompressPub(pubHex);
    const pt = ptAdd(ptMul(u1, [Gx, Gy]), ptMul(u2, Pub));
    if (!pt) return false;
    return mod(pt[0], N) === mod(r, N);
  } catch (e) { return false; }
}

/* ---------- vérif d'origine (défense en profondeur) ----------
   Le CORS ne bloque pas curl : on refuse activement les origines étrangères.
   On ne bloque que si un en-tête Origin est présent et ne correspond pas —
   les requêtes same-origin de l'app (Origin absent) restent acceptées. */
export function originOk(request, env) {
  const allow = env.ALLOWED_ORIGIN;
  if (!allow || allow === "*") return true;
  const o = request.headers.get("Origin") || "";
  return !o || o === allow;
}
export function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "0.0.0.0";
}

/* ---------- fetch avec timeout (empêche un serveur LN lent de geler la Function) ---------- */
export async function tfetch(url, opts, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...(opts || {}), signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/* ---------- montant d'une facture bolt11 (msat) ----------
   Ne décode QUE le montant depuis le HRP (partie lisible) — assez pour vérifier
   qu'un serveur Lightning Address ne nous fait pas payer plus que demandé.
   Renvoie un BigInt en msat, ou null si facture sans montant (any-amount). */
export function bolt11AmountMsat(pr) {
  const s = String(pr || "").toLowerCase();
  const sep = s.lastIndexOf("1");
  if (!s.startsWith("ln") || sep < 4) throw new Error("bad_invoice");
  const hrp = s.slice(0, sep);
  // ln + préfixe réseau (ordre : plus longs d'abord) + montant + multiplicateur
  const m = hrp.match(/^ln(?:bcrt|tbs|bc|tb|sb)(\d*)([munp]?)$/);
  if (!m) throw new Error("bad_invoice");
  const digits = m[1];
  if (!digits) return null; // facture "any-amount"
  const n = BigInt(digits);
  switch (m[2]) {
    case "": return n * 100000000000n; // 1 BTC = 1e11 msat
    case "m": return n * 100000000n;
    case "u": return n * 100000n;
    case "n": return n * 100n;
    case "p": return n / 10n; // pico : doit être un multiple de 10
    default: throw new Error("bad_invoice");
  }
}

/* ---------- LNbits ---------- */
export async function lnbitsWithdrawLink(env, amount, memo) {
  const r = await fetch(env.LNBITS_URL.replace(/\/+$/, "") + "/withdraw/api/v1/links", {
    method: "POST",
    headers: { "X-Api-Key": env.LNBITS_ADMIN_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: memo || "PoW Coach ⚡",
      min_withdrawable: amount, max_withdrawable: amount,
      uses: 1, wait_time: 1, is_unique: true,
    }),
  });
  if (!r.ok) throw new Error("withdraw_failed");
  return await r.json();
}
// Résout une Lightning Address (user@domain) → invoice bolt11 du montant voulu
export async function payToLnAddress(env, lnaddr, amountSats, comment) {
  const [name, domain] = lnaddr.split("@");
  if (!name || !domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) throw new Error("bad_lnaddress");
  const lnurlp = `https://${domain}/.well-known/lnurlp/${encodeURIComponent(name)}`;
  const meta = await (await tfetch(lnurlp)).json();
  if (!meta.callback || !/^https:\/\//i.test(meta.callback)) throw new Error("lnaddress_unreachable");
  const msat = amountSats * 1000;
  if (meta.minSendable && msat < meta.minSendable) throw new Error("amount_below_min");
  if (meta.maxSendable && msat > meta.maxSendable) throw new Error("amount_above_max");
  const sep = meta.callback.includes("?") ? "&" : "?";
  let cbUrl = `${meta.callback}${sep}amount=${msat}`;
  if (comment && meta.commentAllowed) cbUrl += `&comment=${encodeURIComponent(comment.slice(0, meta.commentAllowed))}`;
  const inv = await (await tfetch(cbUrl)).json();
  if (!inv.pr) throw new Error("no_invoice");
  // 🔒 CRITIQUE : le serveur LN Address (fourni par l'utilisateur) contrôle la facture.
  // On refuse de payer si son montant ne correspond PAS EXACTEMENT à ce qu'on doit :
  // sinon un endpoint malveillant renvoie une facture géante et vide le wallet faucet.
  const invMsat = bolt11AmountMsat(inv.pr);
  if (invMsat === null || invMsat !== BigInt(msat)) throw new Error("amount_mismatch");
  // paie l'invoice depuis le wallet faucet
  const pay = await fetch(env.LNBITS_URL.replace(/\/+$/, "") + "/api/v1/payments", {
    method: "POST",
    headers: { "X-Api-Key": env.LNBITS_ADMIN_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ out: true, bolt11: inv.pr }),
  });
  if (!pay.ok) throw new Error("payment_failed");
  const pd = await pay.json();
  return { payment_hash: pd.payment_hash, bolt11: inv.pr };
}

/* ---------- solde du wallet faucet (sats) ----------
   Pré-check "faucet à sec" (claim.js) + endpoint /faucet. Balance LNbits en msat. */
export async function faucetBalanceSats(env) {
  const r = await tfetch(env.LNBITS_URL.replace(/\/+$/, "") + "/api/v1/wallet", {
    headers: { "X-Api-Key": env.LNBITS_ADMIN_KEY },
  });
  if (!r.ok) throw new Error("wallet_unreachable");
  const w = await r.json();
  return Math.floor((Number(w.balance) || 0) / 1000);
}

/* ---------- rate-limit best-effort (KV) ----------
   true = autorisé (enregistre l'instant), false = trop fréquent. Sans KV → passe. */
export async function rateLimitKV(env, key, minMs) {
  if (!env.FAUCET_KV) return true;
  const k = "rl:" + key;
  const last = parseInt((await env.FAUCET_KV.get(k)) || "0", 10);
  const now = Date.now();
  if (now - last < minMs) return false;
  await env.FAUCET_KV.put(k, String(now), { expirationTtl: 60 });
  return true;
}

/* =========================================================
   PLAFONDS — réservation atomique
   Deux modes :
   • DO (binding LEDGER présent)  → plafonnement STRICT (Durable Object,
     compteurs sérialisés, zéro course TOCTOU).
   • KV (fallback)               → best-effort (peut légèrement se chevaucher
     sous très fort parallélisme).
   Interface unique : reserveBudget() renvoie { ok, error, status, rollback }.
   ========================================================= */
export function hasLedger(env) { return !!env.LEDGER; }
function ledgerStub(env) { return env.LEDGER.get(env.LEDGER.idFromName("global")); }
async function ledgerCall(env, path, payload) {
  const r = await ledgerStub(env).fetch("https://ledger.internal" + path, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload || {}),
  });
  return await r.json();
}
export const ledgerReserve = (env, payload) => ledgerCall(env, "/reserve", payload);
export const ledgerRefund = (env, decrements) => ledgerCall(env, "/refund", { decrements }).catch(() => {});
// solde par compte (sats gagnés, vérifiés serveur)
export const ledgerCredit = (env, p) => ledgerCall(env, "/credit", p);
export const ledgerDebit = (env, pubkey, amount) => ledgerCall(env, "/debit", { pubkey, amount });
export const ledgerBalance = (env, pubkey) => ledgerCall(env, "/balance", { pubkey });
export const ledgerSpent = (env, day) => ledgerCall(env, "/spent", { day });
export const ledgerRefundBalance = (env, pubkey, amount) => ledgerCall(env, "/refund-balance", { pubkey, amount }).catch(() => {});

// construit la liste des plafonds à vérifier pour cette demande
function buildCaps(env, session, today) {
  const caps = [];
  const budget = parseInt(env.DAILY_BUDGET_SATS || "0", 10);
  if (budget > 0) caps.push({ key: `spent:${today}`, cap: budget, label: "budget" });
  if (session) {
    const uc = parseInt(env.USER_DAILY_CAP || "0", 10);
    if (uc > 0) caps.push({ key: `uspent:${session.pubkey}:${today}`, cap: uc, label: "user" });
  }
  return caps;
}
const CAP_MSG = {
  budget: "Budget faucet du jour épuisé — reviens demain ⚡",
  user: "Plafond quotidien atteint — reviens demain ⚡",
  anon: "Plafond quotidien atteint — reviens demain ⚡",
};

export async function reserveBudget(env, request, session, amount) {
  const today = new Date().toISOString().slice(0, 10);
  const caps = buildCaps(env, session, today);
  let ratelimit = null;
  if (!session) {
    const ip = clientIp(request);
    const anonCap = parseInt(env.ANON_DAILY_CAP || env.MAX_CLAIM_SATS || "100", 10);
    if (anonCap > 0) caps.push({ key: `ipspent:${ip}:${today}`, cap: anonCap, label: "anon" });
    ratelimit = { key: ip, windowSec: 60 };
  }
  const noop = async () => {};

  // aucun store configuré → seul le plafond par retrait (déjà vérifié en amont) s'applique
  if (!env.LEDGER && !env.FAUCET_KV) return { ok: true, rollback: noop };

  // ---- mode STRICT : Durable Object ----
  if (env.LEDGER) {
    let r;
    try { r = await ledgerReserve(env, { amount, ratelimit, caps }); }
    catch { return { ok: false, status: 503, error: "Comptabilité indisponible — réessaie" }; }
    if (!r.ok) {
      if (r.reason === "rate") return { ok: false, status: 429, error: "Trop de demandes — patiente une minute ⚡" };
      return { ok: false, status: 429, error: CAP_MSG[r.label] || CAP_MSG.budget };
    }
    return { ok: true, rollback: async () => { await ledgerRefund(env, caps.map((c) => ({ key: c.key, amount }))); } };
  }

  // ---- mode best-effort : KV ----
  return await reserveBudgetKV(env, session, amount, today, caps, ratelimit);
}

async function reserveBudgetKV(env, session, amount, today, caps, ratelimit) {
  const kv = env.FAUCET_KV;
  const refunds = [];
  const rollback = async () => { for (const f of refunds) await f(); };
  // fréquence par IP (min TTL KV = 60 s) — non remboursée (une tentative reste une tentative)
  if (ratelimit) {
    const rlKey = `iprate:${ratelimit.key}`;
    if (await kv.get(rlKey)) return { ok: false, status: 429, error: "Trop de demandes — patiente une minute ⚡" };
    await kv.put(rlKey, "1", { expirationTtl: Math.max(60, ratelimit.windowSec || 60) });
  }
  for (const c of caps) {
    const k = c.key;
    const cur = parseInt((await kv.get(k)) || "0", 10);
    if (cur + amount > c.cap) { await rollback(); return { ok: false, status: 429, error: CAP_MSG[c.label] || CAP_MSG.budget }; }
    await kv.put(k, String(cur + amount), { expirationTtl: 172800 });
    refunds.push(async () => {
      const v = parseInt((await kv.get(k)) || "0", 10);
      await kv.put(k, String(Math.max(0, v - amount)), { expirationTtl: 172800 });
    });
  }
  return { ok: true, rollback };
}

/* =========================================================
   SESSION D'ENTRAÎNEMENT — jeton signé (HMAC) + scoring serveur
   Le serveur émet un jeton signé au démarrage (stateless), puis RECALCULE les
   sats à partir du journal de reps envoyé à la fin. Le client ne dicte plus le
   montant : il fournit des preuves, le serveur décide. Usage unique via le DO.
   ========================================================= */
const enc = (s) => new TextEncoder().encode(s);
function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlBytes(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
async function hmacKey(secret) {
  return await crypto.subtle.importKey("raw", enc(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function signSession(secret, obj) {
  const payload = b64url(enc(JSON.stringify(obj)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc(payload)));
  return payload + "." + b64url(sig);
}
export async function verifySession(secret, token) {
  if (typeof token !== "string" || token.indexOf(".") < 0) return null;
  const [payload, sig] = token.split(".");
  let ok = false;
  try { ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), b64urlBytes(sig), enc(payload)); } catch { return null; }
  if (!ok) return null;
  try { return JSON.parse(new TextDecoder().decode(b64urlBytes(payload))); } catch { return null; }
}

// intervalle minimal humainement plausible entre 2 reps (ms), par exercice
const REP_MIN_MS = {
  squat: 800, jsquat: 650, lunge: 850, knee: 550, jacks: 380,
  pushup: 900, plank: 950, bridge: 850, crunch: 700,
  jab: 230, punch2: 230, warrior: 950, tree: 950,
  run: 20000, // 1 tick = 100 m ; <20 s/100 m (>18 km/h soutenu) = véhicule/GPS → rejeté
};
export function repMinMs(exId) { return REP_MIN_MS[exId] || 600; }
function parseTiers(env) {
  // "5:2,10:3,21:5" → [[5,2],[10,3],[21,5]] ; défaut = config client
  const raw = env.COMBO_TIERS;
  if (raw) {
    const t = raw.split(",").map((p) => p.split(":").map((n) => parseInt(n, 10)))
      .filter((p) => p.length === 2 && p.every(Number.isFinite));
    if (t.length) return t;
  }
  return [[5, 2], [10, 3], [21, 5]];
}

/* Rejoue le journal côté serveur et calcule les sats gagnés.
   Filtre les reps non plausibles (hors fenêtre temporelle, trop rapprochées),
   applique le seuil de perfection + les paliers de combo. */
export function validateRepLog(env, exId, startTs, now, reps) {
  if (!Array.isArray(reps)) return { valid: 0, sats: 0 };
  const PT = parseInt(env.PERFECT_THRESHOLD || "92", 10);
  const base = parseInt(env.SATS_PERFECT || "1", 10);
  const tiers = parseTiers(env);
  const min = repMinMs(exId);
  const slack = 5000;
  const sorted = reps.slice(0, 5000)
    .filter((r) => r && Number.isFinite(Number(r.t)))
    .sort((a, b) => Number(a.t) - Number(b.t));
  let combo = 0, sats = 0, valid = 0, lastT = -Infinity;
  for (const r of sorted) {
    const t = Number(r.t);
    if (t < startTs - slack || t > now + slack) continue; // hors fenêtre de session
    if (t - lastT < min) continue; // trop rapide pour être humain → ignoré
    lastT = t; valid++;
    const form = Math.max(0, Math.min(100, Number(r.form) || 0));
    if (form >= PT) {
      combo++;
      let s = base;
      for (const [at, v] of tiers) if (combo >= at) s = v;
      sats += s;
    } else {
      combo = 0;
      // course/marche : un tick "marche" (form < seuil) paie le tarif de base,
      // sans combo — parité avec le client ("la marche paie moins que la course")
      if (exId === "run") sats += base;
    }
  }
  return { valid, sats };
}
