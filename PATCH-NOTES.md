# 🔧 PoW Coach — correctifs sécurité & bugs

## 🚀 Revue 2026-07 (branche `claude/repo-review-suggestions`)

### Corrigé
1. **Carte Leaflet jamais affichée (mode Course)** — `app.js` : le helper i18n `const L`
   masquait le global Leaflet `L` dans le module ; toute la carto passe par `window.L` (alias `LF()`).
2. **XSS stocké via le champ `zap` des événements Nostr** — `app.js` : plus aucune donnée
   Nostr dans un `onclick` inline (listeners programmatiques) + `esc()` échappe `'`.
3. **Marche payée 0 sat en scoring serveur** — `_shared.js` : un tick « marche » paie le tarif
   de base (parité client, « la marche paie moins que la course »).
4. **Graphique 7 jours qui gonflait à chaque affichage** (écrans retina) — hauteur logique mémorisée.
5. **SW : les 404/500 transitoires étaient cachés pour toujours** — seules les réponses saines
   (ou opaques no-cors) sont mises en cache.
6. **`/auth/callback`** : format de la pubkey validé avant adoption comme identité ;
   **`/auth/challenge`** : URL de callback correcte même si `ALLOWED_ORIGIN="*"`.

### Nouveau
- **Bonus hebdo crédité côté serveur** : compteur par (compte, exercice, semaine ISO) dans le
  Durable Object, bonus `SATS_WEEKLY_GOAL` versé une seule fois au franchissement de l'objectif.
- **Anti-farming « métronome »** : ≥ 20 reps à intervalle quasi constant (CV < 5 %) → 0 sat
  (course et tenues exemptées ; réglable via `UNIFORM_MIN_REPS` / `UNIFORM_CV`).
- **Vérification des événements Nostr à la lecture** (id NIP-01 + signature Schnorr) : un relay
  menteur ne peut plus usurper un score du leaderboard.
- **Rate-limit sur `/auth/challenge` (1/s/IP) et `/auth/callback` (2/s/IP)**.
- **bolt11 : rejet des montants pico non multiples de 10** (au lieu d'une troncature silencieuse).
- **Découpage d'`index.html`** (2 627 → ~380 lignes) : `app.js` + `app.css`, précachés par le SW
  et servis en réseau-d'abord + `Cache-Control: no-cache` (les mises à jour arrivent sans
  attendre une nouvelle version du SW).
- **Tests unitaires** (`npm test`, `node --test`, zéro dépendance) sur `_shared.js` :
  secp256k1/LNURL-auth, bech32, bolt11, `validateRepLog`. **CI sur toutes les branches.**

---

Correctifs appliqués sur cette version (par rapport au bundle d'origine).

## 🔴 Critique
1. **Drain du faucet via facture LN Address gonflée** — `functions/_shared.js`
   `payToLnAddress` décode désormais le montant du bolt11 retourné et **refuse de payer**
   si `montant_facture !== montant_demandé` (`bolt11AmountMsat` + garde `amount_mismatch`).
   Avant : le serveur payait en aveugle l'invoice fourni par un endpoint contrôlé par l'utilisateur.
2. **Abus anonyme illimité (sans login)** — `functions/claim.js`
   Ajout d'un **cap/jour par IP** (`ANON_DAILY_CAP`, défaut = `MAX_CLAIM_SATS`) et d'une
   **fréquence minimale** (1 retrait / minute / IP) quand aucune session n'est présente.

## 🟠 Élevé
3. **XSS DOM via lien de défi partagé** — `index.html`
   `renderChallenges` échappe maintenant `name`/`target` ; `importChallengeFromHash` valide
   strictement l'exercice (connu ou `any`) et l'objectif (entier borné 1..100000).
4. **Origin non vérifié dans les Functions** — `functions/claim.js` + `_shared.js`
   `originOk()` refuse les origines étrangères (le CORS seul ne bloque pas `curl`).

## 🟡 Moyen
5. **Fonds verrouillés si solde > MAX_CLAIM_SATS** — `index.html`
   Retrait plafonné à `MAX_CLAIM_SATS` (nouveau champ dans `POW_CONFIG`) avec **retrait partiel** :
   le solde est débité du montant retiré, plus remis à zéro.
6. **Challenge LNURL-auth rejouable** — `functions/auth/callback.js`
   Le challenge doit être `pending` (usage unique) + `k1` validé (hex 32 o).
7. **Function qui gèle sur un serveur LN lent** — `_shared.js`
   `tfetch()` (timeout 8 s) sur les appels sortants vers l'adresse Lightning.

## 🔵 Durcissement / packaging
- **`_headers`** ajouté (CSP, HSTS, nosniff, `Permissions-Policy: camera=(self)`…).
- Commentaire obsolète (`worker.js` / `CLAIM_ENDPOINT`) corrigé dans `index.html`.
- `worker.js` (legacy, sans auth ni cap) et les anciens ZIP retirés du livrable.
- README : nouvelle variable `ANON_DAILY_CAP`, tableau sécurité mis à jour, note KV non-atomique.

## ⚠ Restant (non corrigé — hors périmètre)
- Comptage des reps toujours côté client (borné par les caps + budget, pas prouvé).
- KV non atomique : léger chevauchement possible sous très fort parallélisme (→ Durable Object/D1).
- Pas de SRI sur les CDN ; modèle MediaPipe « full » exige WebGL/caméra.
