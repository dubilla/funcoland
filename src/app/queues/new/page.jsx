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
    <div className="min-h-screen bg-[#0a0e27] relative">
      {/* Background blobs */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black">
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 text-transparent bg-clip-text">
              NEW QUEUE
            </span>
          </h1>
          <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-mono">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Form card */}
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-pink-500/20 rounded-2xl p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Queue Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0e27]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                placeholder="e.g., Currently Playing, JRPGs, Finish in 2025"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Description <span className="text-gray-600">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0e27]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors resize-none"
                rows="3"
                placeholder="Describe this queue (optional)"
              ></textarea>
            </div>

            <div>
              <label htmlFor="filterTags" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Filter by Tags <span className="text-gray-600">(optional)</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Games with ALL selected tags will be automatically added to this queue.
              </p>

              {filterTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {filterTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveFilterTag(tag)}
                        className="hover:text-purple-100 font-bold ml-1 leading-none"
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
                  className="w-full px-4 py-3 bg-[#0a0e27]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
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
                  <span className="text-xs text-gray-500 font-mono">Your tags: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {availableTags
                      .filter(tag => !filterTags.includes(tag))
                      .slice(0, 10)
                      .map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddFilterTag(tag)}
                          className="text-xs px-2 py-1 bg-[#0a0e27]/50 border border-gray-700 hover:border-purple-500/50 text-gray-400 hover:text-purple-300 rounded transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm py-3 px-4 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold py-3 px-8 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Queue'}
              </button>
            </div>
          </form>
        </div>

        {/* Tips card */}
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6">
          <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-wider mb-4">Queue Tips</h2>
          <ul className="space-y-3">
            {[
              'Create different queues for different gaming moods or genres',
              'Prioritize your backlog by creating a "Play Next" queue',
              'Make a "Short Games" queue for games you can finish quickly',
              'Create a "Long RPGs" queue for games that require more time',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                <span className="text-pink-400 flex-shrink-0 mt-0.5">◆</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
        `
      }} />
    </div>
  );
}
