// utils.js - Fonctions métier testables

/**
 * Valide qu'un nom de ligne de métro est correct
 * @param {string} name - Nom de la ligne
 * @returns {boolean}
 */
function validateMetroLineName(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }

  // Nom doit faire entre 3 et 50 caractères
  if (name.length < 3 || name.length > 50) {
    return false;
  }

  return true;
}

/**
 * Valide qu'une couleur est dans la liste autorisée
 * @param {string} color - Nom de la couleur
 * @returns {boolean}
 */
function validateMetroLineColor(color) {
  const validColors = [
    'Jaune', 'Vert', 'Violet', 'Rouge', 'Bleu',
    'Rose', 'Orange', 'Marron', 'Turquoise'
  ];

  return validColors.includes(color);
}

/**
 * Calcule le temps restant avant le dernier métro
 * @param {string} lastMetroTime - Format "HH:MM"
 * @returns {number} Minutes restantes (ou négatif si passé)
 */
function minutesUntilLastMetro(lastMetroTime) {
  const [hours, minutes] = lastMetroTime.split(':').map(Number);
  const now = new Date();
  const lastMetro = new Date();
  lastMetro.setHours(hours, minutes, 0, 0);

  const diffMs = lastMetro - now;
  const diffMin = Math.floor(diffMs / 60000);

  return diffMin;
}

module.exports = {
  validateMetroLineName,
  validateMetroLineColor,
  minutesUntilLastMetro,
};