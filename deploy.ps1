# Script de déploiement manuel vers Hostinger (Windows PowerShell)
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Déploiement de l'Infirmerie MDC vers Hostinger" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Configuration
$REMOTE_USER = "u631451625"
$REMOTE_HOST = "us-bos-web1679.us-bos.webhostbox.net"
$REMOTE_PATH = "/home/$REMOTE_USER/public_html/infirmerie-mdc/"

Write-Host ""
Write-Host "📦 Étape 1: Installation des dépendances" -ForegroundColor Blue
pnpm install --frozen-lockfile

Write-Host ""
Write-Host "🏗️  Étape 2: Build de l'application" -ForegroundColor Blue
pnpm build

Write-Host ""
Write-Host "📤 Étape 3: Vérification de la connexion SSH" -ForegroundColor Blue
$testConnection = ssh -q "$REMOTE_USER@$REMOTE_HOST" "exit"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Impossible de se connecter au serveur" -ForegroundColor Red
    Write-Host "Vérifiez vos credentials SSH"
    exit 1
}
Write-Host "✓ Connexion SSH OK" -ForegroundColor Green

Write-Host ""
Write-Host "🗑️  Étape 4: Nettoyage du répertoire distant" -ForegroundColor Blue
ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_PATH && rm -rf ./* && rm -rf .htaccess"

Write-Host ""
Write-Host "📁 Étape 5: Upload des fichiers" -ForegroundColor Blue
scp -r dist/* "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"

Write-Host ""
Write-Host "🔍 Étape 6: Vérification des fichiers déployés" -ForegroundColor Blue
ssh "$REMOTE_USER@$REMOTE_HOST" "ls -lah $REMOTE_PATH"

Write-Host ""
Write-Host "✅ Déploiement terminé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Votre site est disponible sur:" -ForegroundColor White
Write-Host "https://infirmerie-mdc.salanon.info" -ForegroundColor Blue
Write-Host ""
