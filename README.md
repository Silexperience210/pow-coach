# ⚡ PoW Coach — Proof of Workout

Coach sportif IA trilingue 🇫🇷🇬🇧🇪🇸 avec voix. La caméra analyse tes gestes (MediaPipe Pose), compte reps et combos, et récompense en sats Lightning façon **faucet**. Comptes optionnels via **LNURL-auth**, retraits par **Lightning Address** (auto) ou **QR LNURL**.

## 🗂 Structure (Cloudflare Pages)

```
index.html                      ← structure de l'app (aucune clé)
app.js                          ← la logique front (module ES)
app.css                         ← les styles
sw.js                           ← service worker (PWA)
tests/                          ← tests unitaires (node --test, lancés par la CI)
functions/
  ├── _shared.js                ← helpers (secp256k1, bech32, LNbits, scoring) — testé
  ├── claim.js                  ← POST /claim  (paiement + plafonds serveur)
  ├── session/                  ← POST /session/start + /session/submit (scoring serveur)
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
- **Faucet** : +1 sat/geste parfait, combos x10/x21 (2/3 sats), +21 sats/objectif hebdo. En **mode scoring serveur**, l'objectif hebdo est suivi **côté serveur** (compteur par compte/exercice/semaine dans le Durable Object) et le bonus est crédité une seule fois, au franchissement.
- **🏃 Course & Marche (GPS + OpenStreetMap)** : mode cardio sans caméra. Carte **Leaflet auto-hébergée** (open-source, fond **CARTO dark**), suivi GPS temps réel (distance, allure, temps mobile, tracé **coloré par allure**, épingles km), détection course/marche automatique. Récompense **1 tick/100 m** re-validé côté serveur (min 20 s/100 m = anti-véhicule) ; **la marche paie moins que la course**. **Objectif km/semaine** → bonus. **Récap post-course** (splits/km, calories, FC) + **historique** + **partage image**. **Wake Lock** (écran allumé). **Profil ⚙** (poids/âge → calories + zones FC). **Cardio Bluetooth** optionnel (`Web Bluetooth`, ceintures/bracelets BLE standard `0x180D`, Android Chrome). **Import GPX** (bouton 📁) pour visualiser une trace exportée d'Apple Santé / Huawei Health / Strava — *visualisation + résumé uniquement, sans sats (fichier non vérifiable)*.
- **🧠 Coach (v1 déterministe, gratuit)** : détection de **fautes précises** en plus du score de forme — genoux qui rentrent (valgus, mesuré au point bas du squat), amplitude incomplète (pompes), reps expédiées (<1,5 s sur les exos de force), poing trop haut/bas (boxe) — avec cue vocal ciblé. **Séances guidées** : 3 séries × objectif adaptatif avec repos auto (60 s) entre les séries, la cible progresse de ±10 % selon ta qualité (≥70 % de parfaits → +10 %). **Récap de séance** : reps, % parfaits, forme moyenne, combo max, fautes à corriger, prochain objectif.
- **🧠 Coach IA (optionnel — LLM Kimi/Moonshot)** : si `KIMI_API_KEY` est configurée, le récap inclut une **analyse personnalisée** rédigée par le LLM (débrief 4 phrases + focus) et un bouton **Plan de la semaine** (3 séances priorisant tes objectifs en retard). **Confidentialité** : seules des métriques bornées et des identifiants d'exercice en liste blanche partent vers l'API — jamais la vidéo, jamais de texte libre, jamais de pseudo (anti-injection par construction). Coût borné : connexion requise + `COACH_DAILY_CAP` appels/jour/compte (défaut 15).
- **📊 Stats** : reps totales, streak (jours consécutifs), % de gestes parfaits, graphique 7 jours (canvas maison), répartition par discipline.
- **🏆 Leaderboard Nostr** : classement mondial par reps totales. Chaque athlète publie son score en note Nostr signée (kind 30078, tag `powcoach`, Schnorr BIP-340) sur plusieurs relays. Lecture agrégée en WebSocket brut, zéro backend — et chaque événement lu est **re-vérifié côté client** (id = sha256 de la sérialisation NIP-01 + signature Schnorr) : un relay menteur ne peut pas usurper un score.
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
- Les scores sont **publics et auto-déclarés** : le classement reflète ce que chacun publie (les signatures sont vérifiées, donc personne ne peut publier *au nom d'un autre*, mais chacun choisit son chiffre). Pour un classement à enjeux, une validation serveur des reps serait nécessaire (évolution future).
- Relays par défaut : Damus, nos.lol, Primal, offchain.pub (modifiables dans `DEFAULT_RELAYS` ; testés à l'écriture — bitcoiner.social retiré car il ne répond plus aux EVENT).


## 🚀 Déploiement (Cloudflare Pages)

1. **Upload** `index.html` + `app.js` + `app.css` + `sw.js` + `manifest.json` + `_headers` + `vendor/` + les icônes + le dossier `functions/` (contenu à plat — pas de dossier parent). Avec la connexion Git, tout le repo part tel quel.
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
| `COMBO_TIERS` | Plaintext | défaut `10:2,21:3` — paliers de combo du scoring serveur, **alignés sur `POW_CONFIG`** ; format `palier:sats,palier:sats` |
| `SESSION_SECRET` | **Encrypt** 🔒 | secret HMAC des jetons de séance — active le **scoring serveur** (avec `LEDGER`) |
| `SERVER_DAILY_CAP` | Plaintext | `200` (sats gagnables par fenêtre/compte avant cooldown, scoring serveur) |
| `EARN_COOLDOWN_H` | Plaintext | `18` (heures de blocage des gains une fois `SERVER_DAILY_CAP` atteint ; puis remise à zéro) |
| `MIN_CLAIM_SATS` | Plaintext | `10` (seuil `dry` de `/faucet` : sous ce solde le faucet ne peut plus payer) |
| `FAUCET_LOW_SATS` | Plaintext | `50` (seuil `low` de `/faucet` : bannière « bientôt vide ») |
| `SATS_WEEKLY_GOAL` | Plaintext | `21` (bonus objectif hebdo crédité par le serveur, scoring serveur) |
| `UNIFORM_MIN_REPS` | Plaintext | `20` (anti-métronome : nb mini de reps pour évaluer la régularité) |
| `UNIFORM_CV` | Plaintext | `0.05` (anti-métronome : coefficient de variation sous lequel une série est jugée scriptée → 0 sat) |
| `KIMI_API_KEY` | **Encrypt** 🔒 | clé API Moonshot/Kimi — active le **coach IA** (débrief + plan hebdo) |
| `KIMI_MODEL` | Plaintext | défaut **`kimi-k2.6`** (id exact vérifié via `GET /v1/models`) |
| `KIMI_URL` | Plaintext | défaut `https://api.moonshot.ai/v1` (tout endpoint compatible OpenAI fonctionne) |
| `KIMI_THINKING` | Plaintext | `0` (défaut : raisonnement **désactivé** → ~10 s, ~130 tokens/débrief). `1` = mode raisonnement (~80 s, ~1200 tokens — plus cher/lent, qualité marginalement meilleure) |
| `COACH_DAILY_CAP` | Plaintext | `15` (appels coach IA / jour / compte — borne le coût API) |

