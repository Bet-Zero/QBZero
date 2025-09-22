import React, { useState, useEffect } from 'react';
import RankingsBoardView from '@/features/rankings/components/RankingsBoardView';
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
      <RankingsBoardView
        players={rankings}
        title="Official QB Rankings"
        subtitle="The definitive quarterback rankings, updated regularly."
        updatedDate={new Date()}
        emptyStateMessage="No rankings available yet."
      />
    </div>
  );
};

export default PersonalRankingsPage;
