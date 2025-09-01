import React, { useState, useEffect } from 'react';
import QBRankingCard from '@/features/rankings/QBRankingCard';
import { getLatestPersonalRankingArchive } from '@/firebase/personalRankingHelpers';

const PersonalRankingsPage = () => {
  const [rankings, setRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load latest archive on component mount
  useEffect(() => {
    const loadRankings = async () => {
      try {
        const latestArchive = await getLatestPersonalRankingArchive();
        if (latestArchive?.rankings?.length > 0) {
          setRankings(latestArchive.rankings);
        }
      } catch (error) {
        console.error('Error loading rankings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRankings();
  }, []);

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
        {/* Clean header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-3">
            Official QB Rankings
          </h1>
          <p className="text-white/60 text-lg">
            The definitive quarterback rankings, updated regularly.
          </p>
          <div className="mt-2 text-sm text-white/40">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-4">
          {rankings.map((qb, index) => (
            <QBRankingCard
              key={qb.id}
              qb={qb}
              readOnly={true}
              onMoveUp={() => {}}
              onMoveDown={() => {}}
              onRemove={() => {}}
              onEditNotes={() => {}}
              canMoveUp={false}
              canMoveDown={false}
            />
          ))}

          {rankings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-white/40 text-lg">
                No rankings available yet.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalRankingsPage;
