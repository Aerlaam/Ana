#!/usr/bin/env node
import { chromium } from 'playwright';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { sendDiscordNotification, log, formatDate } from './utils.js';

// Charger les variables d'environnement
config();

// Charger la configuration
const configData = JSON.parse(readFileSync('./config.json', 'utf8'));

// Récupérer la tâche depuis les variables d'environnement
const TASK = process.env.TASK || 'vote90';
const PLAYER_NAME = process.env.PLAYER_NAME;
const HEADLESS = process.env.HEADLESS === 'true';

if (!PLAYER_NAME) {
  log('❌ Erreur: PLAYER_NAME non défini dans .env', 'error');
  process.exit(1);
}

// Configuration de la tâche actuelle
const siteConfig = configData.sites[TASK];
if (!siteConfig) {
  log(`❌ Erreur: Tâche "${TASK}" non trouvée dans config.json`, 'error');
  process.exit(1);
}

/**
 * Tente de trouver et cliquer un élément avec plusieurs sélecteurs
 */
async function tryMultipleSelectors(page, selectors, action = 'click') {
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        if (action === 'fill') {
          await element.fill(PLAYER_NAME);
          log(`✓ Pseudo rempli avec le sélecteur: ${selector}`, 'debug');
        } else if (action === 'click') {
          await element.click();
          log(`✓ Cliqué sur: ${selector}`, 'debug');
        }
        return true;
      }
    } catch (err) {
      // Continuer avec le prochain sélecteur
    }
  }
  return false;
}

/**
 * Fonction principale de vote
 */
async function performVote() {
  const startTime = new Date();
  log(`🚀 Démarrage du vote ${TASK} pour ${PLAYER_NAME}`, 'info');
  await sendDiscordNotification(`🚀 **Démarrage vote ${TASK}**\nJoueur: ${PLAYER_NAME}`);

  let browser;
  
  try {
    // Lancer le navigateur
    browser = await chromium.launch({
      headless: HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    // Étape 1: Aller sur la page de vote
    log(`📍 Navigation vers ${configData.baseUrl}`, 'info');
    await page.goto(configData.baseUrl, { 
      waitUntil: 'networkidle',
      timeout: configData.timeouts.navigationMs 
    });
    
    // Étape 2: Remplir le pseudo si présent
    const pseudoFilled = await tryMultipleSelectors(
      page, 
      configData.selectors.playerInputOnEvolu, 
      'fill'
    );
    
    if (pseudoFilled) {
      log('✓ Pseudo rempli sur la page EvoluCraft', 'info');
    } else {
      log('ℹ️ Pas de champ pseudo trouvé sur la page principale', 'debug');
    }
    
    // Étape 3: Trouver et cliquer le bouton de vote
    let voteButtons = [];
    for (const selector of configData.selectors.voteButtonsOnEvolu) {
      const buttons = await page.$$(selector);
      voteButtons = voteButtons.concat(buttons);
    }
    
    if (voteButtons.length === 0) {
      throw new Error('Aucun bouton de vote trouvé sur la page');
    }
    
    log(`📊 ${voteButtons.length} bouton(s) de vote trouvé(s)`, 'debug');
    
    const buttonIndex = siteConfig.indexOnEvoluPage;
    if (buttonIndex >= voteButtons.length) {
      throw new Error(`Index ${buttonIndex} invalide (seulement ${voteButtons.length} boutons)`);
    }
    
    // Cliquer et attendre le nouvel onglet
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      voteButtons[buttonIndex].click()
    ]);
    
    log('✓ Bouton de vote cliqué, nouvel onglet ouvert', 'info');
    
    // Étape 4: Traiter le site externe
    await newPage.waitForLoadState('networkidle', { 
      timeout: configData.timeouts.navigationMs 
    });
    
    const externalUrl = newPage.url();
    log(`📍 Navigation vers site externe: ${externalUrl}`, 'info');
    
    // Remplir le pseudo sur le site externe
    const externalPseudoFilled = await tryMultipleSelectors(
      newPage,
      configData.selectors.externalPlayerInputs,
      'fill'
    );
    
    if (externalPseudoFilled) {
      log('✓ Pseudo rempli sur le site externe', 'info');
      await newPage.waitForTimeout(500); // Petite pause après remplissage
    }
    
    // Soumettre le vote
    const submitClicked = await tryMultipleSelectors(
      newPage,
      configData.selectors.externalSubmitButtons,
      'click'
    );
    
    if (!submitClicked) {
      throw new Error('Impossible de trouver le bouton de soumission');
    }
    
    log('✓ Vote soumis', 'info');
    
    // Attendre le chargement de la réponse
    await newPage.waitForLoadState('networkidle', {
      timeout: configData.timeouts.navigationMs
    });
    await newPage.waitForTimeout(configData.timeouts.idleAfterSubmitMs);
    
    // Vérifier le résultat
    const pageContent = await newPage.content();
    const pageText = await newPage.innerText('body');
    
    // Détection de captcha
    const captchaRegex = new RegExp(configData.captcha.detectRegex, 'i');
    if (captchaRegex.test(pageText)) {
      log('🛑 CAPTCHA DÉTECTÉ!', 'warn');
      await sendDiscordNotification(
        `🛑 **CAPTCHA détecté sur ${TASK}**\n` +
        `URL: ${externalUrl}\n` +
        `Le bot va attendre ${configData.captcha.manualWaitMinutes} minutes pour résolution manuelle.`
      );
      
      // Pause pour résolution manuelle
      const waitMs = configData.captcha.manualWaitMinutes * 60 * 1000;
      log(`⏸️ Pause de ${configData.captcha.manualWaitMinutes} minutes pour résolution manuelle...`, 'info');
      await new Promise(resolve => setTimeout(resolve, waitMs));
      
      throw new Error('Captcha détecté - intervention manuelle requise');
    }
    
    // Vérifier le succès
    let voteSuccess = false;
    for (const successText of siteConfig.expectSuccess) {
      if (pageText.toLowerCase().includes(successText.toLowerCase())) {
        voteSuccess = true;
        log(`✅ Vote réussi! (texte trouvé: "${successText}")`, 'success');
        break;
      }
    }
    
    if (!voteSuccess) {
      log('⚠️ Succès non confirmé - vérifier manuellement', 'warn');
      await sendDiscordNotification(
        `⚠️ **Vote ${TASK} - Succès non confirmé**\n` +
        `Joueur: ${PLAYER_NAME}\n` +
        `URL: ${externalUrl}\n` +
        `Réponse: ${pageText.substring(0, 200)}...`
      );
    } else {
      const duration = Math.round((new Date() - startTime) / 1000);
      await sendDiscordNotification(
        `✅ **Vote ${TASK} réussi!**\n` +
        `Joueur: ${PLAYER_NAME}\n` +
        `Durée: ${duration}s`
      );
    }
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'error');
    await sendDiscordNotification(
      `❌ **Erreur vote ${TASK}**\n` +
      `Joueur: ${PLAYER_NAME}\n` +
      `Erreur: ${error.message}`
    );
    throw error;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Exécution principale
(async () => {
  try {
    await performVote();
    log(`✨ Vote ${TASK} terminé avec succès`, 'success');
    process.exit(0);
  } catch (error) {
    log(`❌ Échec du vote ${TASK}: ${error.message}`, 'error');
    process.exit(1);
  }
})();