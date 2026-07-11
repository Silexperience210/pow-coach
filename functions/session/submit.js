/* POST /session/submit   { sessionId, reps:[{t,form}], token }
   Fin de séance : le serveur vérifie le jeton signé, rejoue le journal de reps
   (plausibilité + combos), RECALCULE les sats, et crédite le solde du compte
   dans le Durable Object (usage unique via le sid → pas de rejeu).
   Le montant réclamé par le client est ignoré : seul le score serveur compte. */
import { json, preflight, originOk, verifySession, validateRepLog, ledgerCredit } from "../_shared.js";

export async function onRequestOptions({ env }) { return preflight(env); }

async function getSession(env, token) {
  if (!token || !env.FAUCET_KV) return null;
  const raw = await env.FAUCET_KV.get("session:" + token);
  return raw ? JSON.parse(raw) : null;
}

const MAX_SESSION_MS = 3 * 3600 * 1000; // une séance vaut ≤ 3 h

export async function onRequestPost({ request, env }) {
  if (!originOk(request, env)) return json({ error: "Origine refusée" }, 403, env);
  if (!env.LEDGER || !env.SESSION_SECRET) return json({ error: "server_scoring_disabled" }, 501, env);

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400, env); }

  const session = await getSession(env, body.token);
  if (!session) return json({ error: "auth_required" }, 401, env);

  const st = await verifySession(env.SESSION_SECRET, body.sessionId);
  if (!st || st.pubkey !== session.pubkey) return json({ error: "Session invalide" }, 400, env);

  const now = Date.now();
  if (st.startTs > now + 5000 || now - st.startTs > MAX_SESSION_MS)
    return json({ error: "Session expirée" }, 400, env);

  const { valid, sats } = validateRepLog(env, st.exId, st.startTs, now, body.reps);

  // plafond d'earn par fenêtre + COOLDOWN : au-delà de SERVER_DAILY_CAP sats,
  // verrou de EARN_COOLDOWN_H heures (défaut 18) avant de pouvoir regagner.
  const cap = parseInt(env.SERVER_DAILY_CAP || "200", 10);
  const cooldownMs = Math.round(parseFloat(env.EARN_COOLDOWN_H || "18") * 3600 * 1000);
  const r = await ledgerCredit(env, { sid: st.sid, pubkey: session.pubkey, amount: sats, cap, cooldownMs });
  if (!r.ok) {
    if (r.reason === "replay") return json({ error: "Séance déjà validée" }, 409, env);
    return json({ error: "Crédit refusé" }, 400, env);
  }
  return json({ credited: r.credited, balance: r.balance, valid,
    earned: r.earned, cap: r.cap, lockUntil: r.lockUntil, locked: r.locked }, 200, env);
}
