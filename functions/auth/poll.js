/* GET /auth/poll?k1=<hex>
   Le front interroge périodiquement. Dès que le wallet a signé,
   renvoie { status:"ok", token, pubkey }. Sinon { status:"pending" }. */
import { json, preflight } from "../_shared.js";

export async function onRequestOptions({ env }) { return preflight(env); }

export async function onRequestGet({ request, env }) {
  if (!env.FAUCET_KV) return json({ error: "KV manquant" }, 500, env);
  const k1 = new URL(request.url).searchParams.get("k1");
  if (!k1) return json({ error: "k1 manquant" }, 400, env);

  const raw = await env.FAUCET_KV.get("auth:" + k1);
  if (!raw) return json({ status: "expired" }, 200, env);
  const st = JSON.parse(raw);
  if (st.status === "ok") return json({ status: "ok", token: st.token, pubkey: st.pubkey }, 200, env);
  return json({ status: "pending" }, 200, env);
}
