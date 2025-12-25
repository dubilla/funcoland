// Game service for interacting with games across different APIs and our database
import * as igdbApi from '../api/igdb';
import * as hltbApi from '../api/hltb';
import prisma from '../db';

// State machine: defines valid transitions from each state
export const STATE_TRANSITIONS = {
  WISHLIST: ['BACKLOG', 'CURRENTLY_PLAYING'],
  BACKLOG: ['WISHLIST', 'CURRENTLY_PLAYING'],
  CURRENTLY_PLAYING: ['BACKLOG', 'COMPLETED', 'ABANDONED'],
  COMPLETED: ['CURRENTLY_PLAYING'],
  ABANDONED: ['BACKLOG', 'CURRENTLY_PLAYING'],
};

export function isValidTransition(fromStatus, toStatus) {
  if (fromStatus === toStatus) {
    return false;
  }
  const allowedTransitions = STATE_TRANSITIONS[fromStatus];
  return allowedTransitions ? allowedTransitions.includes(toStatus) : false;
}

export function getValidTransitions(fromStatus) {
  return STATE_TRANSITIONS[fromStatus] || [];
}

/**
 * Search for games across different sources
 * @param {string} query - Search query
 * @returns {Promise<Array>} - List of games from our database and external APIs
 */
export async function searchGames(query) {
  console.log('[gameService] searchGames called with query:', query);

  // First check if we have these games in our database
  const dbGames = await prisma.game.findMany({
    where: {
      title: {
        contains: query,
        mode: 'insensitive',
      },
    },
    take: 10,
  });

  console.log('[gameService] Database results:', dbGames.length);

  // If we have enough results, just return them
  if (dbGames.length >= 10) {
    console.log('[gameService] Returning DB results only (10+ found)');
    return dbGames;
  }

  // Otherwise, search external API
  try {
    console.log('[gameService] Calling IGDB API...');
    const igdbResults = await igdbApi.searchGames(query);
    console.log('[gameService] IGDB raw results:', igdbResults.length);

    // Map the results to our model
    const externalGames = igdbResults.map(igdbApi.mapIgdbGameToModel);
    console.log('[gameService] Mapped external games:', externalGames.length);

    const finalResults = [...dbGames, ...externalGames].slice(0, 20);
    console.log('[gameService] Final results:', finalResults.length);
    return finalResults; // Return at most 20 games
  } catch (error) {
    console.error('[gameService] Error searching IGDB:', error);
    return dbGames; // Return only DB results if external API fails
  }
}

/**
 * Add a game to our database with data from external APIs
 * @param {string} igdbId - IGDB game ID
 * @returns {Promise<Object>} - The created game
 */
export async function addGameFromIgdb(igdbId) {
  // Check if game already exists
  const existingGame = await prisma.game.findFirst({
    where: {
      apiId: String(igdbId),
      apiSource: 'IGDB',
    },
  });

  if (existingGame) {
    return existingGame;
  }

  try {
    // Get data from IGDB API
    const igdbGame = await igdbApi.getGameDetails(igdbId);
    const gameData = igdbApi.mapIgdbGameToModel(igdbGame);

    // Get HowLongToBeat data
    const hltbData = await hltbApi.getGameCompletionTimes(gameData.title);

    // Combine the data
    const fullGameData = {
      ...gameData,
      ...hltbData,
    };

    // Save to database
    return prisma.game.create({
      data: fullGameData,
    });
  } catch (error) {
    console.error('Error adding game from IGDB:', error);
    throw new Error(`Failed to add game: ${error.message}`);
  }
}

/**
 * Add a game to a user's collection
 * @param {string} userId - User ID
 * @param {string} gameId - Game ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The created user game
 */
export async function addGameToUserCollection(userId, gameId, options = {}) {
  const { queueId, status = 'BACKLOG' } = options;

  // Check if user already has this game
  const existingUserGame = await prisma.userGame.findUnique({
    where: {
      userId_gameId: {
        userId,
        gameId,
      },
    },
  });

  if (existingUserGame) {
    // Update existing record
    return prisma.userGame.update({
      where: {
        id: existingUserGame.id,
      },
      data: {
        status,
        ...(queueId && { queueId }),
      },
    });
  }

  // Calculate queue position if adding to a queue
  let queuePosition = null;
  if (queueId) {
    const gamesInQueue = await prisma.userGame.findMany({
      where: { queueId },
      orderBy: { queuePosition: 'desc' },
      take: 1,
    });

    queuePosition = gamesInQueue.length > 0
      ? (gamesInQueue[0].queuePosition || 0) + 1
      : 0;
  }

  // Create new user game
  return prisma.userGame.create({
    data: {
      userId,
      gameId,
      status,
      ...(queueId && { queueId }),
      ...(queuePosition !== null && { queuePosition }),
    },
  });
}

