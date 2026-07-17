/* GET /balance — token dans l'en-tête Authorization: Bearer <session>
   (?token= en query reste accepté pour compat, mais fuit dans les logs/historique).
   Renvoie l'état du scoring serveur et, si connecté, le solde serveur du compte.
   { server:bool, balance:number }
   - server=false → scoring serveur non déployé : l'app reste en mode legacy
     (solde local dans le navigateur).
   - server=true  → le solde fait autorité côté serveur (dans le DO). */
import { json, preflight, originOk, getSession, ledgerBalance } from "./_shared.js";

export async function onRequestOptions({ env }) { return preflight(env); }

export async function onRequestGet({ request, env }) {
  if (!originOk(request, env)) return json({ error: "Origine refusée" }, 403, env);
  const server = !!(env.LEDGER && env.SESSION_SECRET);
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7)
    : new URL(request.url).searchParams.get("token"); // compat anciens clients
  if (!server || !token) return json({ server, balance: 0 }, 200, env);
  const session = await getSession(env, token);
  if (!session) return json({ server, balance: 0 }, 200, env);
  const r = await ledgerBalance(env, session.pubkey);
  const cap = parseInt(env.SERVER_DAILY_CAP || "200", 10);
  return json({ server, balance: r.balance || 0,
    earned: r.earned || 0, cap, lockUntil: r.lockUntil || 0 }, 200, env);
}
