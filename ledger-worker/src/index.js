/* PoW Coach — Ledger (Durable Object) 🔒
   Compteurs de plafonds ATOMIQUES pour le faucet.

   Un Durable Object est mono-instance et sérialise ses accès storage : la
   séquence lire → vérifier → incrémenter est donc sans course (contrairement à
   KV qui est éventuellement cohérent et non atomique). On utilise UNE instance
   globale (idFromName("global")) : tous les /reserve et /refund y passent, ce qui
   garantit un plafonnement strict même sous fort parallélisme.

   Appelé PAR les Pages Functions via le binding `LEDGER` :
     POST /reserve  { amount, ratelimit:{key,windowSec}|null, caps:[{key,cap,label}] }
                    → { ok:true } | { ok:false, reason:"rate" }
                                   | { ok:false, reason:"cap", label }
     POST /refund   { decrements:[{key,amount}] }  → { ok:true }

   Clés storage :
     c:<key>   compteur (ex "c:spent:2026-07-10", "c:ipspent:<ip>:2026-07-10")
     rl:<key>  timestamp du dernier retrait (fréquence par IP)
   Un alarm quotidien purge les clés périmées (jours passés, rate-limits vieux). */

const json = (obj) => new Response(JSON.stringify(obj), { headers: { "Content-Type": "application/json" } });
const DAY = 86400 * 1000;

export class Ledger {
  constructor(state) {
    this.state = state;
    this.storage = state.storage;
  }

  async fetch(request) {
    const url = new URL(request.url);
    let body = {};
    try { body = await request.json(); } catch { /* corps vide toléré */ }
    if (url.pathname === "/reserve") return this.reserve(body);
    if (url.pathname === "/refund") return this.refund(body);
    if (url.pathname === "/credit") return this.credit(body);
    if (url.pathname === "/debit") return this.debit(body);
    if (url.pathname === "/balance") return this.balance(body);
    if (url.pathname === "/refund-balance") return this.refundBalance(body);
    return new Response("not found", { status: 404 });
  }

  async reserve({ amount, ratelimit, caps }) {
    const amt = Math.floor(Number(amount));
    if (!Number.isFinite(amt) || amt < 1) return json({ ok: false, reason: "bad_amount" });

    // Tout dans une transaction storage : atomique, retry auto en cas de conflit.
    return await this.storage.transaction(async (txn) => {
      const now = Date.now();

      // 1) fréquence (ne consomme rien tant que les plafonds n'ont pas validé)
      if (ratelimit && ratelimit.key) {
        const last = (await txn.get("rl:" + ratelimit.key)) || 0;
        if (now - last < (ratelimit.windowSec || 60) * 1000) return json({ ok: false, reason: "rate" });
      }

      // 2) vérifie TOUS les plafonds avant d'écrire quoi que ce soit
      for (const c of caps || []) {
        if (!(c.cap > 0)) continue;
        const cur = (await txn.get("c:" + c.key)) || 0;
        if (cur + amt > c.cap) return json({ ok: false, reason: "cap", label: c.label || null });
      }

      // 3) tout passe → incrémente + enregistre la fréquence
      for (const c of caps || []) {
        if (!(c.cap > 0)) continue;
        const cur = (await txn.get("c:" + c.key)) || 0;
        await txn.put("c:" + c.key, cur + amt);
      }
      if (ratelimit && ratelimit.key) await txn.put("rl:" + ratelimit.key, now);

      // planifie le ménage quotidien si pas déjà armé
      if (!(await this.storage.getAlarm())) await this.storage.setAlarm(now + DAY);
      return json({ ok: true });
    });
  }

  async refund({ decrements }) {
    return await this.storage.transaction(async (txn) => {
      for (const d of decrements || []) {
        const amt = Math.floor(Number(d.amount));
        if (!Number.isFinite(amt) || amt <= 0) continue;
        const cur = (await txn.get("c:" + d.key)) || 0;
        await txn.put("c:" + d.key, Math.max(0, cur - amt));
      }
      return json({ ok: true });
    });
  }

  /* ---- solde par compte (sats gagnés, vérifiés côté serveur) ----
     bal:<pubkey> est PERSISTANT (jamais purgé). Le crédit est plafonné par le
     cap d'earn/jour et la session (sid) est à usage unique (anti-rejeu). */
  async credit({ sid, pubkey, amount, day, dayCap }) {
    const amt = Math.floor(Number(amount));
    if (!pubkey || !Number.isFinite(amt) || amt < 0) return json({ ok: false, reason: "bad" });
    return await this.storage.transaction(async (txn) => {
      if (sid && (await txn.get("used:" + sid))) return json({ ok: false, reason: "replay" });
      const cap = Math.floor(Number(dayCap)) || 0;
      let grant = amt;
      if (cap > 0) {
        const ek = `c:earned:${pubkey}:${day}`;
        const earned = (await txn.get(ek)) || 0;
        grant = Math.max(0, Math.min(amt, cap - earned));
        if (grant > 0) await txn.put(ek, earned + grant);
      }
      const balKey = "bal:" + pubkey;
      const bal = ((await txn.get(balKey)) || 0) + grant;
      await txn.put(balKey, bal);
      if (sid) await txn.put("used:" + sid, Date.now());
      if (!(await this.storage.getAlarm())) await this.storage.setAlarm(Date.now() + DAY);
      return json({ ok: true, credited: grant, balance: bal });
    });
  }

  async debit({ pubkey, amount }) {
    const amt = Math.floor(Number(amount));
    if (!pubkey || !Number.isFinite(amt) || amt < 1) return json({ ok: false, reason: "bad" });
    return await this.storage.transaction(async (txn) => {
      const balKey = "bal:" + pubkey;
      const bal = (await txn.get(balKey)) || 0;
      if (amt > bal) return json({ ok: false, reason: "insufficient", balance: bal });
      await txn.put(balKey, bal - amt);
      return json({ ok: true, balance: bal - amt });
    });
  }

  async refundBalance({ pubkey, amount }) {
    const amt = Math.floor(Number(amount));
    if (!pubkey || !Number.isFinite(amt) || amt < 1) return json({ ok: true });
    return await this.storage.transaction(async (txn) => {
      const balKey = "bal:" + pubkey;
      const bal = ((await txn.get(balKey)) || 0) + amt;
      await txn.put(balKey, bal);
      return json({ ok: true, balance: bal });
    });
  }

  async balance({ pubkey }) {
    return json({ balance: (await this.storage.get("bal:" + pubkey)) || 0 });
  }

  // purge : compteurs de jours révolus (>3 j), rate-limits (>1 h), sessions (>1 j)
  async alarm() {
    const now = Date.now();
    const counters = await this.storage.list({ prefix: "c:" });
    for (const key of counters.keys()) {
      const m = key.match(/(\d{4}-\d{2}-\d{2})$/);
      if (m && (now - Date.parse(m[1])) > 3 * DAY) await this.storage.delete(key);
    }
    const rates = await this.storage.list({ prefix: "rl:" });
    for (const [key, ts] of rates) {
      if (now - ts > 3600 * 1000) await this.storage.delete(key);
    }
    const used = await this.storage.list({ prefix: "used:" });
    for (const [key, ts] of used) {
      if (now - ts > DAY) await this.storage.delete(key);
    }
    await this.storage.setAlarm(now + DAY);
  }
}

// Un Worker doit exporter un handler ; ici il ne sert qu'au health-check.
// Tout le trafic utile arrive via le binding Durable Object depuis les Pages Functions.
export default {
  async fetch() {
    return new Response("PoW Coach ledger — Durable Object OK", { status: 200 });
  },
};
