import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QBRankingCard from '@/features/rankings/QBRankingCard';
import { getCurrentPersonalRanking } from '@/firebase/personalRankingHelpers';
import { Eye, Calendar } from 'lucide-react';

const PublicQBRankingsPage = () => {
  const [rankings, setRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const loadRankings = async () => {
      try {
        const currentRanking = await getCurrentPersonalRanking();
        if (currentRanking?.rankings?.length > 0) {
          setRankings(currentRanking.rankings);
          setLastUpdated(currentRanking.updatedAt || currentRanking.createdAt);
        }
      } catch (error) {
        console.error('Error loading rankings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRankings();
  }, []);

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
