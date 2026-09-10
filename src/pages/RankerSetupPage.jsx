import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRankerContext } from '@/context/RankerContext';
import { RankingSetup } from '@/features/ranker/RankingSetup';
import { quarterbacks } from '@/features/ranker/quarterbacks';
import RankerNavBar from '@/components/ranker/RankerNavBar';

const RankerSetupPage = () => {
  const navigate = useNavigate();
  const {
    setSetupData,
    setPlayerPool,
    playerPool: existingPlayerPool,
    setupData: existingSetupData,
  } = useRankerContext();

  // Whatever pool the user configured against is the pool they get. This used
  // to render an existing pool but then commit the hardcoded list regardless,
  // silently discarding any custom selection.
  const pool =
    existingPlayerPool.length > 0 ? existingPlayerPool : quarterbacks;

  const handleComplete = (data) => {
    setSetupData(data);
    setPlayerPool(pool);
    // React batches these with the navigation, so the comparisons route renders
    // with the committed state. (The previous setTimeout was not needed.)
    navigate('/ranker/comparisons');
  };

  return (
    <div className="bg-neutral-900 min-h-screen">
      <RankerNavBar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Setup component */}
        <RankingSetup
          playerPool={pool}
          onComplete={handleComplete}
          existingSetupData={existingSetupData}
        />
      </div>
    </div>
  );
};

export default RankerSetupPage;
