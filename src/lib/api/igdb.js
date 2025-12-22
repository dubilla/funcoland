// IGDB API Client
// Documentation: https://api-docs.igdb.com/

// IGDB requires Twitch API auth
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || '8s9eel47jcvmer97ji0wepn9okm9c5';
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || 'jhtxm4firftf11aw0c2kemlgjb5ibk';
const IGDB_ENDPOINT = 'https://api.igdb.com/v4';

// Auth token cache
let authToken = null;
let tokenExpiry = null;

/**
 * Get an access token for the IGDB API
 * @returns {Promise<string>} Access token
 */
async function getAccessToken() {
  // Return cached token if it's still valid
  if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
    return authToken;
  }

  try {
    const response = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error(`Failed to get Twitch token: ${response.statusText}`);
    }

    const data = await response.json();
    authToken = data.access_token;
    // Set expiry 10 seconds before actual expiry to be safe
    tokenExpiry = Date.now() + (data.expires_in - 10) * 1000;
    
    return authToken;
  } catch (error) {
    console.error('Error getting IGDB access token:', error);
    throw error;
  }
}

/**
 * Execute a query against the IGDB API
 * @param {string} endpoint - API endpoint (e.g., 'games', 'covers')
 * @param {string} query - IGDB query language string
 * @returns {Promise<Array>} - Query results
 */
async function executeQuery(endpoint, query) {
  try {
    console.log('[IGDB] Getting access token...');
    const token = await getAccessToken();
    console.log('[IGDB] Token obtained:', token ? 'yes' : 'no');

    console.log('[IGDB] Fetching:', `${IGDB_ENDPOINT}/${endpoint}`);
    const response = await fetch(`${IGDB_ENDPOINT}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body: query
    });

    console.log('[IGDB] Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[IGDB] Error response:', errorText);
      throw new Error(`IGDB API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[IGDB] Response data:', Array.isArray(data) ? `Array(${data.length})` : typeof data);
    return data;
  } catch (error) {
    console.error(`[IGDB] Error querying IGDB ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Search for games by name
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results (default: 20)
 * @param {number} offset - Results offset for pagination (default: 0)
 * @returns {Promise<Array>} - Search results
 */
export async function searchGames(query, limit = 20, offset = 0) {
  console.log('[IGDB] searchGames called with:', { query, limit, offset });

  // IGDB search syntax: search keyword cannot be combined with where clause
  // Using search alone to get best results
  const igdbQuery = `search "${query}";
fields name, cover, first_release_date, summary;
limit ${limit};`;

  console.log('[IGDB] Executing query:', igdbQuery);
  const games = await executeQuery('games', igdbQuery);
  console.log('[IGDB] Games returned from API:', games.length);

  // If we have games with covers, fetch cover images
  if (games.length > 0) {
    const gameIds = games.filter(game => game.cover).map(game => game.cover);
    console.log('[IGDB] Games with covers:', gameIds.length);

    if (gameIds.length > 0) {
      const coverQuery = `
        fields url, game;
        where id = (${gameIds.join(',')});
      `;

      const covers = await executeQuery('covers', coverQuery);
      console.log('[IGDB] Covers fetched:', covers.length);

      // Add cover URLs to the games
      for (const game of games) {
        if (game.cover) {
          const cover = covers.find(c => c.id === game.cover);
          if (cover) {
            // Convert to https and get the big cover image
            game.cover_url = cover.url.replace('//images.igdb.com', 'https://images.igdb.com').replace('thumb', 'cover_big');
          }
        }
      }
    }
  }

  console.log('[IGDB] Returning', games.length, 'games');
  return games;
}

/**
 * Get game details by IGDB ID
 * @param {number} id - IGDB game ID
 * @returns {Promise<Object>} - Game details
 */
export async function getGameDetails(id) {
  const igdbQuery = `
    fields name, cover, first_release_date, summary, storyline, involved_companies.company.name, genres.name,
    platforms.name, age_ratings.rating, total_rating, total_rating_count;
    where id = ${id};
  `;
  
  const games = await executeQuery('games', igdbQuery);
  
  if (games.length === 0) {
    throw new Error(`Game with ID ${id} not found`);
  }
  
  const game = games[0];
  
  // Fetch cover image if available
  if (game.cover) {
    const coverQuery = `
      fields url;
      where id = ${game.cover};
    `;
    
    const covers = await executeQuery('covers', coverQuery);
    
    if (covers.length > 0) {
      // Convert to https and get the big cover image
      game.cover_url = covers[0].url.replace('//images.igdb.com', 'https://images.igdb.com').replace('thumb', 'cover_big');
    }
  }
  
  return game;
}

/**
 * Map IGDB game data to our Game model
 * @param {Object} igdbGame - IGDB game data
 * @returns {Object} - Game data formatted for our database
 */
export function mapIgdbGameToModel(igdbGame) {
  // Extract developer and publisher from involved companies
  let developer = null;
  let publisher = null;
  
  if (igdbGame.involved_companies) {
    for (const company of igdbGame.involved_companies) {
      if (company.developer) {
        developer = company.company?.name;
      }
      if (company.publisher) {
        publisher = company.company?.name;
      }
    }
  }
  
  return {
    title: igdbGame.name,
    apiId: String(igdbGame.id),
    apiSource: 'IGDB',
    coverImageUrl: igdbGame.cover_url || null,
    releaseDate: igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000) : null,
    publisher: publisher,
    developer: developer,
    description: igdbGame.summary || igdbGame.storyline || '',
  };
}