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
- **Faucet** : +1 sat/geste parfait, combos x10/x21 (2/3 sats), +21 sats/objectif hebdo.
- **🏃 Course & Marche (GPS + OpenStreetMap)** : mode cardio sans caméra. Carte **Leaflet auto-hébergée** (open-source, fond **CARTO dark**), suivi GPS temps réel (distance, allure, temps mobile, tracé **coloré par allure**, épingles km), détection course/marche automatique. Récompense **1 tick/100 m** re-validé côté serveur (min 20 s/100 m = anti-véhicule) ; **la marche paie moins que la course**. **Objectif km/semaine** → bonus. **Récap post-course** (splits/km, calories, FC) + **historique** + **partage image**. **Wake Lock** (écran allumé). **Profil ⚙** (poids/âge → calories + zones FC). **Cardio Bluetooth** optionnel (`Web Bluetooth`, ceintures/bracelets BLE standard `0x180D`, Android Chrome). **Import GPX** (bouton 📁) pour visualiser une trace exportée d'Apple Santé / Huawei Health / Strava — *visualisation + résumé uniquement, sans sats (fichier non vérifiable)*.
- **📊 Stats** : reps totales, streak (jours consécutifs), % de gestes parfaits, graphique 7 jours (canvas maison), répartition par discipline.
- **🏆 Leaderboard Nostr** : classement mondial par reps totales. Chaque athlète publie son score en note Nostr signée (kind 30078, tag `powcoach`, Schnorr BIP-340) sur plusieurs relays. Lecture agrégée en WebSocket brut, zéro backend.
- **🎯 Défis hebdo partageables** : crée un défi (exercice + objectif), partage-le par **lien + image générée** (canvas 1080×1080, partage natif mobile). Le destinataire ouvre le lien → le défi s'importe automatiquement et sa progression se suit pendant les séances.
- **💛 Soutien / tips** : lien permanent « Support the project » + rappel discret toutes les **3 h d'usage actif** (jamais pendant une séance), avec QR et bouton *open in wallet*, vers l'adresse Lightning du projet — **séparée du wallet faucet**. (adresse dans `TIP_LNADDR`, fréquence dans `TIP_EVERY_MS`)
- **📲 PWA installable** : `manifest.json` + service worker → « Ajouter à l'écran d'accueil », icône, plein écran, chargement instantané et tolérant au réseau (l'API n'est jamais mise en cache, le modèle de pose non plus). Bouton *Install* quand disponible.
- **🚱 Bannière faucet** : quand le wallet faucet est bientôt vide (`low`) ou trop bas pour payer (`dry`), une bannière l'indique (utilisateurs **et** propriétaire). L'endpoint `GET /faucet` ne renvoie que des booléens (pas le solde exact). Un **pré-check** refuse proprement un retrait impossible au lieu d'une erreur brute.
- **👋 Onboarding** : court écran d'accueil à la 1re visite (FR/EN/ES) expliquant gagner / connecter un wallet / retirer.
- **🧾 Historique des retraits** : liste locale (30 derniers) dans l'onglet Stats.
- **🎚️ Niveaux de difficulté** : Facile / Normal / Difficile ajustent le seuil « parfait » (`perfectThreshold()`), sélecteur sur l'onglet Entraînement.
- **⏱️ Minuteur de repos** : modal 30/45/60/90 s avec vibration + voix à la fin (autonome, n'interfère pas avec la caméra).
- **⚡ Zap d'un athlète** : si un athlète a publié son adresse Lightning (opt-in, celle de ses retraits), un bouton ⚡ sur sa ligne de classement ouvre le wallet pour le tipper.
- **🔎 Transparence du faucet** : `GET /faucet` renvoie `todaySpent` + `dailyBudget` (agrégats, pas de données par-user) → carte « distribué aujourd'hui / budget » dans les Stats.
- **Plafonds serveur** : max par retrait, budget global/jour, cap/IP anti-abus, et **plafond d'earn par compte avec cooldown** : une fois `SERVER_DAILY_CAP` (200 sats) gagnés, les gains sont **bloqués `EARN_COOLDOWN_H` heures (18 par défaut)** puis le compteur repart à zéro — imposé de façon **atomique dans le Durable Object**.
- **Silhouette guide pleine** (corps lumineux + schéma de mouvement animé : flèches, cible d'impact, anneau de tenue) + **départ « de face »** (se placer face à la caméra suffit à armer le compte à rebours) + jauge d'alignement.
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
| `SERVER_DAILY_CAP` | Plaintext | `200` (sats gagnables par fenêtre/compte avant cooldown, scoring serveur) |
| `EARN_COOLDOWN_H` | Plaintext | `18` (heures de blocage des gains une fois `SERVER_DAILY_CAP` atteint ; puis remise à zéro) |
| `MIN_CLAIM_SATS` | Plaintext | `10` (seuil `dry` de `/faucet` : sous ce solde le faucet ne peut plus payer) |
| `FAUCET_LOW_SATS` | Plaintext | `50` (seuil `low` de `/faucet` : bannière « bientôt vide ») |

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
| Triche sur le comptage des reps | ⚠ La *détection de pose* reste côté client. Le scoring serveur filtre les logs implausibles (reps trop rapprochées, hors fenêtre) et **borne l'earn (plafond `SERVER_DAILY_CAP` + cooldown `EARN_COOLDOWN_H`)**, mais ne **prouve** pas l'effort humain. Preuve forte = build **native + attestation** (Play Integrity), cf. roadmap. |
| Triche sur la course GPS | ⚠ Client rejette >30 km/h instantané + dérive à l'arrêt ; serveur exige **≥20 s/100 m** (>18 km/h soutenu rejeté = véhicule). L'**import GPX ne rapporte aucun sat** (fichier non vérifiable). |
| Spam des séances (`/session/*`) | ✔ Rate-limit best-effort par IP (KV) sur `start` et `submit` |
| Faucet à sec / paiements ratés | ✔ Pré-check du solde du wallet avant de promettre un retrait + bannière `dry`/`low` |
| Dépendance CDN compromise | ✔ qrcodejs **et Leaflet auto-hébergés** (`vendor/`), CSP resserrée ; MediaPipe + noble restent des imports ES **épinglés** (SRI non applicable aux imports de modules). Seules les *tuiles* carto viennent de `tile.openstreetmap.org` (img-src) |

> **Plafonnement strict (optionnel).** Par défaut les compteurs vivent en **KV**
> (best-effort : sous très fort parallélisme ils peuvent légèrement se chevaucher).
> Pour un plafonnement **atomique**, déploie le Worker **`ledger-worker/`** (Durable
> Object) et binde-le en `LEDGER` sur le projet Pages : `claim.js` bascule alors
> automatiquement en mode strict. Voir `ledger-worker/README.md` et `DEPLOY.md`.

### En-têtes de sécurité
Le fichier **`_headers`** applique CSP, HSTS, `nosniff`, `Permissions-Policy: camera=(self), geolocation=(self), bluetooth=(self)` (GPS + cardio du mode Course), etc. Garde-le à la racine du déploiement.

**Règle d'or : le wallet faucet ne contient que ce que tu es prêt à distribuer.**
