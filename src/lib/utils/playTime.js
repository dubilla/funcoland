/**
 * Get effective main time (custom override or HLTB fallback)
 * @param {Object} userGame - UserGame object with customMainTime and game.hltbMainTime
 * @returns {number|null} - Time in minutes or null
 */
export function getEffectiveMainTime(userGame) {
  if (!userGame) return null;
  return userGame.customMainTime || userGame.game?.hltbMainTime || null;
}

/**
 * Get effective completion time (custom override or HLTB fallback)
 * @param {Object} userGame - UserGame object with customCompletionTime and game.hltbCompletionTime
 * @returns {number|null} - Time in minutes or null
 */
export function getEffectiveCompletionTime(userGame) {
  if (!userGame) return null;
  return userGame.customCompletionTime || userGame.game?.hltbCompletionTime || null;
}

/**
 * Format time in hours
 * @param {number} minutes - Time in minutes
 * @returns {string} - Formatted time string
 */
export function formatHours(minutes) {
  if (!minutes) return '0h';
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

/**
 * Format time in hours and minutes
 * @param {number} minutes - Time in minutes
 * @returns {string} - Formatted time string
 */
export function formatTime(minutes) {
  if (!minutes) return 'Unknown';

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours === 0) return `${mins} minutes`;
  if (mins === 0) return `${hours} hours`;
  return `${hours} hours, ${mins} minutes`;
}
