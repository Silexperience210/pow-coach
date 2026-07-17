/* POST /session/start   { exId, token }
   Démarre une séance notée côté serveur. Renvoie un jeton de session signé
   (HMAC) que le client renverra à /session/submit avec le journal de reps.
   Nécessite : connexion (token), binding LEDGER (DO) et SESSION_SECRET.
   Le scoring serveur est désactivé (501) si l'un manque → l'app reste en legacy. */
import { json, preflight, originOk, getSession, randHex, signSession, rateLimitKV, clientIp } from "../_shared.js";

export async function onRequestOptions({ env }) { return preflight(env); }

export async function onRequestPost({ request, env }) {
  if (!originOk(request, env)) return json({ error: "Origine refusée" }, 403, env);
  if (!env.LEDGER || !env.SESSION_SECRET) return json({ error: "server_scoring_disabled" }, 501, env);
  if (!(await rateLimitKV(env, "ss:" + clientIp(request), 1500))) return json({ error: "Trop de requêtes" }, 429, env);

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400, env); }

  const session = await getSession(env, body.token);
  if (!session) return json({ error: "auth_required" }, 401, env);

  const exId = String(body.exId || "");
  if (!/^[a-z0-9_]{1,32}$/i.test(exId)) return json({ error: "exId invalide" }, 400, env);
  // difficulté choisie côté client (Facile/Normal/Difficile) : signée dans le jeton
  // pour que le scoring serveur applique le MÊME seuil "parfait" que l'affichage.
  const diff = /^(easy|normal|hard)$/.test(body.diff) ? body.diff : "normal";

  const startTs = Date.now();
  const sid = randHex(16);
  const sessionId = await signSession(env.SESSION_SECRET, { sid, pubkey: session.pubkey, exId, diff, startTs });
  return json({ sessionId, startTs }, 200, env);
}
