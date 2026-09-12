import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QBRankingCard from '@/features/rankings/QBRankingCard';
import AddQBModal from '@/features/rankings/AddQBModal';
import RankingsHeader from '@/features/rankings/RankingsHeader';
import QBRankingsExport from '@/features/rankings/QBRankingsExport';
import {
  getCurrentPersonalRanking,
  saveCurrentPersonalRankings,
  savePersonalRankingNotes,
  PersonalRankingConflictError,
} from '@/firebase/personalRankingHelpers';
import {
  fetchQBRanking,
  saveQBRanking,
  createQBRanking,
} from '@/firebase/listHelpers';
import usePersonalRankingMovement from '@/hooks/usePersonalRankingMovement';
import useQBRoster from '@/hooks/useQBRoster';
import {
  appendToRanking,
  withRanks,
  resolveRankingEntries,
  rankingEntryIds,
} from '@/utils/rankings/personalRankingEntries';
import toast from 'react-hot-toast';

const QBRankingsPage = () => {
  const { rankingId } = useParams();
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [rankingName, setRankingName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isCleanView, setIsCleanView] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  // The version of the live board this page loaded. Sent back on save so a
  // change made in another tab is refused rather than overwritten.
  const [loadedVersion, setLoadedVersion] = useState(null);

  // Determine if this is personal rankings (no rankingId) or other rankings (with rankingId)
  const isPersonalRankings = !rankingId;

  const { roster } = useQBRoster();

  // A board carries a copy of each quarterback so that snapshots stay truthful,
  // but the live board should not keep showing last season's team. Resolve it
  // for display and for what gets saved; archives are never passed through here.
  const displayedRankings = useMemo(
    () =>
      isPersonalRankings ? resolveRankingEntries(rankings, roster) : rankings,
    [rankings, roster, isPersonalRankings]
  );

  const movementData = usePersonalRankingMovement(displayedRankings, {
    enabled: isPersonalRankings,
  });

  // Load ranking data when component mounts
  useEffect(() => {
    const loadRanking = async () => {
      if (isPersonalRankings) {
        // Load current personal rankings
        try {
          const currentRanking = await getCurrentPersonalRanking();
          // Set unconditionally: leaving stale state in place meant navigating
          // here from another ranking left that ranking's quarterbacks on
          // screen, and saving wrote them into the personal board.
          setRankings(currentRanking?.rankings || []);
          setLoadedVersion(currentRanking?.version ?? null);
          setHasChanges(false);
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
          setHasChanges(false);
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

  const handleToggleMovement = () => {
    setShowMovement(!showMovement);
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  // Save rankings
  const saveRankings = async (showToast = false) => {
    if (isPersonalRankings) {
      // Save personal rankings with auto-archiving
      if (!hasChanges) return;

      setIsSaving(true);
      try {
        const { version } = await saveCurrentPersonalRankings(
          displayedRankings,
          { expectedVersion: loadedVersion }
        );
        setRankings(displayedRankings);
        setLoadedVersion(version);
        setHasChanges(false);
        if (showToast) {
          toast.success('Rankings saved and archived!');
        }
      } catch (error) {
        console.error('Error saving rankings:', error);
        toast.error(
          error instanceof PersonalRankingConflictError
            ? error.message
            : 'Failed to save rankings'
        );
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

  // Reordering inside the export modal previously updated only that modal's
  // local state and was discarded on close.
  const handleRankingAdjusted = (adjustedRanking) => {
    setRankings(withRanks(adjustedRanking));
    setHasChanges(true);
  };

  // Takes an array: adding thirty quarterbacks is one update, so the ranks
  // cannot come out of a length that never advanced.
  const handleAddQBs = (additions) => {
    setRankings((prev) => appendToRanking(prev, additions));
    setHasChanges(true);
  };

  const swap = (id, offset) => {
    setRankings((prev) => {
      const index = prev.findIndex((qb) => qb.id === id);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= prev.length) return prev;

      const next = [...prev];
      [next[target], next[index]] = [next[index], next[target]];
      return withRanks(next);
    });
    setHasChanges(true);
  };

  const handleMoveUp = (id) => swap(id, -1);
  const handleMoveDown = (id) => swap(id, 1);

  const handleRemove = (id) => {
    setRankings((prev) => withRanks(prev.filter((qb) => qb.id !== id)));
    setHasChanges(true);
  };

  const handleEditNotes = async (id, notes) => {
    // Update the state immediately for UI responsiveness
    setRankings((prev) =>
      prev.map((qb) => (qb.id === id ? { ...qb, notes } : qb))
    );

    if (!isPersonalRankings) {
      setHasChanges(true);
      return;
    }

    // Notes save on their own rather than waiting for Save -- but only the
    // note. Sending the whole board used to carry any unsaved reordering with
    // it, permanently and without an archive.
    try {
      const result = await savePersonalRankingNotes(id, notes);
      if (result === 'saved') {
        toast.success('Notes saved!', { duration: 2000 });
      } else {
        // Not in the saved board yet -- it rides along with the next save.
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
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
          isPersonal={isPersonalRankings}
          isCleanView={isCleanView}
          onToggleView={() => setIsCleanView(!isCleanView)}
          showMovement={showMovement}
          onToggleMovement={handleToggleMovement}
          showMovementToggle={
            isPersonalRankings && Object.keys(movementData).length > 0
          }
          onExport={handleExport}
          showExport={rankings.length > 0}
        />

        <div className="space-y-1.5 sm:space-y-2">
          {displayedRankings.map((qb, index) => (
            <QBRankingCard
              key={qb.id}
              qb={qb}
              onMoveUp={() => handleMoveUp(qb.id)}
              onMoveDown={() => handleMoveDown(qb.id)}
              onRemove={() => handleRemove(qb.id)}
              onEditNotes={(notes) => handleEditNotes(qb.id, notes)}
              canMoveUp={index > 0}
              canMoveDown={index < displayedRankings.length - 1}
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
          onAdd={handleAddQBs}
          existingIds={rankingEntryIds(rankings)}
        />
      )}

      {showExportModal && (
        <QBRankingsExport
          rankings={displayedRankings}
          rankingName={rankingName}
          movementData={movementData}
          onClose={() => setShowExportModal(false)}
          onRankingAdjusted={handleRankingAdjusted}
        />
      )}
    </div>
  );
};

export default QBRankingsPage;
