# 📚 Guide d'installation complet - EvoluVote Bot

## 📋 Prérequis

### Serveur requis
- **VPS Linux** avec Ubuntu 20.04+ ou Debian 11+
- **Minimum 1GB RAM** et 10GB d'espace disque
- **Accès SSH root** ou utilisateur avec sudo
- **Connexion internet stable**

### Connaissances requises
- Savoir se connecter en SSH
- Connaissances basiques des commandes Linux
- (Optionnel) Avoir un webhook Discord

## 🚀 Installation étape par étape

### Étape 1 : Connexion au VPS

```bash
# Remplacez IP_DU_VPS par l'adresse IP de votre serveur
ssh root@IP_DU_VPS

# Ou si vous avez un utilisateur non-root
ssh votre_utilisateur@IP_DU_VPS
```

### Étape 2 : Installation des prérequis système

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer git et curl si pas déjà présents
sudo apt install -y git curl wget
```

### Étape 3 : Télécharger le bot

```bash
# Se placer dans le répertoire home
cd ~

# Cloner le projet (remplacez par votre URL si vous l'avez sur GitHub)
# Pour l'instant, créez manuellement le dossier
mkdir -p evoluvote
cd evoluvote

# Créer la structure des dossiers
mkdir -p src systemd scripts
```

### Étape 4 : Copier les fichiers du bot

⚠️ **IMPORTANT** : Vous devez copier tous les fichiers du dossier `evoluvote/` depuis votre projet Lovable vers votre VPS.

#### Option A : Via SCP (depuis votre ordinateur local)

```bash
# Depuis votre ordinateur local, dans le dossier du projet
scp -r evoluvote/* root@IP_DU_VPS:~/evoluvote/
```

#### Option B : Copier manuellement chaque fichier

Sur votre VPS, créez chaque fichier avec `nano` ou `vim` :

```bash
# Exemple pour créer le fichier package.json
nano ~/evoluvote/package.json
# Collez le contenu, puis Ctrl+X, Y, Enter pour sauvegarder

# Répétez pour chaque fichier :
nano ~/evoluvote/config.json
nano ~/evoluvote/src/index.js
nano ~/evoluvote/src/utils.js
# etc...
```

### Étape 5 : Configuration du bot

```bash
cd ~/evoluvote

# Copier le fichier d'exemple
cp .env.example .env

# Éditer la configuration
nano .env
```

Modifiez le fichier `.env` :
```env
# Remplacez TonPseudo par votre pseudo Minecraft exact
PLAYER_NAME=VotrePseudoMinecraft

# Optionnel : ajoutez votre webhook Discord
# Pour créer un webhook : Discord > Paramètres serveur > Intégrations > Webhooks > Nouveau webhook
WEBHOOK_URL=https://discord.com/api/webhooks/xxxxx/xxxxx

# Laisser en true pour fonctionner sans interface graphique
HEADLESS=true
```

Sauvegardez avec `Ctrl+X`, puis `Y`, puis `Enter`.

### Étape 6 : Installation automatique

```bash
# Rendre le script exécutable
chmod +x scripts/install_systemd.sh

# Lancer l'installation
sudo bash scripts/install_systemd.sh
```

Le script va automatiquement :
- ✅ Installer Node.js 20
- ✅ Installer les dépendances système
- ✅ Créer un utilisateur système sécurisé
- ✅ Installer les modules Node.js
- ✅ Configurer les services systemd
- ✅ Démarrer les timers automatiques

### Étape 7 : Vérification de l'installation

```bash
# Vérifier le statut des timers
systemctl status evoluvote-90m.timer
systemctl status evoluvote-24h.timer

# Voir les prochaines exécutions prévues
systemctl list-timers evoluvote*
```

Vous devriez voir :
- `Active: active (waiting)` pour chaque timer
- Les prochaines exécutions planifiées

## 🧪 Tests manuels

### Test immédiat du vote 90 minutes

```bash
cd /opt/evoluvote
sudo -u evoluvote bash -c "TASK=vote90 node src/index.js"
```

### Test immédiat du vote 24 heures

```bash
cd /opt/evoluvote
sudo -u evoluvote bash -c "TASK=vote24 node src/index.js"
```

### Vérifier les logs en temps réel

```bash
# Logs du vote 90 minutes
journalctl -u evoluvote-90m -f

# Logs du vote 24 heures
journalctl -u evoluvote-24h -f

# Tous les logs du bot
journalctl -u 'evoluvote-*' -f
```

## 🔧 Configuration Discord (optionnel mais recommandé)

### Créer un webhook Discord

1. Ouvrez Discord et allez dans votre serveur
2. Cliquez sur la roue dentée à côté du nom du serveur
3. Allez dans **Intégrations** > **Webhooks**
4. Cliquez sur **Nouveau webhook**
5. Donnez-lui un nom (ex: "EvoluVote Bot")
6. Choisissez le canal pour les notifications
7. Copiez l'URL du webhook
8. Collez l'URL dans votre fichier `.env`

### Tester les notifications

```bash
# Éditer le .env pour ajouter le webhook
nano /opt/evoluvote/.env

# Ajouter/modifier la ligne WEBHOOK_URL
WEBHOOK_URL=https://discord.com/api/webhooks/xxxxx/xxxxx

# Sauvegarder et tester
cd /opt/evoluvote
sudo -u evoluvote bash -c "TASK=vote90 node src/index.js"
```

## 📊 Commandes utiles

### Gestion des services

```bash
# Arrêter un timer temporairement
sudo systemctl stop evoluvote-90m.timer

# Redémarrer un timer
sudo systemctl restart evoluvote-90m.timer

# Désactiver un timer au démarrage
sudo systemctl disable evoluvote-90m.timer

# Réactiver un timer
sudo systemctl enable evoluvote-90m.timer

# Forcer une exécution immédiate
sudo systemctl start evoluvote-90m.service
```

### Monitoring

```bash
# Voir tous les timers actifs
systemctl list-timers

# Historique des exécutions
journalctl -u evoluvote-90m --since="1 hour ago"

# Dernières erreurs
journalctl -u evoluvote-90m -p err -n 50
```

### Mise à jour du bot

```bash
# Arrêter les timers
sudo systemctl stop evoluvote-90m.timer
sudo systemctl stop evoluvote-24h.timer

# Mettre à jour les fichiers
cd /opt/evoluvote
# ... copier les nouveaux fichiers ...

# Redémarrer les timers
sudo systemctl start evoluvote-90m.timer
sudo systemctl start evoluvote-24h.timer
```

## 🛡️ Gestion des captchas

### Comportement automatique

- **Vote 90 min** : Pas de captcha normalement (si option payante active)
- **Vote 24h** : Si captcha détecté :
  1. 🔴 Notification Discord envoyée avec l'URL
  2. ⏸️ Bot en pause 15 minutes
  3. 👤 Vous devez résoudre manuellement
  4. ▶️ Le bot reprend automatiquement

### Résolution manuelle d'un captcha

1. Recevez la notification Discord
2. Cliquez sur l'URL dans la notification
3. Résolvez le captcha dans votre navigateur
4. Le bot reprendra automatiquement après la pause

## ❓ Dépannage

### Le bot ne démarre pas

```bash
# Vérifier les erreurs
journalctl -xe | grep evoluvote

# Vérifier que Node.js est installé
node --version  # Doit afficher v20.x.x

# Réinstaller si nécessaire
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Erreur "PLAYER_NAME non défini"

```bash
# Vérifier le fichier .env
cat /opt/evoluvote/.env

# S'assurer que PLAYER_NAME est bien défini
sudo nano /opt/evoluvote/.env
```

### Les timers ne se lancent pas

```bash
# Recharger systemd
sudo systemctl daemon-reload

# Activer les timers
sudo systemctl enable evoluvote-90m.timer
sudo systemctl enable evoluvote-24h.timer

# Démarrer les timers
sudo systemctl start evoluvote-90m.timer
sudo systemctl start evoluvote-24h.timer
```

### Erreur Playwright

```bash
# Réinstaller les navigateurs
cd /opt/evoluvote
sudo -u evoluvote npx playwright install chromium

# Si erreur de dépendances
sudo apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libdbus-1-3 libatspi2.0-0
```

## 🎯 Checklist de validation

Après l'installation, vérifiez que :

- [ ] Les timers sont actifs : `systemctl status evoluvote-*.timer`
- [ ] Un test manuel fonctionne : `TASK=vote90 node src/index.js`
- [ ] Les logs s'affichent correctement : `journalctl -u evoluvote-90m -n 20`
- [ ] Les notifications Discord arrivent (si configuré)
- [ ] Les prochaines exécutions sont planifiées : `systemctl list-timers`

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** : `journalctl -u evoluvote-* -n 50`
2. **Consultez la section dépannage** ci-dessus
3. **Testez manuellement** pour identifier le problème
4. **Vérifiez votre configuration** dans `.env` et `config.json`

---

🎉 **Félicitations !** Votre bot est maintenant installé et votera automatiquement pour vous !

⏰ **Rappel des fréquences** :
- Vote 90 minutes : toutes les 1h30
- Vote 24 heures : toutes les 24h

💡 **Astuce** : Gardez ce guide pour référence future et mises à jour !