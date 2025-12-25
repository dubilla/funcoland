'use client';

import { useState, useEffect, useRef } from 'react';

export default function TagInput({
  tags = [],
  availableTags = [],
  onAddTag,
  onRemoveTag,
  placeholder = 'Add tag...',
  disabled = false
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const filteredSuggestions = availableTags
    .filter(tag =>
      tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(tag)
    )
    .slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = async (tag) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (!normalizedTag || tags.includes(normalizedTag)) {
      setInputValue('');
      return;
    }

    setIsAdding(true);
    try {
      await onAddTag(normalizedTag);
      setInputValue('');
      setShowSuggestions(false);
    } catch (error) {
      console.error('Failed to add tag:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddTag(inputValue);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setInputValue('');
    }
  };

  const handleRemoveTag = async (tag) => {
    try {
      await onRemoveTag(tag);
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1 mb-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-indigo-600 font-bold"
                aria-label={`Remove ${tag} tag`}
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {!disabled && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isAdding}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
          />

          {showSuggestions && filteredSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-32 overflow-y-auto">
              {filteredSuggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => handleAddTag(suggestion)}
                    className="w-full px-2 py-1 text-left text-xs hover:bg-indigo-50 focus:bg-indigo-50"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
