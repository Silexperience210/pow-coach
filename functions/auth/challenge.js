/* GET /auth/challenge
   Émet un challenge LNURL-auth : renvoie { lnurl, k1 }.
   Le front affiche le QR (lnurl) ; le wallet le scanne, signe k1, et appelle
   /auth/callback. Le front interroge /auth/poll?k1=... jusqu'à succès.
   Nécessite le binding KV "FAUCET_KV". */
import { json, preflight, randHex, bech32Encode, cors } from "../_shared.js";

export async function onRequestOptions({ env }) { return preflight(env); }

export async function onRequestGet({ request, env }) {
  if (!env.FAUCET_KV) return json({ error: "KV FAUCET_KV requis pour l'authentification" }, 500, env);

  const url = new URL(request.url);
  // "*" est valide pour le CORS mais pas comme origine d'URL de callback
  const origin = (env.ALLOWED_ORIGIN && env.ALLOWED_ORIGIN !== "*") ? env.ALLOWED_ORIGIN : url.origin;
  const k1 = randHex(32);

  // URL de callback que le wallet appellera
  const cb = `${origin}/auth/callback`;
  const authUrl = `${cb}?tag=login&k1=${k1}&action=login`;

  // encode en LNURL (bech32, hrp "lnurl")
  const bytes = new TextEncoder().encode(authUrl);
  const lnurl = bech32Encode("lnurl", Array.from(bytes)).toUpperCase();

  // stocke le challenge en attente (5 min)
  await env.FAUCET_KV.put("auth:" + k1, JSON.stringify({ status: "pending", ts: Date.now() }), {
    expirationTtl: 300,
  });

  return json({ k1, lnurl, encoded: "lightning:" + lnurl }, 200, env);
}
