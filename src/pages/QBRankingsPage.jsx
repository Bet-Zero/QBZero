import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import QBRankingCard from '@/features/rankings/QBRankingCard';
import AddQBModal from '@/features/rankings/AddQBModal';
import RankingsHeader from '@/features/rankings/RankingsHeader';
import { fetchQBRanking, saveQBRanking } from '@/firebase/listHelpers';

const QBRankingsPage = () => {
  const { rankingId } = useParams();
  const [rankings, setRankings] = useState([]);
  const [rankingName, setRankingName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Load ranking data when component mounts or rankingId changes
  useEffect(() => {
    const loadRanking = async () => {
      if (!rankingId) {
        // If no ranking ID, show empty state
        setRankings([]);
        setRankingName('New QB Ranking');
        setIsLoading(false);
        return;
      }

      try {
        const ranking = await fetchQBRanking(rankingId);
        if (ranking) {
          setRankings(ranking.rankings || []);
          setRankingName(ranking.name || 'Untitled Ranking');
        } else {
          // Ranking not found
          setRankings([]);
          setRankingName('Ranking Not Found');
        }
      } catch (error) {
        console.error('Error loading ranking:', error);
        setRankings([]);
        setRankingName('Error Loading Ranking');
      } finally {
        setIsLoading(false);
      }
    };

    loadRanking();
  }, [rankingId]);

  // Save rankings to Firestore
  const saveRankings = async () => {
    if (!rankingId) return;

    setIsSaving(true);
    try {
      await saveQBRanking(rankingId, { rankings });
    } catch (error) {
      console.error('Error saving ranking:', error);
    } finally {
      setIsSaving(false);
    }
  };

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

  // Auto-save when rankings change (with debounce)
  useEffect(() => {
    if (isLoading) return; // Don't save while loading

    const timeoutId = setTimeout(() => {
      if (rankingId && rankings.length > 0) {
        saveRankings();
      }
    }, 1000); // Save 1 second after last change

    return () => clearTimeout(timeoutId);
  }, [rankings, rankingId, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="text-white/60 text-lg">Loading ranking...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <RankingsHeader 
          onAddQB={() => setShowAddModal(true)} 
          rankingName={rankingName}
          isSaving={isSaving}
          canSave={!!rankingId}
          onSave={saveRankings}
        />

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
                {rankingId ? 'No QBs ranked yet' : 'Create or select a ranking to get started'}
              </div>
              {rankingId && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  Add Your First QB
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddModal && rankingId && (
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
