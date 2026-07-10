# PoW Coach — Ledger (Durable Object)

Worker compagnon qui héberge le Durable Object **`Ledger`** : des compteurs de
plafonds **atomiques** pour le faucet (budget global/jour, cap par compte,
cap + fréquence par IP). Il supprime la course TOCTOU du mode KV (best-effort).

> Sur Cloudflare **Pages**, une Function ne peut pas *définir* une classe DO :
> elle doit s'y **binder**. Ce Worker fournit la classe ; Pages s'y branche.

## Déploiement (une fois)

```bash
cd ledger-worker
npm i -g wrangler        # si besoin
wrangler login
wrangler deploy          # crée le Worker "pow-coach-ledger" + la classe Ledger
```

## Brancher le DO sur le projet Pages

Dashboard Cloudflare → ton projet **Pages** → **Settings → Functions →
Durable Object bindings → Add binding** :

| Champ | Valeur |
|---|---|
| Variable name | `LEDGER` |
| Durable Object namespace | Worker **`pow-coach-ledger`**, classe **`Ledger`** |

Puis **redeploy** le projet Pages. Dès que le binding `LEDGER` est présent,
`functions/claim.js` bascule automatiquement en **plafonnement strict** (le repli
KV n'est utilisé que si `LEDGER` est absent).

## Vérifier

- `wrangler tail pow-coach-ledger` pour voir le trafic.
- L'URL du Worker (si tu l'exposes) répond `PoW Coach ledger — Durable Object OK`.
- Un `POST /claim` incrémente `c:spent:<jour>` dans le DO ; deux retraits
  concurrents ne peuvent plus dépasser `DAILY_BUDGET_SATS`.

## API interne (appelée par les Pages Functions via le binding)

- `POST /reserve` `{ amount, ratelimit:{key,windowSec}|null, caps:[{key,cap,label}] }`
  → `{ok:true}` | `{ok:false, reason:"rate"}` | `{ok:false, reason:"cap", label}`
- `POST /refund` `{ decrements:[{key,amount}] }` → `{ok:true}` (si le paiement échoue)
