/* GET /faucet — état public du faucet (pour la bannière + transparence).
   Ne renvoie PAS le solde exact (évite un drain ciblé juste après recharge),
   seulement des booléens : { configured, dry, low }.
     dry  = solde < MIN_CLAIM_SATS   → ne peut plus payer même un petit retrait
     low  = solde < FAUCET_LOW_SATS  → bientôt vide (défaut 50) */
import { json, preflight, originOk, faucetBalanceSats, ledgerSpent } from "./_shared.js";

export async function onRequestOptions({ env }) { return preflight(env); }

export async function onRequestGet({ request, env }) {
  if (!originOk(request, env)) return json({ error: "Origine refusée" }, 403, env);
  if (!env.LNBITS_URL || !env.LNBITS_ADMIN_KEY) return json({ configured: false }, 200, env);
  try {
    const bal = await faucetBalanceSats(env);
    const minClaim = parseInt(env.MIN_CLAIM_SATS || "10", 10);
    const low = parseInt(env.FAUCET_LOW_SATS || "50", 10);
    // transparence : distribué aujourd'hui + budget/jour (agrégats, pas de données par-user)
    let todaySpent = null;
    if (env.LEDGER) {
      try { const s = await ledgerSpent(env, new Date().toISOString().slice(0, 10)); todaySpent = s.spent || 0; } catch (e) { /* best-effort */ }
    }
    const dailyBudget = parseInt(env.DAILY_BUDGET_SATS || "0", 10) || null;
    return json({ configured: true, dry: bal < minClaim, low: bal < low, todaySpent, dailyBudget }, 200, env);
  } catch (e) {
    return json({ configured: true, error: "wallet_unreachable" }, 200, env);
  }
}
