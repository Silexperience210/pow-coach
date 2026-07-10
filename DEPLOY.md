# 🚀 Déploiement — PoW Coach (Cloudflare Pages)

L'app est **statique + serverless** : rien à builder. Elle a besoin de Cloudflare Pages
pour servir `index.html` **et** exécuter le dossier `functions/` (où vit la clé LNbits,
en secret chiffré). GitHub héberge le code ; Cloudflare le fait tourner.

Deux méthodes — **B (connexion Git) est recommandée**.

---

## Option A — Direct Upload (rapide, manuel)

1. Cloudflare → **Workers & Pages → Create → Pages → Upload assets**.
2. Glisse le contenu **à plat** (pas de dossier parent) : `index.html`, `functions/`, `_headers`.
   (Le ZIP `POW-fixed.zip` fait exactement ça.)
3. Configure les **Variables + KV** (voir plus bas) puis **redeploy**.

➖ Manuel à chaque modif, pas de preview, pas de rollback propre.

---

## Option B — Connexion Git (recommandé) ⭐

Cloudflare redéploie **automatiquement à chaque `git push`**, avec previews par PR et rollback 1‑clic. Fonctionne avec un repo **privé**.

1. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**.
2. Autorise l'app **Cloudflare Pages** sur le repo **`Silexperience210/pow-coach`** (privé OK).
3. **Build settings** :
   - Framework preset : **None**
   - Build command : **(vide)**
   - Build output directory : **`/`**
4. Configure les **Variables + KV** (ci‑dessous) → **Save and Deploy**.

À partir de là : `git push` sur `main` = déploiement prod ; une PR = une preview URL.

---

## Variables & Secrets (Settings → Variables and Secrets → Production)

| Nom | Type | Valeur |
|---|---|---|
| `LNBITS_ADMIN_KEY` | **Encrypt 🔒** | admin key du wallet faucet dédié |
| `LNBITS_URL` | Plaintext | `https://ton-lnbits.exemple.com` |
| `ALLOWED_ORIGIN` | Plaintext | l'URL exacte du site, ex `https://pow-coach.pages.dev` |
| `MAX_CLAIM_SATS` | Plaintext | `100` — **doit être identique** à `MAX_CLAIM_SATS` dans `POW_CONFIG` (`index.html`) |
| `DAILY_BUDGET_SATS` | Plaintext | `2100` (budget global/jour) |
| `USER_DAILY_CAP` | Plaintext | `200` (cap/jour par compte connecté) |
| `ANON_DAILY_CAP` | Plaintext | `100` (cap/jour **par IP** sans login ; défaut = `MAX_CLAIM_SATS`) |
| `REQUIRE_AUTH` | Plaintext | `0` (ou `1` pour forcer la connexion) |

## KV (obligatoire — auth, budgets, cap/IP)

1. **Storage & Databases → KV → Create namespace** : `coachsats-kv`.
2. Projet Pages → **Settings → Bindings → KV namespace** → variable **`FAUCET_KV`** → `coachsats-kv`.

> Après toute modif de variables/binding : **redeploy** (Deployments → Retry).

## Côté LNbits

- Wallet **dédié** « PoW Faucet », alimenté avec ton seul budget de récompenses.
- Extension **Withdraw** activée (méthode QR/LNURL).
- Pour la **Lightning Address** (paiement auto), le wallet doit avoir de la **liquidité sortante**.

---

## ✅ Checklist post‑déploiement

- [ ] `ALLOWED_ORIGIN` = **exactement** l'URL servie (sinon `POST /claim` renvoie `403 Origine refusée`).
- [ ] `MAX_CLAIM_SATS` **client == serveur** (sinon un retrait > max est refusé).
- [ ] `FAUCET_KV` bien lié (sinon login/budgets/cap‑IP inactifs → 500 sur `/auth/*`).
- [ ] Un vrai retrait de test passe (Lightning Address **et** QR).
- [ ] Les **en‑têtes** de `_headers` sont bien renvoyés (DevTools → Network) : CSP autorise caméra + CDN MediaPipe.
- [ ] La caméra fonctionne en **HTTPS** (obligatoire pour `getUserMedia`).

> 🔒 Rappel : le wallet faucet ne contient que ce que tu acceptes de distribuer. Voir `PATCH-NOTES.md` pour les garde‑fous et les limites connues (comptage reps client, KV non atomique).
