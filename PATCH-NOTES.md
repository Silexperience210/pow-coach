# 🔧 PoW Coach — correctifs sécurité & bugs

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
