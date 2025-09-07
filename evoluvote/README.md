# 🎮 EvoluVote Bot - Bot de vote automatisé pour EvoluCraft

Bot Playwright automatisant les votes sur [EvoluCraft](https://evolucraft.fr/vote) avec précision horaire stricte et gestion intelligente des captchas.

## ✨ Fonctionnalités

- **🎯 Votes automatisés** : 90 minutes et 24 heures
- **⏰ Précision horaire** : Timers systemd avec AccuracySec=1s
- **🛡️ Gestion des captchas** : Détection et pause pour résolution manuelle
- **🔔 Notifications Discord** : Monitoring en temps réel
- **🔄 Fallback intelligent** : Multiples sélecteurs pour robustesse maximale
- **📊 Logs détaillés** : Traçabilité complète en français
- **🚀 Haute disponibilité** : Redémarrage automatique après reboot

## 📋 Prérequis

- **Ubuntu 20.04+** ou Debian 11+
- **Node.js 20+**
- **Systemd** (pour l'automatisation)
- Compte Discord avec webhook (optionnel)

## 🚀 Installation rapide

### 1. Cloner le projet
```bash
git clone https://github.com/yourusername/evoluvote.git
cd evoluvote
```

### 2. Configuration
```bash
cp .env.example .env
nano .env
```

Configurer les variables :
```env
PLAYER_NAME=TonPseudo
WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx  # Optionnel
HEADLESS=true
```

### 3. Installation automatique (recommandé)
```bash
sudo bash scripts/install_systemd.sh
```

Le script va :
- Installer Node.js 20 si nécessaire
- Installer les dépendances système
- Créer un utilisateur système dédié
- Configurer les services systemd
- Démarrer les timers automatiquement

## 🧪 Tests manuels

### Test vote 90 minutes
```bash
bash scripts/test_run.sh vote90
```

### Test vote 24 heures
```bash
bash scripts/test_run.sh vote24
```

## 🔧 Configuration avancée

### Structure de `config.json`

```json
{
  "sites": {
    "vote90": {
      "indexOnEvoluPage": 0,  // Premier bouton
      "expectSuccess": ["Vote enregistré", "Merci", "Déjà voté"]
    },
    "vote24": {
      "indexOnEvoluPage": 1,  // Deuxième bouton
      "expectSuccess": ["Vote enregistré", "Merci", "success"]
    }
  },
  "captcha": {
    "detectRegex": "(captcha|recaptcha|hcaptcha)",
    "manualWaitMinutes": 15  // Temps d'attente pour résolution
  }
}
```

### Personnaliser les sélecteurs

Éditer `config.json` pour ajouter vos propres sélecteurs :

```json
"selectors": {
  "voteButtonsOnEvolu": [
    "a[href*='vote']",
    ".custom-vote-btn",  // Votre sélecteur personnalisé
    "#my-vote-button"
  ]
}
```

## 📊 Monitoring

### Voir les logs en temps réel
```bash
# Logs vote 90 minutes
journalctl -u evoluvote-90m -f

# Logs vote 24 heures
journalctl -u evoluvote-24h -f

# Tous les logs
journalctl -u 'evoluvote-*' -f
```

### Vérifier le status des timers
```bash
systemctl status evoluvote-90m.timer
systemctl status evoluvote-24h.timer

# Prochaines exécutions
systemctl list-timers evoluvote*
```

### Commandes de gestion
```bash
# Arrêter un timer
sudo systemctl stop evoluvote-90m.timer

# Redémarrer un timer
sudo systemctl restart evoluvote-90m.timer

# Désactiver au démarrage
sudo systemctl disable evoluvote-90m.timer

# Forcer une exécution immédiate
sudo systemctl start evoluvote-90m.service
```

## 🐳 Docker (alternatif)

### Build et lancement
```bash
docker compose up -d
```

⚠️ **Note** : Docker Compose n'offre pas la même précision horaire que systemd. L'utilisation de systemd est fortement recommandée pour une précision optimale.

## 🛡️ Gestion des captchas

Le bot détecte automatiquement les captchas et :
1. 🔴 Envoie une notification Discord
2. ⏸️ Se met en pause (15 minutes par défaut)
3. 👤 Attend une résolution manuelle
4. ▶️ Reprend automatiquement après la pause

### Résolution manuelle
1. Recevoir la notification Discord avec l'URL
2. Ouvrir l'URL dans votre navigateur
3. Résoudre le captcha manuellement
4. Le bot reprendra automatiquement

## 📝 Structure du projet

```
evoluvote/
├── src/
│   ├── index.js        # Logique principale
│   └── utils.js        # Utilitaires (logs, Discord)
├── systemd/            # Services et timers
├── scripts/            # Scripts d'installation
├── config.json         # Configuration
├── .env               # Variables d'environnement
└── README.md          # Documentation
```

## 🔍 Dépannage

### Le bot ne trouve pas les boutons
- Vérifier les sélecteurs dans `config.json`
- Lancer en mode `HEADLESS=false` pour debug visuel
- Vérifier que l'index du bouton est correct

### Erreurs de navigation
- Augmenter `navigationMs` dans `config.json`
- Vérifier la connexion internet
- Vérifier que le site est accessible

### Timer ne se lance pas
```bash
# Vérifier les erreurs
journalctl -xe | grep evoluvote

# Recharger la configuration
sudo systemctl daemon-reload
sudo systemctl restart evoluvote-90m.timer
```

### Captcha non détecté
- Ajouter des patterns dans `captcha.detectRegex`
- Vérifier les logs pour voir le contenu de la page

## 📄 Licence

MIT

## 🤝 Support

Pour toute question ou problème :
1. Vérifier les logs avec `journalctl`
2. Consulter la section Dépannage
3. Ouvrir une issue sur GitHub

---

**⚠️ Disclaimer** : Ce bot est fourni à titre éducatif. Respectez les conditions d'utilisation d'EvoluCraft.