# 🚀 Guide de déploiement sur Hostinger

## Informations du serveur

- **Domaine**: infirmerie-mdc.salanon.info
- **Hébergement**: Hostinger Premium Mutualisé
- **User SSH**: u631451625
- **Serveur**: us-bos-web1679
- **Répertoire**: /home/u631451625/public_html/infirmerie-mdc/

## 📋 Prérequis

1. Accès SSH au serveur Hostinger
2. Dépôt GitHub du projet
3. Node.js et pnpm installés localement (pour tests)

## 🔐 Étape 1 : Générer une clé SSH pour GitHub Actions

Sur votre machine locale (ou sur le serveur Hostinger) :

```bash
# Générer une nouvelle paire de clés SSH
ssh-keygen -t ed25519 -C "github-actions@infirmerie-mdc" -f ~/.ssh/hostinger_deploy

# Afficher la clé publique
cat ~/.ssh/hostinger_deploy.pub

# Afficher la clé privée (à copier pour GitHub Secrets)
cat ~/.ssh/hostinger_deploy
```

## 🔑 Étape 2 : Ajouter la clé publique sur Hostinger

### Via SSH :

```bash
# Connexion SSH
ssh u631451625@us-bos-web1679.us-bos.webhostbox.net

# Créer le dossier .ssh s'il n'existe pas
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Ajouter la clé publique
nano ~/.ssh/authorized_keys
# Coller la clé publique générée précédemment
# Sauvegarder (Ctrl+O, Entrée, Ctrl+X)

# Définir les bonnes permissions
chmod 600 ~/.ssh/authorized_keys
```

### Via le panneau Hostinger (alternative) :

1. Allez dans **Avancé** → **SSH Access**
2. Cliquez sur **Manage SSH Keys**
3. Ajoutez la clé publique générée

## 🔐 Étape 3 : Configurer les Secrets GitHub

Allez sur votre dépôt GitHub :
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Ajoutez ces 3 secrets :

### 1. `SSH_PRIVATE_KEY`
```
Coller le contenu complet de ~/.ssh/hostinger_deploy
(incluant -----BEGIN OPENSSH PRIVATE KEY----- et -----END OPENSSH PRIVATE KEY-----)
```

### 2. `REMOTE_HOST`
```
us-bos-web1679.us-bos.webhostbox.net
```

### 3. `REMOTE_USER`
```
u631451625
```

## 📦 Étape 4 : Préparer le serveur

Connectez-vous en SSH et préparez le répertoire :

```bash
# Connexion SSH
ssh u631451625@us-bos-web1679.us-bos.webhostbox.net

# Aller dans le répertoire public_html
cd ~/public_html/infirmerie-mdc/

# Nettoyer le répertoire (si nécessaire)
rm -f default.php

# Vérifier les permissions
ls -la
```

## 🏗️ Étape 5 : Tester le build localement

Avant de déployer, testez le build en local :

```bash
# Installer les dépendances
pnpm install

# Build de production
pnpm build

# Vérifier le dossier dist
ls -la dist/

# Tester localement
pnpm preview
```

## 🚀 Étape 6 : Déploiement manuel (première fois)

Pour le premier déploiement, vous pouvez le faire manuellement :

### Option A : Via SCP

```bash
# Build l'application
pnpm build

# Copier les fichiers vers le serveur
scp -r dist/* u631451625@us-bos-web1679.us-bos.webhostbox.net:/home/u631451625/public_html/infirmerie-mdc/
```

### Option B : Via SFTP

1. Utilisez FileZilla ou WinSCP
2. Connectez-vous avec les identifiants SSH
3. Uploadez le contenu du dossier `dist/` vers `/public_html/infirmerie-mdc/`

## 🔄 Étape 7 : Déploiement automatique

Une fois les secrets configurés, le déploiement sera automatique :

1. Faites des modifications dans votre code
2. Commitez et pushez sur la branche `main`
3. GitHub Actions se déclenche automatiquement
4. L'application est buildée et déployée sur Hostinger

### Vérifier le déploiement :

- Allez sur GitHub → **Actions**
- Vous verrez le workflow "Deploy to Hostinger" en cours
- Une fois terminé (✓ vert), votre site est déployé !

## 🌐 Étape 8 : Vérifier le site

Ouvrez votre navigateur et allez sur :
```
https://infirmerie-mdc.salanon.info
```

Le site devrait afficher la page de connexion avec le logo MDC !

## 🔧 Configuration du domaine (si nécessaire)

Si le sous-domaine n'affiche pas le site :

1. Allez dans le panneau Hostinger
2. **Domaines** → **infirmerie-mdc.salanon.info**
3. Vérifiez que le **Document Root** pointe vers :
   ```
   /home/u631451625/public_html/infirmerie-mdc
   ```

## 📝 Variables d'environnement

Si vous avez besoin de variables d'environnement différentes en production :

1. Créez un fichier `.env.production` :
   ```env
   VITE_API_URL=https://infirmerie-api.onrender.com
   ```

2. Le workflow GitHub Actions l'utilisera automatiquement lors du build

## 🐛 Dépannage

### Le site affiche une erreur 404 sur les routes

- Vérifiez que le fichier `.htaccess` est bien uploadé
- Vérifiez que `mod_rewrite` est activé sur le serveur

### Le déploiement GitHub Actions échoue

- Vérifiez que les 3 secrets sont bien configurés
- Vérifiez que la clé SSH publique est dans `~/.ssh/authorized_keys`
- Consultez les logs dans GitHub Actions

### Les fichiers ne s'uploadent pas

- Vérifiez les permissions du répertoire sur le serveur :
  ```bash
  chmod 755 ~/public_html/infirmerie-mdc/
  ```

### Le site affiche du texte blanc sur fond blanc

- Vérifiez que les fichiers CSS sont bien uploadés
- Vérifiez la console du navigateur pour des erreurs

## 📊 Monitoring

Pour surveiller les déploiements :

1. GitHub Actions → Onglet **Actions**
2. Vous verrez l'historique de tous les déploiements
3. Cliquez sur un workflow pour voir les détails

## 🔒 Sécurité

- ✅ HTTPS activé automatiquement
- ✅ Headers de sécurité dans `.htaccess`
- ✅ Clé SSH privée stockée de manière sécurisée dans GitHub Secrets
- ✅ Compression Gzip activée
- ✅ Cache des assets configuré

## 🎉 C'est terminé !

Votre application est maintenant déployée et se mettra à jour automatiquement à chaque push sur la branche `main` !

---

**Prochaines étapes recommandées :**
1. Configurer un certificat SSL (normalement automatique avec Hostinger)
2. Tester toutes les fonctionnalités en production
3. Configurer des sauvegardes régulières
4. Mettre en place un monitoring des erreurs (ex: Sentry)