### KV (obligatoire pour l'auth + les budgets)

1. **Storage & Databases → KV → Create namespace** : `coachsats-kv`
2. Projet Pages → **Settings → Bindings → KV namespace** → variable **`FAUCET_KV`** → `coachsats-kv`

Puis **redeploy** (Deployments → Retry) pour appliquer variables et binding.

### Côté LNbits

- Wallet **dédié** "PoW Faucet", alimenté avec ton seul budget de récompenses.
- Extension **Withdraw** activée (mode QR).
- Pour la Lightning Address : le wallet doit avoir de la **liquidité sortante** (paiements réels).

## 🧪 Tests & CI

- `npm test` → tests unitaires (`node --test`, zéro dépendance) sur `functions/_shared.js` :
  vérif de signature LNURL-auth (vecteurs secp256k1 générés dans le test), bech32/LNURL,
  décodage bolt11, scoring serveur (`validateRepLog` : fenêtres, combos, marche/course, anti-métronome).
- La CI GitHub tourne sur **toutes les branches** : `node --check` (Functions, Worker, `app.js`, `sw.js`),
  tests unitaires, garde anti-secrets.

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
| Triche sur le comptage des reps | ⚠ La *détection de pose* reste côté client. Le scoring serveur filtre les logs implausibles (reps trop rapprochées, hors fenêtre), **rejette les séries « métronome »** (≥ `UNIFORM_MIN_REPS` reps à intervalle quasi constant, CV < `UNIFORM_CV` → 0 sat) et **borne l'earn (plafond `SERVER_DAILY_CAP` + cooldown `EARN_COOLDOWN_H`)**, mais ne **prouve** pas l'effort humain. Preuve forte = build **native + attestation** (Play Integrity), cf. roadmap. |
| Usurpation de score au leaderboard (relay menteur) | ✔ Chaque événement Nostr lu est re-vérifié côté client : id NIP-01 + signature Schnorr BIP-340 |
| Spam de `/auth/*` (vérif secp256k1 coûteuse en CPU) | ✔ Rate-limit par IP : 1 challenge/s, 2 callbacks/s |
| Triche sur la course GPS | ⚠ Client rejette >30 km/h instantané + dérive à l'arrêt ; serveur exige **≥20 s/100 m** (>18 km/h soutenu rejeté = véhicule). L'**import GPX ne rapporte aucun sat** (fichier non vérifiable). |
| Spam des séances (`/session/*`) | ✔ Rate-limit best-effort par IP (KV) sur `start` et `submit` |
| Faucet à sec / paiements ratés | ✔ Pré-check du solde du wallet avant de promettre un retrait + bannière `dry`/`low` |
| Dépendance CDN compromise | ✔ qrcodejs, Leaflet **et noble (secp256k1/Schnorr) auto-hébergés** (`vendor/`), CSP resserrée ; seul MediaPipe reste un import ES **épinglé** (SRI non applicable aux imports de modules). La signature Nostr ne dépend donc plus d'aucun CDN. Seules les *tuiles* carto viennent de `tile.openstreetmap.org` (img-src) |

> **Plafonnement strict (optionnel).** Par défaut les compteurs vivent en **KV**
> (best-effort : sous très fort parallélisme ils peuvent légèrement se chevaucher).
> Pour un plafonnement **atomique**, déploie le Worker **`ledger-worker/`** (Durable
> Object) et binde-le en `LEDGER` sur le projet Pages : `claim.js` bascule alors
> automatiquement en mode strict. Voir `ledger-worker/README.md` et `DEPLOY.md`.

### En-têtes de sécurité
Le fichier **`_headers`** applique CSP, HSTS, `nosniff`, `Permissions-Policy: camera=(self), geolocation=(self), bluetooth=(self)` (GPS + cardio du mode Course), etc. Garde-le à la racine du déploiement.

**Règle d'or : le wallet faucet ne contient que ce que tu es prêt à distribuer.**
