import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QBRankingCard from '@/features/rankings/QBRankingCard';
import AddQBModal from '@/features/rankings/AddQBModal';
import RankingsHeader from '@/features/rankings/RankingsHeader';
import {
  getCurrentPersonalRanking,
  saveCurrentPersonalRankings,
  updateCurrentPersonalRankings,
  getArchivedPersonalRankings,
} from '@/firebase/personalRankingHelpers';
import {
  fetchQBRanking,
  saveQBRanking,
  createQBRanking,
} from '@/firebase/listHelpers';
import { calculateRankingMovement } from '@/utils/rankingMovement';
import toast from 'react-hot-toast';

const QBRankingsPage = () => {
  const { rankingId } = useParams();
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [rankingName, setRankingName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCleanView, setIsCleanView] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [movementData, setMovementData] = useState({});

  // Use useRef for ID counter to persist across renders and avoid timing issues
  const idCounterRef = useRef(0);

  // Determine if this is personal rankings (no rankingId) or other rankings (with rankingId)
  const isPersonalRankings = !rankingId;

  // Generate truly unique ID for new QBs
  const generateUniqueId = () => {
    idCounterRef.current += 1;
    return `qb-${Date.now()}-${idCounterRef.current}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Load ranking data when component mounts
  useEffect(() => {
    const loadRanking = async () => {
      if (isPersonalRankings) {
        // Load current personal rankings
        try {
          const currentRanking = await getCurrentPersonalRanking();
          if (currentRanking?.rankings?.length > 0) {
            console.log('Loaded personal rankings:', currentRanking.rankings);
            console.log('First QB structure:', currentRanking.rankings[0]);
            setRankings(currentRanking.rankings);
          }
          setRankingName('My Personal QB Rankings');
        } catch (error) {
          console.error('Error loading current rankings:', error);
          toast.error('Failed to load rankings');
        } finally {
          setIsLoading(false);
        }
      } else {
        // Load other ranking by ID (existing logic for other rankings)
        if (rankingId === 'new') {
          try {
            const newRankingId = await createQBRanking('New QB Ranking');
            setRankings([]);
            setRankingName('New QB Ranking');
            navigate(`/rankings/other/${newRankingId}`, { replace: true });
          } catch (error) {
            console.error('Error creating new ranking:', error);
            setRankings([]);
            setRankingName('New QB Ranking');
          } finally {
            setIsLoading(false);
          }
          return;
        }

        try {
          const ranking = await fetchQBRanking(rankingId);
          setRankings(ranking.rankings || []);
          setRankingName(ranking.name || 'QB Ranking');
        } catch (error) {
          console.error('Error loading ranking:', error);
          try {
            const newRankingId = await createQBRanking('New QB Ranking');
            setRankings([]);
            setRankingName('New QB Ranking');
            navigate(`/rankings/other/${newRankingId}`, { replace: true });
          } catch (createError) {
            console.error('Error creating fallback ranking:', createError);
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadRanking();
  }, [rankingId, navigate, isPersonalRankings]);

  // Load previous rankings for movement comparison
  const loadPreviousRankings = async () => {
    if (!isPersonalRankings) return null;

    try {
      const archives = await getArchivedPersonalRankings();
      // Get the most recent archive (first in the array since they're ordered by date desc)
      return archives.length > 0 ? archives[0].rankings : null;
    } catch (error) {
      console.error('Error loading previous rankings:', error);
      return null;
    }
  };

  // Calculate movement data when rankings change
  useEffect(() => {
    if (isPersonalRankings && rankings.length > 0) {
      loadPreviousRankings().then((previousRankings) => {
        if (previousRankings) {
          const movement = calculateRankingMovement(rankings, previousRankings);
          setMovementData(movement);
        }
      });
    }
  }, [rankings, isPersonalRankings]);

  const handleToggleMovement = () => {
    setShowMovement(!showMovement);
  };

  // Save rankings
  const saveRankings = async (showToast = false) => {
    if (isPersonalRankings) {
      // Save personal rankings with auto-archiving
      if (!hasChanges) return;

      setIsSaving(true);
      try {
        await saveCurrentPersonalRankings(rankings, '');
        setHasChanges(false);
        if (showToast) {
          toast.success('Rankings saved and archived!');
        }
      } catch (error) {
        console.error('Error saving rankings:', error);
        toast.error('Failed to save rankings');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Save other rankings (existing logic)
      if (!rankingId) return;

      setIsSaving(true);
      try {
        await saveQBRanking(rankingId, {
          rankings,
          name: rankingName,
        });
        if (showToast) {
          toast.success('Ranking saved!');
        }
      } catch (error) {
        console.error('Error saving rankings:', error);
        toast.error('Failed to save rankings');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddQB = (qbData) => {
    const newQB = {
      ...qbData,
      id: generateUniqueId(),
      rank: rankings.length + 1,
    };
    setRankings((prev) => [...prev, newQB]);
    setHasChanges(true);
  };

  const handleMoveUp = (id) => {
    console.log('handleMoveUp called with id:', id);
    console.log('Current rankings:', rankings);

    setRankings((prev) => {
      const index = prev.findIndex((qb) => qb.id === id);
      console.log('Found QB at index:', index);

      if (index <= 0) {
        console.log('Cannot move up - already at top or not found');
        return prev;
      }

      const newRankings = [...prev];
      [newRankings[index - 1], newRankings[index]] = [
        newRankings[index],
        newRankings[index - 1],
      ];

      // Update rank numbers
      const updatedRankings = newRankings.map((qb, idx) => ({
        ...qb,
        rank: idx + 1,
      }));
      console.log('Updated rankings after move up:', updatedRankings);
      return updatedRankings;
    });

    setHasChanges(true);
  };

  const handleMoveDown = (id) => {
    console.log('handleMoveDown called with id:', id);
    console.log('Current rankings:', rankings);

    setRankings((prev) => {
      const index = prev.findIndex((qb) => qb.id === id);
      console.log('Found QB at index:', index);

      if (index >= prev.length - 1) {
        console.log('Cannot move down - already at bottom or not found');
        return prev;
      }

      const newRankings = [...prev];
      [newRankings[index + 1], newRankings[index]] = [
        newRankings[index],
        newRankings[index + 1],
      ];

      // Update rank numbers
      const updatedRankings = newRankings.map((qb, idx) => ({
        ...qb,
        rank: idx + 1,
      }));
      console.log('Updated rankings after move down:', updatedRankings);
      return updatedRankings;
    });

    setHasChanges(true);
  };

  const handleRemove = (id) => {
    setRankings((prev) => {
      return prev
        .filter((qb) => qb.id !== id)
        .map((qb, idx) => ({ ...qb, rank: idx + 1 }));
    });

    setHasChanges(true);
  };

  const handleEditNotes = async (id, notes) => {
    // Update the state immediately for UI responsiveness
    setRankings((prev) => {
      return prev.map((qb) => (qb.id === id ? { ...qb, notes } : qb));
    });

    // For personal rankings, save notes immediately without archiving
    if (isPersonalRankings) {
      try {
        const updatedRankings = rankings.map((qb) =>
          qb.id === id ? { ...qb, notes } : qb
        );
        await updateCurrentPersonalRankings(updatedRankings);
        // Don't set hasChanges to true for notes-only updates
        toast.success('Notes saved!', { duration: 2000 });
      } catch (error) {
        console.error('Error saving notes:', error);
        toast.error('Failed to save notes');
      }
    } else {
      // For other rankings, still trigger the change flag
      setHasChanges(true);
    }
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all QBs from your rankings? This cannot be undone.'
      )
    ) {
      setRankings([]);
      setHasChanges(true);
      toast.success('All QBs cleared from rankings');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="text-white/60 text-lg">
          {isPersonalRankings
            ? 'Loading your rankings...'
            : 'Loading ranking...'}
        </div>
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
          canSave={isPersonalRankings ? hasChanges : !!rankingId}
          onSave={() => saveRankings(true)}
          onViewArchives={
            isPersonalRankings ? () => navigate('/rankings/browse') : undefined
          }
          showViewArchives={isPersonalRankings}
          onClearAll={handleClearAll}
          showClearAll={rankings.length > 0}
          isCleanView={isCleanView}
          onToggleView={() => setIsCleanView(!isCleanView)}
          showMovement={showMovement}
          onToggleMovement={handleToggleMovement}
          showMovementToggle={
            isPersonalRankings && Object.keys(movementData).length > 0
          }
        />

        <div className="space-y-1.5 sm:space-y-2">
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
              readOnly={isCleanView}
              movement={movementData[qb.id]}
              showMovement={showMovement}
            />
          ))}

          {rankings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-white/40 text-lg mb-4">
                {isPersonalRankings
                  ? 'No QBs ranked yet - start building your personal rankings!'
                  : rankingId
                    ? 'No QBs ranked yet'
                    : 'Create or select a ranking to get started'}
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

        {/* Status indicator for personal rankings */}
        {isPersonalRankings && hasChanges && !isSaving && (
          <div className="fixed bottom-4 right-4 bg-orange-600/90 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
            You have unsaved changes - click Save to archive current version
          </div>
        )}
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