/**
 * Update a user's game progress
 * @param {string} userGameId - UserGame ID
 * @param {number} progressPercent - Progress percentage (0-100)
 * @param {string} status - Game status
 * @returns {Promise<Object>} - The updated user game
 */
export async function updateGameProgress(userGameId, progressPercent, status) {
  let data = {};

  if (progressPercent !== undefined) {
    data.progressPercent = Math.max(0, Math.min(100, progressPercent));
  }

  if (status) {
    data.status = status;

    // Set started/completed dates based on status
    if (status === 'CURRENTLY_PLAYING' && !data.startedAt) {
      data.startedAt = new Date();
    } else if (status === 'COMPLETED' && !data.completedAt) {
      data.completedAt = new Date();
    }
  }

  return prisma.userGame.update({
    where: { id: userGameId },
    data,
  });
}

/**
 * Transition a user's game to a new state with validation
 * @param {string} userGameId - UserGame ID
 * @param {string} newStatus - Target status
 * @returns {Promise<Object>} - The updated user game or error
 */
export async function transitionUserGameState(userGameId, newStatus) {
  const userGame = await prisma.userGame.findUnique({
    where: { id: userGameId },
    select: { status: true, startedAt: true, completedAt: true },
  });

  if (!userGame) {
    throw new Error('Game not found');
  }

  const currentStatus = userGame.status;

  if (!isValidTransition(currentStatus, newStatus)) {
    const allowed = getValidTransitions(currentStatus);
    throw new Error(
      `Invalid transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ')}`
    );
  }

  const data = { status: newStatus };

  if (newStatus === 'CURRENTLY_PLAYING' && !userGame.startedAt) {
    data.startedAt = new Date();
  } else if (newStatus === 'COMPLETED' && !userGame.completedAt) {
    data.completedAt = new Date();
  }

  return prisma.userGame.update({
    where: { id: userGameId },
    data,
    include: {
      game: true,
      queue: true,
    },
  });
}

/**
 * Get a user's game queues with games
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of game queues with games
 */
export async function getUserQueues(userId) {
  return prisma.gameQueue.findMany({
    where: { userId },
    include: {
      games: {
        include: {
          game: true,
        },
        orderBy: {
          queuePosition: 'asc',
        },
      },
    },
  });
}

/**
 * Create a new game queue for a user
 * @param {string} userId - User ID
 * @param {string} name - Queue name
 * @param {string} description - Queue description
 * @returns {Promise<Object>} - The created queue
 */
export async function createGameQueue(userId, name, description = '') {
  // Check if user already has a queue with this name
  const existingQueue = await prisma.gameQueue.findUnique({
    where: {
      userId_name: {
        userId,
        name,
      },
    },
  });

  if (existingQueue) {
    throw new Error(`Queue with name "${name}" already exists`);
  }

  // Check if user has any queues yet
  const queueCount = await prisma.gameQueue.count({
    where: { userId },
  });

  return prisma.gameQueue.create({
    data: {
      userId,
      name,
      description,
      isDefault: queueCount === 0, // First queue is default
    },
  });
}

/**
 * Reorder games in a queue
 * @param {string} queueId - Queue ID
 * @param {Array<{id: string, position: number}>} gameOrders - Array of game IDs and their new positions
 * @returns {Promise<boolean>} - Success indicator
 */
export async function reorderQueueGames(queueId, gameOrders) {
  // Update each game's position
  for (const { id, position } of gameOrders) {
    await prisma.userGame.update({
      where: { id },
      data: { queuePosition: position },
    });
  }

  return true;
}

/**
 * Add a tag to a user's game
 * @param {string} userGameId - UserGame ID
 * @param {string} tag - Tag to add (case-insensitive, stored lowercase)
 * @returns {Promise<Object>} - The created tag
 */
export async function addTagToUserGame(userGameId, tag) {
  const normalizedTag = tag.toLowerCase().trim();

  if (!normalizedTag) {
    throw new Error('Tag cannot be empty');
  }

  return prisma.userGameTag.create({
    data: {
      userGameId,
      tag: normalizedTag,
    },
  });
}

