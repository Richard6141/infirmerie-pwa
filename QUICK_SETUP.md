# ⚡ Configuration Rapide - Déploiement Hostinger

## 🔑 1. Génération de la clé SSH

```bash
ssh-keygen -t ed25519 -C "github-actions" -f hostinger_deploy
```

Cela crée 2 fichiers :
- `hostinger_deploy` (clé privée) → pour GitHub Secrets
- `hostinger_deploy.pub` (clé publique) → pour Hostinger

## 📤 2. Ajouter la clé publique sur Hostinger

```bash
# Connexion SSH
ssh u631451625@us-bos-web1679.us-bos.webhostbox.net

# Ajouter la clé
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Coller le contenu de hostinger_deploy.pub
# Sauvegarder: Ctrl+O, Entrée, Ctrl+X

# Permissions
chmod 600 ~/.ssh/authorized_keys
```

## 🔐 3. GitHub Secrets à configurer

Allez sur : `GitHub → Settings → Secrets → Actions → New repository secret`

| Nom | Valeur |
|-----|--------|
| `SSH_PRIVATE_KEY` | Contenu complet de `hostinger_deploy` |
| `REMOTE_HOST` | `us-bos-web1679.us-bos.webhostbox.net` |
| `REMOTE_USER` | `u631451625` |

## 🚀 4. Tester la connexion

```bash
# Test de connexion SSH
ssh -i hostinger_deploy u631451625@us-bos-web1679.us-bos.webhostbox.net

# Si ça marche, vous êtes connecté! Tapez 'exit' pour sortir
```

## 📦 5. Premier déploiement manuel (optionnel)

### Windows PowerShell:
```powershell
.\deploy.ps1
```

### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

## ✅ 6. Activer le déploiement automatique

1. Commitez les fichiers de configuration :
```bash
git add .github/workflows/deploy.yml public/.htaccess
git commit -m "Configuration déploiement Hostinger"
git push origin main
```

2. Le déploiement se lance automatiquement !
3. Vérifiez sur GitHub → Actions

## 🌐 7. Accéder au site

Une fois déployé, ouvrez :
```
https://infirmerie-mdc.salanon.info
```

## 🔍 Vérification rapide

### Sur le serveur:
```bash
ssh u631451625@us-bos-web1679.us-bos.webhostbox.net
cd ~/public_html/infirmerie-mdc/
ls -la
# Vous devriez voir: index.html, assets/, .htaccess, etc.
```

### Dans le navigateur:
- La page de login devrait s'afficher
- Le logo MDC devrait être visible
- Pas d'erreurs dans la console F12

## ❗ Problèmes courants

### "Permission denied (publickey)"
→ La clé SSH n'est pas correctement configurée
→ Vérifiez `~/.ssh/authorized_keys` sur le serveur

### "No such file or directory"
→ Le répertoire n'existe pas sur le serveur
→ Créez-le: `mkdir -p ~/public_html/infirmerie-mdc/`

### "GitHub Actions failed"
→ Vérifiez les secrets GitHub
→ Consultez les logs dans l'onglet Actions

---

**✨ C'est tout ! Le déploiement automatique est maintenant configuré.**

À chaque `git push` sur `main`, votre site se met à jour automatiquement ! 🎉
