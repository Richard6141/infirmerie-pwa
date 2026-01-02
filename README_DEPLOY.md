# Déploiement Rapide sur Render 🚀

## Configuration

✅ **Prérequis déjà configurés**:
- API Backend: `https://infirmerie-api.onrender.com`
- Script de build: `pnpm build:prod`
- Variables d'environnement: `.env.production`

## Déploiement en 3 étapes

### 1️⃣ Préparer Git

```bash
cd infirmerie-pwa
git init
git add .
git commit -m "Initial commit"
```

### 2️⃣ Pousser sur GitHub

```bash
# Créez un repo sur https://github.com/new puis:
git remote add origin https://github.com/VOTRE_USERNAME/infirmerie-pwa.git
git push -u origin main
```

### 3️⃣ Déployer sur Render

1. Allez sur https://dashboard.render.com/
2. Cliquez "New +" → "Static Site"
3. Connectez votre repository GitHub
4. Utilisez cette configuration:

```
Name: infirmerie-pwa
Branch: main
Build Command: pnpm install && pnpm build:prod
Publish Directory: dist
```

5. Ajoutez la variable d'environnement (optionnel):
```
VITE_API_URL = https://infirmerie-api.onrender.com
```

6. Cliquez "Create Static Site"

## C'est tout ! 🎉

Votre PWA sera disponible sur: `https://infirmerie-pwa.onrender.com`

## Mises à jour automatiques

Chaque push sur `main` déploie automatiquement:

```bash
git add .
git commit -m "Mise à jour"
git push
```

## Tester localement avant déploiement

```bash
pnpm build:prod
pnpm preview
# Ouvrir http://localhost:4173
```
