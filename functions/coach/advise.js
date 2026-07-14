/* /coach/advise — coach IA (LLM compatible OpenAI, Kimi/Moonshot par défaut) 🧠
   GET  → { enabled } : le front sait si la feature est configurée.
   POST → { token, type:"debrief"|"plan", lang, data } → { text }

   Confidentialité : seules des MÉTRIQUES bornées + identifiants d'exercice en
   liste blanche partent vers le LLM (voir _coach.js). Jamais de vidéo, jamais
   de texte libre, jamais de pseudo.

   Coût borné : connexion obligatoire + 1 requête/5 s/IP + plafond quotidien
   par compte (COACH_DAILY_CAP, défaut 15) compté en KV.

   Variables :
     KIMI_API_KEY  (Encrypt 🔒)  clé API Moonshot/Kimi — active la feature
     KIMI_URL      (Plaintext)   défaut https://api.moonshot.ai/v1
     KIMI_MODEL    (Plaintext)   id du modèle (ex : celui de ton dashboard Kimi)
     COACH_DAILY_CAP (Plaintext) défaut 15 (appels/jour/compte) */
import { json, preflight, originOk, rateLimitKV, clientIp, tfetch } from "../_shared.js";
import { buildMessages, llmChat } from "../_coach.js";

export async function onRequestOptions({ env }) { return preflight(env); }

export async function onRequestGet({ env }) {
  return json({ enabled: !!env.KIMI_API_KEY }, 200, env);
}

async function getSession(env, token) {
  if (!token || !env.FAUCET_KV) return null;
  const raw = await env.FAUCET_KV.get("session:" + token);
  return raw ? JSON.parse(raw) : null;
}

export async function onRequestPost({ request, env }) {
  if (!originOk(request, env)) return json({ error: "Origine refusée" }, 403, env);
  if (!env.KIMI_API_KEY) return json({ error: "coach_disabled" }, 501, env);
  if (!(await rateLimitKV(env, "co:" + clientIp(request), 5000)))
    return json({ error: "Trop de requêtes — patiente quelques secondes" }, 429, env);

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400, env); }

  // le coach IA est réservé aux comptes connectés (traçabilité du plafond)
  const session = await getSession(env, body.token);
  if (!session) return json({ error: "auth_required" }, 401, env);

  // plafond quotidien par compte (coût API borné)
  const cap = parseInt(env.COACH_DAILY_CAP || "15", 10);
  const day = new Date().toISOString().slice(0, 10);
  const ck = `coach:${session.pubkey}:${day}`;
  const used = parseInt((await env.FAUCET_KV.get(ck)) || "0", 10);
  if (used >= cap) return json({ error: "Quota coach du jour atteint — à demain 🧠" }, 429, env);
  await env.FAUCET_KV.put(ck, String(used + 1), { expirationTtl: 172800 });

  const type = body.type === "plan" ? "plan" : "debrief";
  const messages = buildMessages(type, body.lang, body.data);
  if (!messages) return json({ error: "Résumé de séance invalide" }, 400, env);

  try {
    const text = await llmChat(env, messages, type === "plan" ? 500 : 260,
      (url, opts) => tfetch(url, opts, 25000));
    return json({ text, type }, 200, env);
  } catch (e) {
    return json({ error: "Coach injoignable — réessaie dans un instant" }, 502, env);
  }
}
