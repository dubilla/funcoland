// HowLongToBeat API client
// Using dynamic import to avoid server-side transpilation issues
let hltbService = null;

async function getHltbService() {
  if (!hltbService) {
    try {
      const { HowLongToBeatService } = await import('howlongtobeat');
      hltbService = new HowLongToBeatService();
    } catch (error) {
      console.error('Error initializing HLTB service:', error);
      // Return a minimal mock service for fallback
      return {
        search: async () => [] 
      };
    }
  }
  return hltbService;
}

/**
 * Search for a game on HowLongToBeat
 * @param {string} title - Game title to search for
 * @returns {Promise<Object|null>} - HLTB game data or null if not found
 */
export async function searchHltbGame(title) {
  try {
    const service = await getHltbService();
    const results = await service.search(title);
    
    if (results && results.length > 0) {
      // Sort by similarity to get the best match
      return results[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error searching HLTB:', error);
    return null;
  }
}

/**
 * Get game completion times from HowLongToBeat
 * @param {string} title - Game title to search for
 * @returns {Promise<Object>} - Object with main and completionist time in minutes
 */
export async function getGameCompletionTimes(title) {
  const game = await searchHltbGame(title);
  
  if (!game) {
    return {
      hltbMainTime: null,
      hltbCompletionTime: null,
    };
  }
  
  return {
    hltbMainTime: game.gameplayMain > 0 ? Math.round(game.gameplayMain * 60) : null, // Convert hours to minutes
    hltbCompletionTime: game.gameplayCompletionist > 0 ? Math.round(game.gameplayCompletionist * 60) : null,
  };
}