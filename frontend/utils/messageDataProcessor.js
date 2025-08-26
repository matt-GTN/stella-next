/**
 * Utilitaires de traitement des données de message pour la rétrocompatibilité
 * Assure que les appels d'outils sont correctement formatés pour le nouveau système de visualisation graphique
 */

/**
 * Normalise les appels d'outils pour assurer la compatibilité avec les anciens et nouveaux systèmes de visualisation
 * @param {Array} toolCalls - Appels d'outils bruts provenant de diverses sources
 * @returns {Array} Appels d'outils normalisés
 */
export function normalizeToolCalls(toolCalls = []) {
  // S'assurer que toolCalls est défini et est un tableau
  if (toolCalls === undefined || toolCalls === null) {
    return [];
  }

  if (!Array.isArray(toolCalls)) {
    console.warn('Les appels d\'outils ne sont pas un tableau:', toolCalls);
    return [];
  }

  // Créer un nouveau tableau pour éviter les problèmes de référence et la zone morte temporelle
  let toolCallsArray;
  try {
    toolCallsArray = Array.from(toolCalls);
  } catch (error) {
    console.error('Erreur lors de la création du tableau à partir de toolCalls:', error);
    return [];
  }

  // Vérification de sécurité supplémentaire
  if (!toolCallsArray || !Array.isArray(toolCallsArray)) {
    console.error('Échec de la création d\'un tableau sécurisé à partir de toolCalls');
    return [];
  }

  return toolCallsArray.map((toolCall, index) => {
    if (!toolCall || typeof toolCall !== 'object') {
      console.warn(`Invalid tool call at index ${index}:`, toolCall);
      return {
        name: `unknown_tool_${index}`,
        args: {},
        status: 'error',
        error: 'Invalid tool call format'
      };
    }

    // Gérer différents formats provenant du backend
    const normalized = {
      // Gestion du nom - support de multiples formats
      name: toolCall.name || toolCall.tool_name || toolCall.function?.name || toolCall.tool || `outil_inconnu_${index}`,

      // Gestion des arguments - support de multiples formats
      args: toolCall.args || toolCall.arguments || toolCall.input || toolCall.parameters || {},

      // Statut et informations d'exécution
      status: toolCall.status || (toolCall.error ? 'error' : 'completed'),
      error: toolCall.error || null,
      result: toolCall.result || toolCall.output || null,

      // Informations de timing
      executionTime: toolCall.executionTime || toolCall.execution_time || toolCall.duration || 0,
      timestamp: toolCall.timestamp || Date.now(),

      // Métadonnées supplémentaires
      index: index,
      sessionId: toolCall.sessionId || null
    };

    return normalized;
  });
}

/**
 * Valide les données de message pour la compatibilité avec la visualisation graphique
 * @param {Object} message - Objet message
 * @returns {Object} Résultat de validation avec données normalisées
 */
export function validateMessageForVisualization(message) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    normalizedMessage: { ...message }
  };

  // Valider la structure du message
  if (!message || typeof message !== 'object') {
    validation.isValid = false;
    validation.errors.push('Le message n\'est pas un objet valide');
    return validation;
  }

  // Normaliser les appels d'outils si présents (gérer les formats toolCalls et tool_calls)
  const toolCalls = message.toolCalls || message.tool_calls;
  if (toolCalls) {
    try {
      validation.normalizedMessage.toolCalls = normalizeToolCalls(toolCalls);

      // Vérifier les appels d'outils invalides
      const invalidCalls = validation.normalizedMessage.toolCalls.filter(tc => tc.status === 'error' && tc.error === 'Format d\'appel d\'outil invalide');
      if (invalidCalls.length > 0) {
        validation.warnings.push(`${invalidCalls.length} appels d'outils avaient un format invalide et ont été normalisés`);
      }
    } catch (error) {
      validation.errors.push(`Erreur lors de la normalisation des appels d'outils: ${error.message}`);
      validation.normalizedMessage.toolCalls = [];
    }
  }

  // S'assurer que chaque message a un ID unique pour la visualisation
  if (!validation.normalizedMessage.id) {
    validation.normalizedMessage.id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    validation.warnings.push('L\'ID du message était manquant, ID unique généré');
  }

  // S'assurer que sessionId est présent pour la visualisation graphique - utiliser l'ID du message comme identifiant unique
  if (!validation.normalizedMessage.sessionId) {
    validation.normalizedMessage.sessionId = validation.normalizedMessage.id;
    validation.warnings.push('SessionId était manquant, utilisation de l\'ID du message comme identifiant de session unique');
  }

  return validation;
}

