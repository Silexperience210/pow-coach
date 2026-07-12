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
     DAILY_BUDGET_SATS  (Plaintext)  ex: 2100   (budget global)
     USER_DAILY_CAP     (Plaintext)  ex: 200    (cap par compte connecté)
     ANON_DAILY_CAP     (Plaintext)  ex: 100    (cap/jour par IP, sans login)
     REQUIRE_AUTH       (Plaintext)  "1" pour exiger la connexion
   Bindings :
     FAUCET_KV  (KV)              → sessions + auth + plafonds best-effort
     LEDGER     (Durable Object)  → plafonds STRICTS/atomiques (optionnel ;
                                    voir ledger-worker/). Si présent, prime sur KV. */
import { json, preflight, originOk, lnbitsWithdrawLink, payToLnAddress, reserveBudget, ledgerDebit, ledgerRefundBalance, faucetBalanceSats } from "./_shared.js";

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
  // Mode "solde serveur" : quand le scoring serveur est actif (LEDGER + SESSION_SECRET),
  // les sats vivent dans le DO → la connexion est OBLIGATOIRE pour retirer, et le
  // retrait DÉBITE le solde serveur (le montant client seul ne suffit plus).
  const serverBalance = !!(env.LEDGER && env.SESSION_SECRET);
  const requireAuth = env.REQUIRE_AUTH === "1" || serverBalance;
  const session = await getSession(env, body.token);
  if (requireAuth && !session) return json({ error: "auth_required" }, 401, env);

  // ---- débit du solde serveur (atomique) ----
  let balanceRefund = async () => {};
  let newBalance;
  if (serverBalance) {
    const d = await ledgerDebit(env, session.pubkey, amount);
    if (!d.ok) return json({ error: "Solde insuffisant — gagne plus de sats ⚡" }, 400, env);
    newBalance = d.balance;
    balanceRefund = async () => { await ledgerRefundBalance(env, session.pubkey, amount); };
  }

  // ---- plafonds (budget global + cap/compte + cap/IP + fréquence) ----
  // Réservation atomique si le Durable Object LEDGER est branché (strict),
  // sinon repli KV best-effort. Voir _shared.js:reserveBudget.
  const reservation = await reserveBudget(env, request, session, amount);
  if (!reservation.ok) { await balanceRefund(); return json({ error: reservation.error }, reservation.status || 429, env); }
  const rollback = async () => { await reservation.rollback(); await balanceRefund(); };

  // ---- pré-check "faucet à sec" : ne promets pas un retrait qu'on ne peut honorer ----
  try {
    const fb = await faucetBalanceSats(env);
    if (fb < amount) { await rollback(); return json({ error: "⚡ Faucet momentanément à sec — reviens bientôt 🙏" }, 503, env); }
  } catch (e) { /* LNbits injoignable ici → on laisse l'étape de paiement gérer l'erreur */ }

  // ---- paiement ----
  try {
    if (method === "lnaddress") {
      const lnaddr = String(body.lnaddress || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lnaddr)) { await rollback(); return json({ error: "Adresse Lightning invalide" }, 400, env); }
      const res = await payToLnAddress(env, lnaddr, amount, "PoW Coach reward");
      return json({ paid: true, method: "lnaddress", amount, payment_hash: res.payment_hash, balance: newBalance }, 200, env);
    } else {
      const d = await lnbitsWithdrawLink(env, amount, "PoW Coach ⚡");
      return json({ paid: false, method: "lnurl", amount, lnurl: d.lnurl, balance: newBalance }, 200, env);
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
