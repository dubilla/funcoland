// RAWG Video Games Database API client
// https://rawg.io/apidocs

// Get API key from environment variable or use demo key
const RAWG_API_KEY = process.env.RAWG_API_KEY || '6f5aaaa8de3344bead4e2ec6b67d3d64';
const RAWG_BASE_URL = 'https://api.rawg.io/api';

// Log API key status (without exposing the actual key)
console.log('RAWG API Key status:', RAWG_API_KEY ? 'Available' : 'Missing');

/**
 * Search for games by name
 * @param {string} query - Search query
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Number of results per page (default: 20, max: 40)
 * @returns {Promise<Object>} - Search results
 */
export async function searchGames(query, page = 1, pageSize = 20) {
  const url = new URL(`${RAWG_BASE_URL}/games`);
  url.searchParams.append('key', RAWG_API_KEY);
  url.searchParams.append('search', query);
  url.searchParams.append('page', page);
  url.searchParams.append('page_size', pageSize);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to search games: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get game details by RAWG ID
 * @param {number} id - RAWG game ID
 * @returns {Promise<Object>} - Game details
 */
export async function getGameDetails(id) {
  const url = new URL(`${RAWG_BASE_URL}/games/${id}`);
  url.searchParams.append('key', RAWG_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to get game details: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Map RAWG game data to our Game model
 * @param {Object} rawgGame - RAWG game data
 * @returns {Object} - Game data formatted for our database
 */
export function mapRawgGameToModel(rawgGame) {
  return {
    title: rawgGame.name,
    apiId: String(rawgGame.id),
    apiSource: 'RAWG',
    coverImageUrl: rawgGame.background_image,
    releaseDate: rawgGame.released ? new Date(rawgGame.released) : null,
    publisher: rawgGame.publishers?.[0]?.name,
    developer: rawgGame.developers?.[0]?.name,
    description: rawgGame.description_raw,
    // Note: RAWG doesn't provide HLTB data, we'll need to fill that in separately
  };
}