/**
 * Traite le message pour la rétrocompatibilité avec le système de chat existant
 * @param {Object} message - Message brut provenant de l'API ou du stockage
 * @returns {Object} Message traité prêt pour le rendu
 */
export function processMessageForChat(message) {
  // S'assurer que le message existe et a une structure de base
  if (!message || typeof message !== 'object') {
    console.error('Message invalide fourni à processMessageForChat:', message);
    return {
      id: 'error-' + Date.now(),
      type: 'assistant',
      content: '',
      toolCalls: [],
      initialContent: '',
      finalContent: '',
      timestamp: new Date(),
      hasVisualizationError: true,
      visualizationErrors: ['Objet message invalide']
    };
  }

  const validation = validateMessageForVisualization(message);

  if (!validation.isValid) {
    console.error('Échec de la validation du message:', validation.errors);
    // Retourner un message de secours sécurisé
    return {
      ...message,
      toolCalls: [],
      initialContent: message.initialContent || '',
      finalContent: message.finalContent || '',
      hasVisualizationError: true,
      visualizationErrors: validation.errors
    };
  }

  if (validation.warnings.length > 0) {
    console.warn('Avertissements de traitement du message:', validation.warnings);
  }

  // Gérer la rétrocompatibilité pour les anciens noms de champs
  const normalizedMessage = { ...validation.normalizedMessage };

  // Convertir les anciens noms de champs vers le nouveau format
  if (message.role && !normalizedMessage.type) {
    normalizedMessage.type = message.role;
  }
  if (message.message && !normalizedMessage.content) {
    normalizedMessage.content = message.message;
  }
  if (message.tools && !normalizedMessage.toolCalls) {
    normalizedMessage.toolCalls = normalizeToolCalls(message.tools);
  }

  // S'assurer que les champs critiques sont initialisés
  const processedMessage = {
    ...normalizedMessage,
    toolCalls: normalizedMessage.toolCalls || [],
    initialContent: normalizedMessage.initialContent || '',
    finalContent: normalizedMessage.finalContent || '',
    // S'assurer que chaque message a un ID unique pour la visualisation de trace
    id: normalizedMessage.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    sessionId: normalizedMessage.sessionId || normalizedMessage.id || `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  };

  return processedMessage;
}

/**
 * Vérifie si un message a une activité d'agent (appels d'outils ou contenu de raisonnement)
 * @param {Object} message - Objet message
 * @param {number} messageIndex - Index du message dans la conversation (optionnel)
 * @returns {boolean} True si le message a une activité d'agent
 */
export function hasAgentActivity(message, messageIndex = null) {
  // Afficher le chemin de décision de l'agent pour tous les messages d'assistant sauf le premier
  if (!message || message.type !== 'assistant') {
    return false;
  }

  // Vérification supplémentaire : si le message n'a pas d'appels d'outils et est très court, pourrait être un salut
  const isLikelyGreeting = (!message.toolCalls || message.toolCalls.length === 0) &&
    (!message.initialContent && !message.finalContent) &&
    message.content && message.content.length < 150;

  // Exclure seulement si c'est probablement le premier message ET ressemble à un salut
  if ((messageIndex === 0 || messageIndex === 1) && isLikelyGreeting) {
    return false;
  }

  // Afficher pour tous les autres messages d'assistant pour permettre de voir le chemin de décision de l'agent
  return true;
}