/**
 * Remove a tag from a user's game
 * @param {string} userGameId - UserGame ID
 * @param {string} tag - Tag to remove
 * @returns {Promise<Object>} - The deleted tag
 */
export async function removeTagFromUserGame(userGameId, tag) {
  const normalizedTag = tag.toLowerCase().trim();

  return prisma.userGameTag.delete({
    where: {
      userGameId_tag: {
        userGameId,
        tag: normalizedTag,
      },
    },
  });
}

/**
 * Get all tags for a user's game
 * @param {string} userGameId - UserGame ID
 * @returns {Promise<Array<string>>} - List of tags
 */
export async function getTagsForUserGame(userGameId) {
  const tags = await prisma.userGameTag.findMany({
    where: { userGameId },
    select: { tag: true },
    orderBy: { tag: 'asc' },
  });

  return tags.map(t => t.tag);
}

/**
 * Get all unique tags for a user across all their games
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} - List of unique tags
 */
export async function getAllUserTags(userId) {
  const tags = await prisma.userGameTag.findMany({
    where: {
      userGame: {
        userId,
      },
    },
    distinct: ['tag'],
    select: { tag: true },
    orderBy: { tag: 'asc' },
  });

  return tags.map(t => t.tag);
}

/**
 * Find user games matching all specified tags (AND logic)
 * @param {string} userId - User ID
 * @param {Array<string>} tags - Tags to match
 * @returns {Promise<Array>} - List of user games with all specified tags
 */
export async function findUserGamesByTags(userId, tags) {
  if (!tags || tags.length === 0) {
    return [];
  }

  const normalizedTags = tags.map(t => t.toLowerCase().trim());

  // Find userGames that have ALL the specified tags
  const userGames = await prisma.userGame.findMany({
    where: {
      userId,
      AND: normalizedTags.map(tag => ({
        tags: {
          some: {
            tag,
          },
        },
      })),
    },
    include: {
      game: true,
      tags: true,
      queue: true,
    },
  });

  return userGames;
}

/**
 * Create a new game queue with tag filters
 * @param {string} userId - User ID
 * @param {string} name - Queue name
 * @param {string} description - Queue description
 * @param {Array<string>} filterTags - Tags to filter by
 * @returns {Promise<Object>} - The created queue with matching games
 */
export async function createGameQueueWithFilters(userId, name, description = '', filterTags = []) {
  // Check if user already has a queue with this name
  const existingQueue = await prisma.gameQueue.findUnique({
    where: {
      userId_name: {
        userId,
        name,
      },
    },
  });

  if (existingQueue) {
    throw new Error(`Queue with name "${name}" already exists`);
  }

  // Check if user has any queues yet
  const queueCount = await prisma.gameQueue.count({
    where: { userId },
  });

  const normalizedTags = filterTags.map(t => t.toLowerCase().trim()).filter(Boolean);

  // Create the queue
  const queue = await prisma.gameQueue.create({
    data: {
      userId,
      name,
      description,
      isDefault: queueCount === 0,
      filterTags: normalizedTags,
    },
  });

  // If there are filter tags, find matching games and add them to the queue
  if (normalizedTags.length > 0) {
    const matchingGames = await findUserGamesByTags(userId, normalizedTags);

    // Add matching games to the queue with positions
    for (let i = 0; i < matchingGames.length; i++) {
      await prisma.userGame.update({
        where: { id: matchingGames[i].id },
        data: {
          queueId: queue.id,
          queuePosition: i,
        },
      });
    }
  }

  // Return queue with games
  return prisma.gameQueue.findUnique({
    where: { id: queue.id },
    include: {
      games: {
        include: {
          game: true,
          tags: true,
        },
        orderBy: {
          queuePosition: 'asc',
        },
      },
    },
  });
}

/**
 * Find games that match a queue's filters but aren't in the queue
 * @param {string} queueId - Queue ID
 * @returns {Promise<Array>} - List of matching games not in queue
 */
export async function findNewQueueMatches(queueId) {
  const queue = await prisma.gameQueue.findUnique({
    where: { id: queueId },
    select: {
      userId: true,
      filterTags: true,
    },
  });

  if (!queue || queue.filterTags.length === 0) {
    return [];
  }

  // Find games matching the filter tags but not already in this queue
  const matchingGames = await prisma.userGame.findMany({
    where: {
      userId: queue.userId,
      queueId: { not: queueId },
      AND: queue.filterTags.map(tag => ({
        tags: {
          some: {
            tag,
          },
        },
      })),
    },
    include: {
      game: true,
      tags: true,
    },
  });

  return matchingGames;
}
