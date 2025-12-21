'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GameSearch from '@/components/GameSearch';

export default function AddGame() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [queueId, setQueueId] = useState('');
  const [status, setStatus] = useState('BACKLOG');
  const [queues, setQueues] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [addedGames, setAddedGames] = useState([]);
  
  // Fetch user's queues
  useEffect(() => {
    async function fetchQueues() {
      try {
        const res = await fetch('/api/user/queues');
        
        if (!res.ok) {
          throw new Error('Failed to fetch queues');
        }
        
        const data = await res.json();
        setQueues(data.queues || []);
        
        // Auto-select the default queue if it exists
        const defaultQueue = data.queues?.find(q => q.isDefault);
        if (defaultQueue) {
          setQueueId(defaultQueue.id);
        }
      } catch (err) {
        console.error('Error fetching queues:', err);
      }
    }
    
    fetchQueues();
  }, []);
  
  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setError(null);
    setSuccessMessage('');
  };
  
  const handleAddToCollection = async (e) => {
    e.preventDefault();
    
    if (!selectedGame) return;
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const res = await fetch('/api/user/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: selectedGame.id,
          status,
          ...(queueId && { queueId }),
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to add game to collection');
      }
      
      const data = await res.json();
      
      // Add to list of successfully added games
      setAddedGames(prev => [
        { title: selectedGame.title, id: data.userGame.id, coverUrl: selectedGame.coverImageUrl },
        ...prev
      ]);
      
      // Show success message
      setSuccessMessage(`${selectedGame.title} added to your ${status.toLowerCase().replace('_', ' ')}`);
      
      // Reset selected game to allow adding more games
      setSelectedGame(null);
      
    } catch (err) {
      console.error('Error adding game to collection:', err);
      setError('Failed to add game to collection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Add Games to Your Backlog</h1>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </Link>
      </div>
      
      {addedGames.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-green-800">Recently Added Games</h3>
            <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
              View in Dashboard
            </Link>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {addedGames.slice(0, 5).map(game => (
              <div key={game.id} className="flex items-center bg-white rounded-full pl-1 pr-3 py-1 shadow-sm">
                {game.coverUrl ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                    <img src={game.coverUrl} alt={game.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-xs">
                    {game.title[0]}
                  </div>
                )}
                <span className="text-sm truncate max-w-[120px]">{game.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Search for Games</h2>
            <GameSearch onGameSelect={handleGameSelect} />
          </div>
          
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Search for another game to add, or return to your <Link href="/dashboard" className="text-blue-600 hover:underline">dashboard</Link>.
              </p>
            </div>
          )}
        </div>
        
        <div className="md:col-span-2">
          {selectedGame ? (
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Add to Your Collection</h2>
              
              <div className="flex items-start mb-6">
                <div 
                  className="w-24 h-32 bg-cover bg-center rounded mr-4 flex-shrink-0 bg-gray-100" 
                  style={selectedGame.coverImageUrl ? { backgroundImage: `url(${selectedGame.coverImageUrl})` } : {}}
                >
                  {!selectedGame.coverImageUrl && (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium text-xl mb-1">{selectedGame.title}</h3>
                  
                  {selectedGame.releaseDate && (
                    <p className="text-gray-600 mb-1">
                      Released: {new Date(selectedGame.releaseDate).toLocaleDateString()}
                    </p>
                  )}
                  
                  {(selectedGame.hltbMainTime || selectedGame.hltbCompletionTime) && (
                    <div className="text-sm text-gray-600">
                      {selectedGame.hltbMainTime && (
                        <p>Main Story: ~{Math.round(selectedGame.hltbMainTime / 60)} hours</p>
                      )}
                      {selectedGame.hltbCompletionTime && (
                        <p>Completionist: ~{Math.round(selectedGame.hltbCompletionTime / 60)} hours</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <form onSubmit={handleAddToCollection}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Collection Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="BACKLOG">Add to Backlog</option>
                    <option value="CURRENTLY_PLAYING">Currently Playing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ABANDONED">Abandoned</option>
                    <option value="WISHLIST">Wishlist</option>
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Add to Queue</label>
                  <select 
                    value={queueId}
                    onChange={(e) => setQueueId(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">No Queue</option>
                    {queues.map((queue) => (
                      <option key={queue.id} value={queue.id}>
                        {queue.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {error && <p className="text-red-600 mb-4">{error}</p>}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isLoading ? 'Adding...' : 'Add to Collection'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-lg shadow p-6">
              <h3 className="font-medium text-lg mb-2">How to build your backlog</h3>
              <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                <li>Search for games you own or plan to play</li>
                <li>Select a game from the search results</li>
                <li>Choose the status (Backlog, Playing, etc.)</li>
                <li>Optionally add it to a queue</li>
                <li>Add more games as needed</li>
              </ol>
              <div className="mt-4 pt-4 border-t border-blue-100">
                <h4 className="font-medium text-sm mb-2">Tip</h4>
                <p className="text-sm text-gray-600">
                  Add games to your backlog first, then organize them into queues to plan your playing schedule.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}