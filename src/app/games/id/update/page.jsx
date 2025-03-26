'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function UpdateGame({ params }) {
  const router = useRouter();
  const { id } = params || {};
  
  const [userGame, setUserGame] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await fetch(`/api/user/games/${id}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch game');
        }
        
        const data = await res.json();
        setUserGame(data.userGame);
        setProgress(data.userGame.progressPercent);
        setStatus(data.userGame.status);
      } catch (err) {
        console.error('Error fetching game:', err);
        setError('Failed to load game. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (id) {
      fetchGame();
    }
  }, [id]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const res = await fetch(`/api/user/games/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progressPercent: progress,
          status,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update game');
      }
      
      const data = await res.json();
      setUserGame(data.userGame);
      setSuccessMessage('Game progress updated successfully!');
      
      // If progress is 100% and status isn't completed, ask if they want to mark as completed
      if (progress === 100 && status !== 'COMPLETED') {
        if (window.confirm('You reached 100%! Would you like to mark this game as completed?')) {
          setStatus('COMPLETED');
          await fetch(`/api/user/games/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              progressPercent: 100,
              status: 'COMPLETED',
            }),
          });
        }
      }
      
    } catch (err) {
      console.error('Error updating game:', err);
      setError('Failed to update game. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleStartPlaying = async () => {
    if (status !== 'CURRENTLY_PLAYING') {
      setStatus('CURRENTLY_PLAYING');
      setProgress(1); // Start with 1% progress
      
      try {
        await fetch(`/api/user/games/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            progressPercent: 1,
            status: 'CURRENTLY_PLAYING',
          }),
        });
        
        setSuccessMessage('Game marked as currently playing!');
      } catch (err) {
        console.error('Error starting game:', err);
        setError('Failed to update game status. Please try again.');
      }
    }
  };
  
  // Calculate time remaining based on progress and HLTB time
  const calculateTimeRemaining = () => {
    if (!userGame || !userGame.game.hltbMainTime) return null;
    
    const totalTime = userGame.game.hltbMainTime; // in minutes
    const completed = progress / 100;
    const remainingTime = totalTime * (1 - completed);
    
    return remainingTime; // in minutes
  };
  
  // Format time in hours and minutes
  const formatTime = (minutes) => {
    if (!minutes) return 'Unknown';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} hours`;
    return `${hours} hours, ${mins} minutes`;
  };
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-40 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error && !userGame) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  if (!userGame) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">Game not found</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  const { game } = userGame;
  const timeRemaining = calculateTimeRemaining();
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold truncate max-w-md">{game.title}</h1>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 relative">
            <div className="h-64 md:h-full relative">
              {game.coverImageUrl ? (
                <Image
                  src={game.coverImageUrl}
                  alt={game.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 md:w-2/3">
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Game Progress</h2>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    status === 'CURRENTLY_PLAYING' ? 'bg-green-100 text-green-800' :
                    status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    status === 'BACKLOG' ? 'bg-gray-100 text-gray-800' :
                    status === 'ABANDONED' ? 'bg-red-100 text-red-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {status === 'CURRENTLY_PLAYING' ? 'Playing' :
                     status === 'BACKLOG' ? 'Backlog' :
                     status === 'COMPLETED' ? 'Completed' :
                     status === 'ABANDONED' ? 'Abandoned' : 'Wishlist'}
                  </span>
                </div>
                
                {status === 'BACKLOG' ? (
                  <div className="py-2 mb-4">
                    <button
                      onClick={handleStartPlaying}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Start Playing
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Progress: {progress}%
                        </label>
                        {userGame.game.hltbMainTime && status !== 'COMPLETED' && (
                          <span className="text-sm text-gray-600">
                            {timeRemaining > 0 ? `~${formatTime(timeRemaining)} remaining` : 'Completed!'}
                          </span>
                        )}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(parseInt(e.target.value, 10))}
                        className="w-full"
                      />
                      <div className="grid grid-cols-3 text-xs text-gray-400 mt-1">
                        <span>0%</span>
                        <span className="text-center">50%</span>
                        <span className="text-right">100%</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="BACKLOG">Backlog</option>
                        <option value="CURRENTLY_PLAYING">Currently Playing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ABANDONED">Abandoned</option>
                        <option value="WISHLIST">Wishlist</option>
                      </select>
                    </div>
                    
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400"
                      >
                        {isSaving ? 'Saving...' : 'Update Progress'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
              
              <div className="mt-auto">
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">Game Info</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {game.releaseDate && (
                      <div>
                        <p className="text-gray-600">Released</p>
                        <p>{new Date(game.releaseDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {game.hltbMainTime && (
                      <div>
                        <p className="text-gray-600">Main Story</p>
                        <p>{formatTime(game.hltbMainTime)}</p>
                      </div>
                    )}
                    {game.developer && (
                      <div>
                        <p className="text-gray-600">Developer</p>
                        <p>{game.developer}</p>
                      </div>
                    )}
                    {game.publisher && (
                      <div>
                        <p className="text-gray-600">Publisher</p>
                        <p>{game.publisher}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}