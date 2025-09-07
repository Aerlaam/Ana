#!/bin/bash
# Script d'installation pour EvoluVote Bot avec systemd
# Usage: sudo bash install_systemd.sh

set -e

echo "🚀 Installation d'EvoluVote Bot"
echo "================================"

# Vérifier qu'on est root
if [ "$EUID" -ne 0 ]; then 
   echo "❌ Ce script doit être exécuté avec sudo"
   exit 1
fi

# Variables
INSTALL_DIR="/opt/evoluvote"
SERVICE_USER="evoluvote"
NODE_VERSION="20"

echo "📦 Installation des dépendances système..."

# Installer Node.js 20 si nécessaire
if ! command -v node &> /dev/null || [ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt $NODE_VERSION ]; then
    echo "📥 Installation de Node.js $NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash -
    apt-get install -y nodejs
fi

# Installer les dépendances Playwright
echo "🎭 Installation des dépendances Playwright..."
apt-get update
apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libatspi2.0-0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libxcb1 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2

# Créer l'utilisateur système
echo "👤 Création de l'utilisateur système..."
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -s /bin/false -d $INSTALL_DIR $SERVICE_USER
fi

# Créer le répertoire d'installation
echo "📁 Création du répertoire d'installation..."
mkdir -p $INSTALL_DIR
cp -r ./* $INSTALL_DIR/
chown -R $SERVICE_USER:$SERVICE_USER $INSTALL_DIR

# Installer les dépendances Node.js
echo "📦 Installation des modules Node.js..."
cd $INSTALL_DIR
sudo -u $SERVICE_USER npm install

# Installer les navigateurs Playwright
echo "🌐 Installation des navigateurs Playwright..."
sudo -u $SERVICE_USER npx playwright install chromium

# Configurer le fichier .env
if [ ! -f "$INSTALL_DIR/.env" ]; then
    echo "⚙️ Configuration du fichier .env..."
    cp $INSTALL_DIR/.env.example $INSTALL_DIR/.env
    
    read -p "📝 Entrez votre pseudo Minecraft: " PLAYER_NAME
    sed -i "s/PLAYER_NAME=.*/PLAYER_NAME=$PLAYER_NAME/" $INSTALL_DIR/.env
    
    read -p "🔗 Webhook Discord (optionnel, appuyez sur Entrée pour ignorer): " WEBHOOK_URL
    if [ ! -z "$WEBHOOK_URL" ]; then
        sed -i "s|WEBHOOK_URL=.*|WEBHOOK_URL=$WEBHOOK_URL|" $INSTALL_DIR/.env
    fi
    
    chown $SERVICE_USER:$SERVICE_USER $INSTALL_DIR/.env
    chmod 600 $INSTALL_DIR/.env
fi

# Installer les services systemd
echo "🔧 Installation des services systemd..."
cp $INSTALL_DIR/systemd/*.service /etc/systemd/system/
cp $INSTALL_DIR/systemd/*.timer /etc/systemd/system/

# Recharger systemd
systemctl daemon-reload

# Activer et démarrer les timers
echo "⏰ Activation des timers..."
systemctl enable evoluvote-90m.timer
systemctl enable evoluvote-24h.timer
systemctl start evoluvote-90m.timer
systemctl start evoluvote-24h.timer

echo ""
echo "✅ Installation terminée avec succès!"
echo "================================"
echo ""
echo "📊 Status des timers:"
systemctl status evoluvote-90m.timer --no-pager
echo ""
systemctl status evoluvote-24h.timer --no-pager
echo ""
echo "💡 Commandes utiles:"
echo "  - Voir les logs 90min:  journalctl -u evoluvote-90m -f"
echo "  - Voir les logs 24h:    journalctl -u evoluvote-24h -f"
echo "  - Status timer 90min:   systemctl status evoluvote-90m.timer"
echo "  - Status timer 24h:     systemctl status evoluvote-24h.timer"
echo "  - Test manuel 90min:    cd $INSTALL_DIR && TASK=vote90 node src/index.js"
echo "  - Test manuel 24h:      cd $INSTALL_DIR && TASK=vote24 node src/index.js"
echo ""
echo "🎉 Le bot est maintenant actif et votera automatiquement!"