'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function GameCard({ userGame, onUpdate, onRemove }) {
  const { id, game, progressPercent, status, queue } = userGame;
  const [progress, setProgress] = useState(progressPercent);
  const [gameStatus, setGameStatus] = useState(status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const statusColors = {
    BACKLOG: 'bg-gray-200 text-gray-800',
    CURRENTLY_PLAYING: 'bg-green-200 text-green-800',
    COMPLETED: 'bg-blue-200 text-blue-800',
    ABANDONED: 'bg-red-200 text-red-800',
    WISHLIST: 'bg-purple-200 text-purple-800',
  };

  const statusLabels = {
    BACKLOG: 'Backlog',
    CURRENTLY_PLAYING: 'Playing',
    COMPLETED: 'Completed',
    ABANDONED: 'Abandoned',
    WISHLIST: 'Wishlist',
  };

  const handleProgressChange = (e) => {
    setProgress(parseInt(e.target.value, 10));
  };

  const handleStatusChange = (e) => {
    setGameStatus(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      const res = await fetch(`/api/user/games/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progressPercent: progress,
          status: gameStatus,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update game');
      }
      
      const data = await res.json();
      setIsOpen(false);
      
      // Notify parent component to update UI
      onUpdate(data.userGame);
    } catch (err) {
      console.error('Error updating game:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to remove this game from your collection?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/user/games/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to remove game');
      }
      
      // Notify parent component to update UI
      onRemove(id);
    } catch (err) {
      console.error('Error removing game:', err);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow bg-white">
      <div className="h-48 relative w-full bg-gray-200">
        {game.coverImageUrl ? (
          <Image
            src={game.coverImageUrl}
            alt={game.title}
            fill
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-400">No image</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium truncate max-w-[70%]">{game.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        </div>
        
        {queue && (
          <p className="text-sm text-gray-600 mb-2">Queue: {queue.name}</p>
        )}
        
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{progressPercent}% complete</span>
            {game.hltbMainTime && (
              <span>~{Math.round(game.hltbMainTime / 60)} hours</span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Update
          </button>
          <button
            onClick={handleRemove}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100"
          >
            Remove
          </button>
        </div>
      </div>
      
      {/* Update Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Update {game.title}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Progress ({progress}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleProgressChange}
                  className="w-full"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Status</label>
                <select
                  value={gameStatus}
                  onChange={handleStatusChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="CURRENTLY_PLAYING">Currently Playing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ABANDONED">Abandoned</option>
                  <option value="WISHLIST">Wishlist</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}