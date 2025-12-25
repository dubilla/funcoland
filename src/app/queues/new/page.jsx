'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateQueue() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch('/api/user/tags');
        if (res.ok) {
          const data = await res.json();
          setAvailableTags(data.tags || []);
        }
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    }
    fetchTags();
  }, []);

  const handleAddFilterTag = (tag) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !filterTags.includes(normalizedTag)) {
      setFilterTags(prev => [...prev, normalizedTag].sort());
    }
    setTagInput('');
  };

  const handleRemoveFilterTag = (tag) => {
    setFilterTags(prev => prev.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddFilterTag(tagInput);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Queue name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/user/queues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          filterTags: filterTags.length > 0 ? filterTags : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create queue');
      }

      // Redirect to queues page after successful creation
      router.push('/dashboard');
    } catch (err) {
      console.error('Error creating queue:', err);
      setError(err.message || 'Failed to create queue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Queue</h1>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 mb-2">
              Queue Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g., Currently Playing, JRPGs, Games to Finish in 2025"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded"
              rows="3"
              placeholder="Describe this queue (optional)"
            ></textarea>
          </div>

          <div className="mb-6">
            <label htmlFor="filterTags" className="block text-gray-700 mb-2">
              Filter by Tags (Optional)
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Games with ALL selected tags will be automatically added to this queue.
            </p>

            {filterTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {filterTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveFilterTag(tag)}
                      className="hover:text-indigo-600 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                id="filterTags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="w-full p-2 border rounded"
                placeholder="Type a tag and press Enter..."
                list="tag-suggestions"
              />
              {availableTags.length > 0 && (
                <datalist id="tag-suggestions">
                  {availableTags
                    .filter(tag => !filterTags.includes(tag))
                    .map(tag => (
                      <option key={tag} value={tag} />
                    ))}
                </datalist>
              )}
            </div>

            {availableTags.length > 0 && (
              <div className="mt-2">
                <span className="text-sm text-gray-500">Your tags: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {availableTags
                    .filter(tag => !filterTags.includes(tag))
                    .slice(0, 10)
                    .map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddFilterTag(tag)}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-800 rounded"
                      >
                        + {tag}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isLoading ? 'Creating...' : 'Create Queue'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Tips for Creating Queues</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Create different queues for different gaming moods or genres</li>
          <li>Prioritize your backlog by creating a "Play Next" queue</li>
          <li>Make a "Short Games" queue for games you can finish quickly</li>
          <li>Create a "Long RPGs" queue for games that require more time commitment</li>
        </ul>
      </div>
    </div>
  );
}
