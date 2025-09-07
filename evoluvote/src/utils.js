/**
 * Utilitaires pour le bot EvoluCraft
 */

/**
 * Envoie une notification Discord via webhook
 */
export async function sendDiscordNotification(message) {
  const webhookUrl = process.env.WEBHOOK_URL;
  
  if (!webhookUrl) {
    return; // Pas de webhook configuré
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: message,
        username: 'EvoluVote Bot',
        avatar_url: 'https://evolucraft.fr/favicon.ico'
      })
    });
    
    if (!response.ok) {
      console.error(`Erreur Discord: ${response.status}`);
    }
  } catch (error) {
    console.error('Erreur envoi Discord:', error.message);
  }
}

/**
 * Formatte une date en français
 */
export function formatDate(date = new Date()) {
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Paris'
  };
  
  return date.toLocaleString('fr-FR', options);
}

/**
 * Logger avec timestamp
 */
export function log(message, level = 'info') {
  const timestamp = formatDate();
  const prefix = {
    'info': 'ℹ️',
    'success': '✅',
    'warn': '⚠️',
    'error': '❌',
    'debug': '🔍'
  }[level] || '';
  
  console.log(`[${timestamp}] ${prefix} ${message}`);
}