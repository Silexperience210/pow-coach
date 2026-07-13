/* GET /auth/callback?tag=login&k1=<hex>&sig=<derhex>&key=<pubhex>
   Appelé PAR LE WALLET de l'utilisateur (LUD-04).
   Vérifie que sig est une signature valide de k1 par key (secp256k1),
   puis marque le challenge comme authentifié et émet un token de session. */
import { json, randHex, verifyAuthSig } from "../_shared.js";

// Ce endpoint répond au format LNURL (status OK/ERROR), pas au format de l'app
function lnurlOk() { return new Response(JSON.stringify({ status: "OK" }), { headers: { "Content-Type": "application/json" } }); }
function lnurlErr(reason) { return new Response(JSON.stringify({ status: "ERROR", reason }), { headers: { "Content-Type": "application/json" } }); }

export async function onRequestGet({ request, env }) {
  if (!env.FAUCET_KV) return lnurlErr("KV manquant");
  const u = new URL(request.url);
  const k1 = u.searchParams.get("k1");
  const sig = u.searchParams.get("sig");
  const key = u.searchParams.get("key");
  if (!k1 || !sig || !key) return lnurlErr("Paramètres manquants");

  // le challenge doit exister ET être encore en attente (usage unique)
  const raw = await env.FAUCET_KV.get("auth:" + k1);
  if (!raw) return lnurlErr("Challenge inconnu ou expiré");
  let challenge;
  try { challenge = JSON.parse(raw); } catch { return lnurlErr("Challenge corrompu"); }
  if (challenge.status !== "pending") return lnurlErr("Challenge déjà utilisé");

  // k1 doit être un hex 32 octets (anti-injection)
  if (!/^[0-9a-f]{64}$/i.test(k1)) return lnurlErr("k1 invalide");

  // key = clé publique secp256k1 (compressée 33 o ou non compressée 65 o) : on
  // valide le format avant de l'adopter comme identité de session
  if (!/^(0[23][0-9a-f]{64}|04[0-9a-f]{128})$/i.test(key)) return lnurlErr("Clé publique invalide");

  // vérification cryptographique de la signature
  if (!verifyAuthSig(k1, sig, key)) return lnurlErr("Signature invalide");

  // succès : crée un token de session lié à la clé publique (= identité de l'utilisateur)
  const token = randHex(24);
  await env.FAUCET_KV.put("session:" + token, JSON.stringify({ pubkey: key, ts: Date.now() }), {
    expirationTtl: 60 * 60 * 24 * 30, // 30 jours
  });
  await env.FAUCET_KV.put("auth:" + k1, JSON.stringify({ status: "ok", token, pubkey: key }), {
    expirationTtl: 300,
  });

  return lnurlOk();
}
