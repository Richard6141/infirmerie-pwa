#!/bin/bash

# Script de déploiement vers Hostinger
# Usage: ./deploy.sh

set -e

echo "🚀 Déploiement de l'Infirmerie MDC vers Hostinger"
echo "=================================================="

# Configuration
REMOTE_USER="u631451625"
REMOTE_HOST="us-bos-web1679.us-bos.webhostbox.net"
REMOTE_PATH="/home/$REMOTE_USER/domains/salanon.info/public_html/infirmerie-mdc/"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}📦 Étape 1: Installation des dépendances${NC}"
pnpm install --frozen-lockfile

echo ""
echo -e "${BLUE}🏗️  Étape 2: Build de production${NC}"
pnpm build

# Vérifier que le build a réussi
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erreur: Le dossier dist n'existe pas${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📤 Étape 3: Vérification de la connexion SSH${NC}"
ssh -q $REMOTE_USER@$REMOTE_HOST exit
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Impossible de se connecter au serveur${NC}"
    echo "Vérifiez vos credentials SSH"
    exit 1
fi
echo -e "${GREEN}✓ Connexion SSH OK${NC}"

echo ""
echo -e "${BLUE}🗑️  Étape 4: Nettoyage du répertoire distant${NC}"
ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_PATH && rm -rf ./* .htaccess 2>/dev/null || true"

echo ""
echo -e "${BLUE}📁 Étape 5: Upload des fichiers${NC}"
scp -r dist/* $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH

echo ""
echo -e "${BLUE}⚙️  Étape 6: Configuration du .htaccess${NC}"
cat > .htaccess.tmp << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Force HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Handle SPA routing
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>

# Cache control
<IfModule mod_expires.c>
  ExpiresActive On
  
  # Images
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  
  # CSS and JavaScript
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  
  # Fonts
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  
  # HTML (no cache for index.html)
  ExpiresByType text/html "access plus 0 seconds"
  
  # Manifest
  ExpiresByType application/manifest+json "access plus 1 week"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  
  # Service Worker scope
  <FilesMatch "sw\.js$">
    Header set Service-Worker-Allowed "/"
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>
  
  # Cache busting for hashed files
  <FilesMatch "\.(js|css|woff2?|ttf|eot|svg|jpg|jpeg|png|gif|webp)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  
  # No cache for HTML
  <FilesMatch "\.html$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
  </FilesMatch>
</IfModule>

# Prevent directory listing
Options -Indexes

# Error pages (optional)
# ErrorDocument 404 /index.html
EOF

scp .htaccess.tmp $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/.htaccess
rm .htaccess.tmp

echo ""
echo -e "${BLUE}🔍 Étape 7: Vérification des fichiers déployés${NC}"
ssh $REMOTE_USER@$REMOTE_HOST "ls -lah $REMOTE_PATH | head -20"

echo ""
echo -e "${GREEN}✅ Déploiement terminé avec succès!${NC}"
echo ""
echo "🌐 Votre site est disponible sur:"
echo -e "${BLUE}https://infirmerie-mdc.salanon.info${NC}"
echo ""
echo -e "${YELLOW}⚠️  Note: Attendez quelques minutes pour la propagation du cache${NC}"
echo ""