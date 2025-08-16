import React, { useState } from 'react';
import QBRankingCard from '@/features/rankings/QBRankingCard';
import AddQBModal from '@/features/rankings/AddQBModal';
import RankingsHeader from '@/features/rankings/RankingsHeader';

const QBRankingsPage = () => {
  const [rankings, setRankings] = useState([
    {
      id: '1',
      name: 'Josh Allen',
      rank: 1,
      imageUrl: '/assets/headshots/josh-allen.png',
      team: 'BUF',
      notes: 'Elite arm talent and mobility',
    },
    {
      id: '2',
      name: 'Patrick Mahomes',
      rank: 2,
      imageUrl: '/assets/headshots/patrick-mahomes.png',
      team: 'KC',
      notes: 'Championship pedigree',
    },
    {
      id: '3',
      name: 'Lamar Jackson',
      rank: 3,
      imageUrl: '/assets/headshots/lamar-jackson.png',
      team: 'BAL',
      notes: 'Dual-threat MVP',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddQB = (qbData) => {
    const newQB = {
      ...qbData,
      id: Date.now().toString(),
      rank: rankings.length + 1,
    };
    setRankings((prev) => [...prev, newQB]);
    // Don't close modal anymore - let user bulk add
  };

  const handleMoveUp = (id) => {
    setRankings((prev) => {
      const index = prev.findIndex((qb) => qb.id === id);
      if (index <= 0) return prev;

      const newRankings = [...prev];
      [newRankings[index - 1], newRankings[index]] = [
        newRankings[index],
        newRankings[index - 1],
      ];

      // Update rank numbers
      return newRankings.map((qb, idx) => ({ ...qb, rank: idx + 1 }));
    });
  };

  const handleMoveDown = (id) => {
    setRankings((prev) => {
      const index = prev.findIndex((qb) => qb.id === id);
      if (index >= prev.length - 1) return prev;

      const newRankings = [...prev];
      [newRankings[index + 1], newRankings[index]] = [
        newRankings[index],
        newRankings[index + 1],
      ];

      // Update rank numbers
      return newRankings.map((qb, idx) => ({ ...qb, rank: idx + 1 }));
    });
  };

  const handleRemove = (id) => {
    setRankings((prev) =>
      prev
        .filter((qb) => qb.id !== id)
        .map((qb, idx) => ({ ...qb, rank: idx + 1 }))
    );
  };

  const handleEditNotes = (id, notes) => {
    setRankings((prev) =>
      prev.map((qb) => (qb.id === id ? { ...qb, notes } : qb))
    );
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <RankingsHeader onAddQB={() => setShowAddModal(true)} />

        <div className="space-y-4">
          {rankings.map((qb, index) => (
            <QBRankingCard
              key={qb.id}
              qb={qb}
              onMoveUp={() => handleMoveUp(qb.id)}
              onMoveDown={() => handleMoveDown(qb.id)}
              onRemove={() => handleRemove(qb.id)}
              onEditNotes={(notes) => handleEditNotes(qb.id, notes)}
              canMoveUp={index > 0}
              canMoveDown={index < rankings.length - 1}
            />
          ))}

          {rankings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-white/40 text-lg mb-4">
                No QBs ranked yet
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Add Your First QB
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddQBModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddQB}
          existingQBNames={rankings.map((qb) => qb.name)}
        />
      )}
    </div>
  );
};

export default QBRankingsPage;
