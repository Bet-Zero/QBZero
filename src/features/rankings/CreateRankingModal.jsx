// CreateRankingModal.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQBRanking } from '@/firebase/listHelpers';

const CreateRankingModal = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    setError('');

    try {
      const rankingId = await createQBRanking(name.trim());
      setName('');
      onClose();
      onCreated?.();
      navigate(`/rankings/${rankingId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#111] p-6 rounded border border-white/10 w-full max-w-md">
        <h2 className="text-white font-bold text-xl mb-4">
          Create New QB Ranking
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white/70 text-sm mb-2">
              Ranking Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded bg-black border border-white/20 text-white placeholder-white/40 focus:border-blue-500 focus:outline-none"
              placeholder="e.g., 2025 QB Rankings, Dynasty Rankings..."
              disabled={isCreating}
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="text-white/50 hover:text-white text-sm px-4 py-2"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white px-6 py-2 rounded text-sm font-medium transition-colors"
              disabled={!name.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Ranking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRankingModal;