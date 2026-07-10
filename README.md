# ⚡ PoW Coach — Proof of Workout

Coach sportif IA trilingue 🇫🇷🇬🇧🇪🇸 avec voix. La caméra analyse tes gestes (MediaPipe Pose), compte reps et combos, et récompense en sats Lightning façon **faucet**. Comptes optionnels via **LNURL-auth**, retraits par **Lightning Address** (auto) ou **QR LNURL**.

## 🗂 Structure (Cloudflare Pages)

```
index.html                      ← l'app (aucune clé)
functions/
  ├── _shared.js                ← helpers (secp256k1, bech32, LNbits) — vérifié par tests
  ├── claim.js                  ← POST /claim  (paiement + plafonds serveur)
  └── auth/
      ├── challenge.js          ← GET /auth/challenge  (émet le k1)
      ├── callback.js           ← GET /auth/callback   (le wallet signe, on vérifie)
      └── poll.js               ← GET /auth/poll        (le front attend la connexion)
```

Tout tourne sur **Cloudflare Pages + Functions**. L'admin key LNbits vit en **Secret chiffré**, jamais dans l'app ni le navigateur.

## 🔑 Fonctionnalités

- **LNURL-auth** : connexion en scannant avec un wallet (Phoenix, Zeus, Breez…). Pas d'email ni mot de passe — l'identité = la clé publique signée. Vérification secp256k1 côté serveur.
- **Deux modes de retrait** :
  - **Lightning Address** (`nom@wallet.com`) → paiement **automatique et instantané**. L'adresse est mémorisée dans le compte.
  - **QR / LNURL-withdraw** → bon à scanner avec n'importe quel wallet.
- **Faucet** : +1 sat/geste parfait, combos x5/x10/x21 (2/3/5 sats), +21 sats/objectif hebdo.
- **📊 Stats** : reps totales, streak (jours consécutifs), % de gestes parfaits, graphique 7 jours (canvas maison), répartition par discipline.
- **🏆 Leaderboard Nostr** : classement mondial par reps totales. Chaque athlète publie son score en note Nostr signée (kind 30078, tag `powcoach`, Schnorr BIP-340) sur plusieurs relays. Lecture agrégée en WebSocket brut, zéro backend.
- **🎯 Défis hebdo partageables** : crée un défi (exercice + objectif), partage-le par **lien + image générée** (canvas 1080×1080, partage natif mobile). Le destinataire ouvre le lien → le défi s'importe automatiquement et sa progression se suit pendant les séances.
- **Plafonds serveur** : max par retrait, budget global/jour, **et plafond par compte/jour** (anti-abus).
- **Silhouette guide** + compte à rebours avant chaque exercice, jauge d'alignement.
- Modèle **full** + lissage temporel + anti-rebond pour un comptage précis.

### 🌐 À propos du leaderboard Nostr

