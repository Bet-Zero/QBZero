import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QBRankingCard from '@/features/rankings/QBRankingCard';
import {
  getCurrentPersonalRanking,
  getArchivedPersonalRankings,
} from '@/firebase/personalRankingHelpers';
import { calculateRankingMovement } from '@/utils/rankingMovement';
import { Eye, Calendar, TrendingUp } from 'lucide-react';

const PublicQBRankingsPage = () => {
  const [rankings, setRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showMovement, setShowMovement] = useState(false);
  const [movementData, setMovementData] = useState({});

  useEffect(() => {
    const loadRankings = async () => {
      try {
        const currentRanking = await getCurrentPersonalRanking();
        if (currentRanking?.rankings?.length > 0) {
          setRankings(currentRanking.rankings);
          setLastUpdated(currentRanking.updatedAt || currentRanking.createdAt);

          // Load previous rankings for movement comparison
          try {
            const archives = await getArchivedPersonalRankings();
            if (archives.length > 0) {
              const previousRankings = archives[0].rankings;
              const movement = calculateRankingMovement(
                currentRanking.rankings,
                previousRankings
              );
              setMovementData(movement);
            }
          } catch (error) {
            console.error(
              'Error loading previous rankings for movement:',
              error
            );
          }
        }
      } catch (error) {
        console.error('Error loading rankings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRankings();
  }, []);

  const handleToggleMovement = () => {
    setShowMovement(!showMovement);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="text-white/60 text-lg">Loading rankings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-3">
            NFL QB Rankings
          </h1>
          <p className="text-white/60 text-lg mb-2">
            The official rankings of the QBW
          </p>
          {lastUpdated && (
            <div className="flex items-center justify-center gap-2 text-white/40 text-xs italic">
              <Calendar size={14} />
              <span>Last updated: {formatDate(lastUpdated)}</span>
            </div>
          )}
        </div>

        {/* Movement Toggle Button */}
        {Object.keys(movementData).length > 0 && (
          <div className="flex justify-center mb-6">
            <button
              onClick={handleToggleMovement}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white text-sm transition-all ${
                showMovement
                  ? 'bg-green-600/80 hover:bg-green-700'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              title={
                showMovement ? 'Hide ranking movement' : 'Show ranking movement'
              }
            >
              <TrendingUp size={16} />
              {showMovement ? 'Hide Movement' : 'Show Movement'}
            </button>
          </div>
        )}

        {/* Rankings List */}
        <div className="space-y-1.5 sm:space-y-2">
          {rankings.map((qb, index) => (
            <QBRankingCard
              key={qb.id}
              qb={qb}
              onMoveUp={() => {}}
              onMoveDown={() => {}}
              onRemove={() => {}}
              onEditNotes={() => {}}
              canMoveUp={false}
              canMoveDown={false}
              readOnly={true}
              movement={movementData[qb.id]}
              showMovement={showMovement}
            />
          ))}

          {rankings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-white/40 text-lg mb-4">
                No rankings available at this time.
              </div>
              <div className="text-white/30 text-sm">
                Check back later for updated rankings.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center">
          <div className="text-white/40 text-sm">
            This is a read-only view of the latest QB rankings.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicQBRankingsPage;
