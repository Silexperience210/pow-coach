/* GET /balance?token=<session>
   Renvoie l'état du scoring serveur et, si connecté, le solde serveur du compte.
   { server:bool, balance:number }
   - server=false → scoring serveur non déployé : l'app reste en mode legacy
     (solde local dans le navigateur).
   - server=true  → le solde fait autorité côté serveur (dans le DO). */
import { json, preflight, originOk, ledgerBalance } from "./_shared.js";

export async function onRequestOptions({ env }) { return preflight(env); }

async function getSession(env, token) {
  if (!token || !env.FAUCET_KV) return null;
  const raw = await env.FAUCET_KV.get("session:" + token);
  return raw ? JSON.parse(raw) : null;
}

export async function onRequestGet({ request, env }) {
  if (!originOk(request, env)) return json({ error: "Origine refusée" }, 403, env);
  const server = !!(env.LEDGER && env.SESSION_SECRET);
  const token = new URL(request.url).searchParams.get("token");
  if (!server || !token) return json({ server, balance: 0 }, 200, env);
  const session = await getSession(env, token);
  if (!session) return json({ server, balance: 0 }, 200, env);
  const r = await ledgerBalance(env, session.pubkey);
  return json({ server, balance: r.balance || 0 }, 200, env);
}