- Une clé Nostr est générée localement au premier partage de score (stockée sur l'appareil).
- Les scores sont **publics et auto-déclarés** : le classement reflète ce que chacun publie. Pour un classement à enjeux, une validation serveur des reps serait nécessaire (évolution future).
- Relays par défaut : Damus, nos.lol, Primal, bitcoiner.social (modifiables dans `DEFAULT_RELAYS`).


## 🚀 Déploiement (Cloudflare Pages)

1. **Upload** `index.html` + le dossier `functions/` (via le ZIP à plat fourni, extrais-le et upload le contenu — pas de dossier parent).
2. **Save and deploy** → ton app vit sur `https://coachsats.pages.dev`.

### Variables (Settings → Variables and Secrets → Production)

| Nom | Type | Exemple |
|---|---|---|
| `LNBITS_ADMIN_KEY` | **Encrypt** 🔒 | admin key du wallet faucet dédié |
| `LNBITS_URL` | Plaintext | `https://ton-lnbits.exemple.com` |
| `ALLOWED_ORIGIN` | Plaintext | `https://coachsats.pages.dev` |
| `MAX_CLAIM_SATS` | Plaintext | `100` (max par retrait — **doit** refléter `MAX_CLAIM_SATS` dans `POW_CONFIG`) |
| `DAILY_BUDGET_SATS` | Plaintext | `2100` |
| `USER_DAILY_CAP` | Plaintext | `200` (cap/jour par compte connecté) |
| `ANON_DAILY_CAP` | Plaintext | `100` (cap/jour **par IP** quand non connecté ; défaut = `MAX_CLAIM_SATS`) |
| `REQUIRE_AUTH` | Plaintext | `0` (ou `1` pour exiger la connexion) |
| `SESSION_SECRET` | **Encrypt** 🔒 | secret HMAC des jetons de séance — active le **scoring serveur** (avec `LEDGER`) |
| `SERVER_DAILY_CAP` | Plaintext | `200` (sats gagnables/jour/compte, scoring serveur) |

### KV (obligatoire pour l'auth + les budgets)

1. **Storage & Databases → KV → Create namespace** : `coachsats-kv`
2. Projet Pages → **Settings → Bindings → KV namespace** → variable **`FAUCET_KV`** → `coachsats-kv`

Puis **redeploy** (Deployments → Retry) pour appliquer variables et binding.

### Côté LNbits

- Wallet **dédié** "PoW Faucet", alimenté avec ton seul budget de récompenses.
- Extension **Withdraw** activée (mode QR).
- Pour la Lightning Address : le wallet doit avoir de la **liquidité sortante** (paiements réels).

## ⚙ Réglages app (`index.html`, bloc `POW_CONFIG`)

- `API_BASE:""` → même domaine (recommandé sur Pages). Sinon l'origine de tes Functions.
- `REQUIRE_AUTH:false` → passe à `true` pour forcer la connexion avant de gagner/retirer.
- `MAX_CLAIM_SATS` → **doit** être identique à la variable serveur (sinon un retrait > max est refusé).
- Montants, combos, seuil de perfection, plafond client, retrait minimum.

## 🔐 Sécurité (honnête)

| Menace | Protection |
|---|---|
| Clé lisible dans l'app | ✔ Aucune clé côté client |
| Appel direct des Functions | ✔ Plafonds serveur (retrait, budget global, cap/compte, **cap/IP**) + **en-tête Origin vérifié** |
| Facture LN Address gonflée (drain) | ✔ Le montant du bolt11 retourné est **décodé et comparé** au montant demandé avant paiement |
| Abus anonyme (sans login) | ✔ `ANON_DAILY_CAP` par IP + fréquence mini (1 retrait / min / IP) |
| Usurpation de compte | ✔ LNURL-auth : signature secp256k1 vérifiée serveur (testée), challenge à **usage unique** |
| `amount` forgé / rejeu (devtools) | ✔ **Scoring serveur** (si activé) : séance signée HMAC à usage unique, le serveur **recalcule** les sats à partir du journal de reps et tient le **solde dans le DO** ; le montant client est ignoré |
| Triche sur le comptage des reps | ⚠ La *détection de pose* reste côté client. Le scoring serveur filtre les logs implausibles (reps trop rapprochées, hors fenêtre) et borne l'earn/jour, mais ne **prouve** pas l'effort humain. Preuve forte = build **native + attestation** (Play Integrity), cf. roadmap. |

> **Plafonnement strict (optionnel).** Par défaut les compteurs vivent en **KV**
> (best-effort : sous très fort parallélisme ils peuvent légèrement se chevaucher).
> Pour un plafonnement **atomique**, déploie le Worker **`ledger-worker/`** (Durable
> Object) et binde-le en `LEDGER` sur le projet Pages : `claim.js` bascule alors
> automatiquement en mode strict. Voir `ledger-worker/README.md` et `DEPLOY.md`.

### En-têtes de sécurité
Le fichier **`_headers`** applique CSP, HSTS, `nosniff`, `Permissions-Policy: camera=(self)`, etc. Garde-le à la racine du déploiement.

**Règle d'or : le wallet faucet ne contient que ce que tu es prêt à distribuer.**
