/* POST /auth/logout   { token }
   Déconnexion RÉELLE : supprime la session côté serveur (KV). Avant, le bouton
   « Déconnexion » n'effaçait que le token local — la session restait valide
   30 jours en KV (faux sentiment de sécurité sur appareil partagé). */
import { json, preflight, originOk } from "../_shared.js";

export async function onRequestOptions({ env }) { return preflight(env); }

export async function onRequestPost({ request, env }) {
  if (!originOk(request, env)) return json({ error: "Origine refusée" }, 403, env);
  if (!env.FAUCET_KV) return json({ ok: true }, 200, env);
  try {
    const body = await request.json();
    if (body && typeof body.token === "string" && body.token)
      await env.FAUCET_KV.delete("session:" + body.token);
  } catch { /* corps invalide → rien à supprimer, on répond OK quand même */ }
  return json({ ok: true }, 200, env);
}
