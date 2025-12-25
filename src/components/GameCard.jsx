'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import TagInput from './TagInput';

const STATE_TRANSITIONS = {
  WISHLIST: ['BACKLOG', 'CURRENTLY_PLAYING'],
  BACKLOG: ['WISHLIST', 'CURRENTLY_PLAYING'],
  CURRENTLY_PLAYING: ['BACKLOG', 'COMPLETED', 'ABANDONED'],
  COMPLETED: ['CURRENTLY_PLAYING'],
  ABANDONED: ['BACKLOG', 'CURRENTLY_PLAYING'],
};

const statusConfig = {
  BACKLOG: {
    label: 'Backlog',
    emoji: '',
    colors: 'bg-gray-200 text-gray-800',
    buttonColors: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  },
  CURRENTLY_PLAYING: {
    label: 'Playing',
    emoji: '',
    colors: 'bg-green-200 text-green-800',
    buttonColors: 'bg-green-100 hover:bg-green-200 text-green-700',
  },
  COMPLETED: {
    label: 'Completed',
    emoji: '',
    colors: 'bg-blue-200 text-blue-800',
    buttonColors: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
    isTerminal: true,
  },
  ABANDONED: {
    label: 'Abandoned',
    emoji: '',
    colors: 'bg-red-200 text-red-800',
    buttonColors: 'bg-red-100 hover:bg-red-200 text-red-700',
    isTerminal: true,
  },
  WISHLIST: {
    label: 'Wishlist',
    emoji: '',
    colors: 'bg-purple-200 text-purple-800',
    buttonColors: 'bg-purple-100 hover:bg-purple-200 text-purple-700',
  },
};

export default function GameCard({ userGame, onUpdate, onRemove, availableTags = [] }) {
  const { id, game, progressPercent, status, queue, tags: initialTags } = userGame;
  const [progress, setProgress] = useState(progressPercent);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingTransition, setPendingTransition] = useState(null);
  const [error, setError] = useState(null);
  const [tags, setTags] = useState([]);
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    // Extract tag strings from tag objects
    if (initialTags) {
      setTags(initialTags.map(t => typeof t === 'string' ? t : t.tag));
    }
  }, [initialTags]);

  const validTransitions = STATE_TRANSITIONS[status] || [];

  const handleProgressChange = (e) => {
    setProgress(parseInt(e.target.value, 10));
  };

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);

    try {
      const res = await fetch(`/api/user/games/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progressPercent: progress,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update progress');
      }

      const data = await res.json();
      setIsProgressModalOpen(false);
      onUpdate(data.userGame);
    } catch (err) {
      console.error('Error updating progress:', err);
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStateTransition = async (newStatus) => {
    const config = statusConfig[newStatus];

    if (config?.isTerminal) {
      setPendingTransition(newStatus);
      setIsConfirmModalOpen(true);
      return;
    }

    await executeTransition(newStatus);
  };

  const executeTransition = async (newStatus) => {
    setIsUpdating(true);
    setError(null);

    try {
      const res = await fetch(`/api/user/games/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }

      const data = await res.json();
      setIsConfirmModalOpen(false);
      setPendingTransition(null);
      onUpdate(data.userGame);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmTransition = () => {
    if (pendingTransition) {
      executeTransition(pendingTransition);
    }
  };

  const handleCancelConfirm = () => {
    setIsConfirmModalOpen(false);
    setPendingTransition(null);
  };

  const handleRemove = async () => {
    if (
      !window.confirm(
        'Are you sure you want to remove this game from your collection?'
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/user/games/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to remove game');
      }

      onRemove(id);
    } catch (err) {
      console.error('Error removing game:', err);
    }
  };

  const handleAddTag = async (tag) => {
    const res = await fetch(`/api/user/games/${id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to add tag');
    }

    setTags(prev => [...prev, tag].sort());
  };

  const handleRemoveTag = async (tag) => {
    const res = await fetch(`/api/user/games/${id}/tags`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to remove tag');
    }

    setTags(prev => prev.filter(t => t !== tag));
  };

  const currentStatusConfig = statusConfig[status];

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
          <h3 className="font-medium truncate max-w-[60%]">{game.title}</h3>
          <span
            className={`text-xs px-2 py-0.5 rounded ${currentStatusConfig.colors}`}
          >
            {currentStatusConfig.emoji && `${currentStatusConfig.emoji} `}
            {currentStatusConfig.label}
          </span>
        </div>

        {queue && (
          <p className="text-sm text-gray-600 mb-2">Queue: {queue.name}</p>
        )}

        {/* Tags section */}
        <div className="mb-3">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-indigo-600 font-bold"
                    aria-label={`Remove ${tag} tag`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {showTagInput ? (
            <TagInput
              tags={[]}
              availableTags={availableTags.filter(t => !tags.includes(t))}
              onAddTag={handleAddTag}
              onRemoveTag={() => {}}
              placeholder="Type tag and press Enter..."
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowTagInput(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              + Add tag
            </button>
          )}
        </div>

        <div className="mb-3">
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

        {error && <p className="text-red-600 text-xs mb-2">{error}</p>}

        {/* State transition buttons */}
        <div className="flex flex-wrap gap-1 mb-3">
          {validTransitions.map((targetStatus) => {
            const targetConfig = statusConfig[targetStatus];
            return (
              <button
                key={targetStatus}
                onClick={() => handleStateTransition(targetStatus)}
                disabled={isUpdating}
                className={`text-xs px-2 py-1 rounded ${targetConfig.buttonColors} disabled:opacity-50`}
              >
                {targetConfig.emoji && `${targetConfig.emoji} `}
                {targetConfig.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsProgressModalOpen(true)}
            className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Update Progress
          </button>
          <button
            onClick={handleRemove}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Progress Update Modal */}
      {isProgressModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              Update Progress: {game.title}
            </h2>

            <form onSubmit={handleProgressSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Progress ({progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleProgressChange}
                  className="w-full"
                />
              </div>

              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsProgressModalOpen(false)}
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

      {/* Confirmation Modal for Terminal States */}
      {isConfirmModalOpen && pendingTransition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Confirm Status Change</h2>

            <p className="text-gray-600 mb-6">
              Are you sure you want to mark <strong>{game.title}</strong> as{' '}
              <strong>{statusConfig[pendingTransition].label}</strong>?
              {pendingTransition === 'COMPLETED' && (
                <span className="block mt-2 text-sm">
                  This will record your completion date.
                </span>
              )}
              {pendingTransition === 'ABANDONED' && (
                <span className="block mt-2 text-sm">
                  You can always return to this game later.
                </span>
              )}
            </p>

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelConfirm}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransition}
                disabled={isUpdating}
                className={`px-4 py-2 text-white rounded disabled:opacity-50 ${
                  pendingTransition === 'COMPLETED'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isUpdating
                  ? 'Saving...'
                  : `Mark as ${statusConfig[pendingTransition].label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
