/* POST /claim
   Body : { amount, method:"lnaddress"|"lnurl", lnaddress? , token? }
   - Vérifie la session (token) si l'auth est activée.
   - Applique un plafond par retrait, un plafond journalier PAR UTILISATEUR
     (si connecté + KV), et le budget global du faucet.
   - method "lnaddress" : paie directement l'adresse Lightning (le plus fluide).
   - method "lnurl"     : renvoie un LNURL-withdraw (QR à scanner).

   Variables (Pages → Settings → Variables and Secrets) :
     LNBITS_ADMIN_KEY   (Encrypt 🔒)
     LNBITS_URL         (Plaintext)
     ALLOWED_ORIGIN     (Plaintext)  ex: https://coachsats.pages.dev
     MAX_CLAIM_SATS     (Plaintext)  ex: 100
     DAILY_BUDGET_SATS  (Plaintext)  ex: 2100   (budget global, requiert KV)
     USER_DAILY_CAP     (Plaintext)  ex: 200    (cap par compte, requiert KV+auth)
     REQUIRE_AUTH       (Plaintext)  "1" pour exiger la connexion
   Binding KV : FAUCET_KV */
import { json, preflight, originOk, clientIp, lnbitsWithdrawLink, payToLnAddress, checkBudget } from "./_shared.js";

export async function onRequestOptions({ env }) { return preflight(env); }

async function getSession(env, token) {
  if (!token || !env.FAUCET_KV) return null;
  const raw = await env.FAUCET_KV.get("session:" + token);
  return raw ? JSON.parse(raw) : null;
}

export async function onRequestPost({ request, env }) {
  // défense en profondeur : refuse les origines étrangères (le CORS ne bloque pas curl)
  if (!originOk(request, env)) return json({ error: "Origine refusée" }, 403, env);

  if (!env.LNBITS_URL || !env.LNBITS_ADMIN_KEY)
    return json({ error: "Function non configurée (LNBITS_URL / LNBITS_ADMIN_KEY)" }, 500, env);

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400, env); }

  const amount = Math.floor(Number(body.amount));
  const method = body.method === "lnaddress" ? "lnaddress" : "lnurl";
  const maxClaim = parseInt(env.MAX_CLAIM_SATS || "100", 10);
  if (!Number.isFinite(amount) || amount < 1) return json({ error: "Montant invalide" }, 400, env);
  if (amount > maxClaim) return json({ error: `Maximum ${maxClaim} sats par retrait` }, 400, env);

  // ---- session / auth ----
  const requireAuth = env.REQUIRE_AUTH === "1";
  const session = await getSession(env, body.token);
  if (requireAuth && !session) return json({ error: "auth_required" }, 401, env);

  // ---- plafond journalier par utilisateur (si connecté) ----
  let userRefund = null;
  if (session && env.FAUCET_KV) {
    const cap = parseInt(env.USER_DAILY_CAP || "0", 10);
    if (cap > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const uKey = `uspent:${session.pubkey}:${today}`;
      const uspent = parseInt((await env.FAUCET_KV.get(uKey)) || "0", 10);
      if (uspent + amount > cap)
        return json({ error: `Plafond quotidien atteint (${cap} sats) — reviens demain ⚡` }, 429, env);
      await env.FAUCET_KV.put(uKey, String(uspent + amount), { expirationTtl: 172800 });
      userRefund = async () => {
        const s = parseInt((await env.FAUCET_KV.get(uKey)) || "0", 10);
        await env.FAUCET_KV.put(uKey, String(Math.max(0, s - amount)), { expirationTtl: 172800 });
      };
    }
  }

  // ---- anti-abus anonyme (pas de session) : cap + fréquence PAR IP ----
  // Sans connexion, seul le budget global bornait la casse : n'importe qui pouvait
  // vider le budget en boucle. On ajoute un plafond/jour et un intervalle mini par IP.
  let anonRefund = null;
  if (!session && env.FAUCET_KV) {
    const ip = clientIp(request);
    const today = new Date().toISOString().slice(0, 10);
    // fréquence : 1 retrait / fenêtre (min TTL KV = 60 s) par IP
    const rlKey = `iprate:${ip}`;
    if (await env.FAUCET_KV.get(rlKey))
      return json({ error: "Trop de demandes — patiente une minute ⚡" }, 429, env);
    await env.FAUCET_KV.put(rlKey, "1", { expirationTtl: 60 });
    // plafond quotidien par IP (défaut : un seul retrait max / jour)
    const anonCap = parseInt(env.ANON_DAILY_CAP || env.MAX_CLAIM_SATS || "100", 10);
    if (anonCap > 0) {
      const aKey = `ipspent:${ip}:${today}`;
      const aspent = parseInt((await env.FAUCET_KV.get(aKey)) || "0", 10);
      if (aspent + amount > anonCap)
        return json({ error: `Plafond quotidien atteint (${anonCap} sats) — reviens demain ⚡` }, 429, env);
      await env.FAUCET_KV.put(aKey, String(aspent + amount), { expirationTtl: 172800 });
      anonRefund = async () => {
        const s = parseInt((await env.FAUCET_KV.get(aKey)) || "0", 10);
        await env.FAUCET_KV.put(aKey, String(Math.max(0, s - amount)), { expirationTtl: 172800 });
      };
    }
  }

  // ---- budget global du faucet ----
  const budget = await checkBudget(env, amount);
  if (!budget.ok) {
    if (userRefund) await userRefund();
    if (anonRefund) await anonRefund();
    return json({ error: "Budget faucet du jour épuisé — reviens demain ⚡" }, 429, env);
  }
  const rollback = async () => { if (userRefund) await userRefund(); if (anonRefund) await anonRefund(); if (budget.refund) await budget.refund(); };

  // ---- paiement ----
  try {
    if (method === "lnaddress") {
      const lnaddr = String(body.lnaddress || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lnaddr)) { await rollback(); return json({ error: "Adresse Lightning invalide" }, 400, env); }
      const res = await payToLnAddress(env, lnaddr, amount, "PoW Coach reward");
      return json({ paid: true, method: "lnaddress", amount, payment_hash: res.payment_hash }, 200, env);
    } else {
      const d = await lnbitsWithdrawLink(env, amount, "PoW Coach ⚡");
      return json({ paid: false, method: "lnurl", amount, lnurl: d.lnurl }, 200, env);
    }
  } catch (e) {
    await rollback();
    const map = {
      bad_lnaddress: "Adresse Lightning invalide",
      lnaddress_unreachable: "Adresse Lightning injoignable",
      amount_below_min: "Montant sous le minimum de cette adresse",
      amount_above_max: "Montant au-dessus du maximum de cette adresse",
      no_invoice: "Facture non générée par l'adresse",
      amount_mismatch: "Facture au mauvais montant — adresse Lightning refusée",
      bad_invoice: "Facture Lightning illisible",
      payment_failed: "Paiement refusé — liquidité sortante insuffisante ?",
      withdraw_failed: "LNbits inaccessible — extension Withdraw activée ?",
    };
    return json({ error: map[e.message] || ("Erreur : " + e.message) }, 502, env);
  }
}
