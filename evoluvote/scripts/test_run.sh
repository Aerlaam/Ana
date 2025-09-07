#!/bin/bash
# Script de test pour EvoluVote Bot
# Usage: bash test_run.sh [vote90|vote24]

set -e

TASK=${1:-vote90}

echo "🧪 Test du bot EvoluVote - Tâche: $TASK"
echo "========================================"

# Vérifier que le fichier .env existe
if [ ! -f ".env" ]; then
    echo "❌ Fichier .env non trouvé!"
    echo "Copiez .env.example vers .env et configurez-le."
    exit 1
fi

# Charger les variables d'environnement
export $(cat .env | grep -v '^#' | xargs)

# Vérifier que PLAYER_NAME est défini
if [ -z "$PLAYER_NAME" ]; then
    echo "❌ PLAYER_NAME non défini dans .env"
    exit 1
fi

echo "👤 Joueur: $PLAYER_NAME"
echo "📋 Tâche: $TASK"
echo ""

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    npx playwright install chromium
fi

# Exécuter le bot
echo "🚀 Lancement du bot..."
echo ""
TASK=$TASK node src/index.js

echo ""
echo "✅ Test terminé!"