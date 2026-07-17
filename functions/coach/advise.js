/* /coach/advise — coach IA (LLM compatible OpenAI, Kimi/Moonshot par défaut) 🧠
   GET  → { enabled } : le front sait si la feature est configurée.
   POST → { token, type, lang, persona, data, stream? } → { text } | SSE

   types :
     "debrief"  → analyse texte d'une séance (stream SSE si demandé)
     "plan"     → plan de la semaine (stream SSE si demandé)
     "session"  → séance générée en JSON validé → exécutable par l'app (guidé)
     "posture"  → analyse d'UNE photo (visage flouté côté client) via modèle vision

   Confidentialité : seules des MÉTRIQUES bornées + identifiants d'exercice en
   liste blanche partent vers le LLM (voir _coach.js). Jamais de texte libre,
   jamais de pseudo. L'image "posture" est bornée en taille et sans méta-données.

   Coût borné : connexion obligatoire + 1 requête/5 s/IP + plafond quotidien
   par compte (COACH_DAILY_CAP, défaut 15) compté en KV. En mode stream, le quota
   est décrémenté AVANT l'appel (impossible d'annuler une réponse commencée) ;
   sinon il est décrémenté APRÈS succès.

   Variables :
     KIMI_API_KEY      (Encrypt 🔒)  clé API Moonshot/Kimi — active la feature
     KIMI_URL          (Plaintext)   défaut https://api.moonshot.ai/v1
     KIMI_MODEL        (Plaintext)   modèle texte (défaut kimi-k2.6)
     KIMI_VISION_MODEL (Plaintext)   modèle image (défaut kimi-latest)
     COACH_DAILY_CAP   (Plaintext)   défaut 15 (appels/jour/compte) */
import { json, preflight, originOk, cors, getSession, rateLimitKV, clientIp, tfetch } from "../_shared.js";
import { buildMessages, llmChat, llmStream, validateSessionPlan } from "../_coach.js";

export async function onRequestOptions({ env }) { return preflight(env); }

export async function onRequestGet({ env }) {
  return json({ enabled: !!env.KIMI_API_KEY }, 200, env);
}

const TYPES = new Set(["debrief", "plan", "session", "posture"]);
const MAXTOK = { debrief: 300, plan: 500, session: 500, posture: 320 };

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

  const type = TYPES.has(body.type) ? body.type : "debrief";
  const messages = buildMessages(type, body.lang, body.data, body.persona);
  if (!messages) return json({ error: "Requête coach invalide" }, 400, env);

  // plafond quotidien par compte (coût API borné)
  const cap = parseInt(env.COACH_DAILY_CAP || "15", 10);
  const day = new Date().toISOString().slice(0, 10);
  const ck = `coach:${session.pubkey}:${day}`;
  const used = parseInt((await env.FAUCET_KV.get(ck)) || "0", 10);
  if (used >= cap) return json({ error: "Quota coach du jour atteint — à demain 🧠" }, 429, env);
  const spend = () => env.FAUCET_KV.put(ck, String(used + 1), { expirationTtl: 172800 });

  // ── mode streaming : relaye le flux SSE de l'upstream tel quel ──
  if (body.stream && (type === "debrief" || type === "plan")) {
    await spend(); // quota avant : une réponse commencée ne s'annule plus
    try {
      const upstream = await llmStream(env, messages, MAXTOK[type], (url, opts, ms) => tfetch(url, opts, ms));
      return new Response(upstream.body, {
        status: 200,
        headers: { "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache", ...cors(env) },
      });
    } catch (e) {
      return json({ error: "Coach injoignable — réessaie dans un instant" }, 502, env);
    }
  }

  try {
    // le timeout est choisi par llmChat selon le mode (25 s, ou 110 s en mode raisonnement)
    const text = await llmChat(env, messages, MAXTOK[type],
      (url, opts, ms) => tfetch(url, opts, ms), { json: type === "session" });
    if (type === "session") {
      const plan = validateSessionPlan(text);
      if (!plan) return json({ error: "Séance générée illisible — réessaie" }, 502, env);
      await spend(); // quota après succès : un échec ne consomme pas de crédit
      return json({ type, plan }, 200, env);
    }
    await spend();
    return json({ text, type }, 200, env);
  } catch (e) {
    return json({ error: "Coach injoignable — réessaie dans un instant" }, 502, env);
  }
}
