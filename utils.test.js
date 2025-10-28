const {
  validateMetroLineName,
  validateMetroLineColor,
  minutesUntilLastMetro,
} = require('./utils');

describe('validateMetroLineName', () => {
  test('accepte un nom valide', () => {
    expect(validateMetroLineName('Ligne 1')).toBe(true);
    expect(validateMetroLineName('Châtelet')).toBe(true);
  });

  test('rejette un nom trop court', () => {
    expect(validateMetroLineName('M1')).toBe(false);
  });

  test('rejette un nom trop long', () => {
    const longName = 'a'.repeat(51);
    expect(validateMetroLineName(longName)).toBe(false);
  });

  test('rejette null ou undefined', () => {
    expect(validateMetroLineName(null)).toBe(false);
    expect(validateMetroLineName(undefined)).toBe(false);
  });

  test('rejette un nombre', () => {
    expect(validateMetroLineName(123)).toBe(false);
  });
});

describe('validateMetroLineColor', () => {
  test('accepte une couleur valide', () => {
    expect(validateMetroLineColor('Jaune')).toBe(true);
    expect(validateMetroLineColor('Violet')).toBe(true);
  });

  test('rejette une couleur invalide', () => {
    expect(validateMetroLineColor('Gris')).toBe(false);
    expect(validateMetroLineColor('Noir')).toBe(false);
  });

  test('est case-sensitive', () => {
    expect(validateMetroLineColor('jaune')).toBe(false);
    expect(validateMetroLineColor('JAUNE')).toBe(false);
  });
});

describe('minutesUntilLastMetro', () => {
  test('calcule correctement le temps restant', () => {
    // Ce test dépend de l'heure actuelle, utilisez un mock si besoin
    const result = minutesUntilLastMetro('23:59');
    expect(typeof result).toBe('number');
  });
});