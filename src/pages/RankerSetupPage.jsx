import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRankerContext } from '@/context/RankerContext';
import { RankingSetup } from '@/features/ranker/RankingSetup';
import { PoolSelector } from '@/features/ranker/PoolSelector';
import useQBRoster from '@/hooks/useQBRoster';
import RankerNavBar from '@/components/ranker/RankerNavBar';
import {
  POOL_DEFAULT,
  POOL_ALL,
  buildPool,
  poolChoiceFor,
  restrictSetupToPool,
} from '@/utils/ranker/rankerPool';

const RankerSetupPage = () => {
  const navigate = useNavigate();
  const {
    setSetupData,
    setPlayerPool,
    playerPool: existingPlayerPool,
    setupData: existingSetupData,
  } = useRankerContext();

  // Retired quarterbacks stay in the curated list for good, so both options
  // draw from the active ones.
  const { activeRoster } = useQBRoster();

  // Whatever pool the user configured against is the pool they get, until
  // they pick a different option. The choice is derived rather than held in
  // state up front because a saved session is restored after first render.
  const [picked, setPicked] = useState(null);
  const hasExisting = existingPlayerPool.length > 0;
  const choice =
    picked ?? (hasExisting ? poolChoiceFor(existingPlayerPool) : POOL_DEFAULT);
  const pool =
    picked === null && hasExisting
      ? existingPlayerPool
      : buildPool(activeRoster, choice);

  const counts = {
    [POOL_DEFAULT]: buildPool(activeRoster, POOL_DEFAULT).length,
    [POOL_ALL]: activeRoster.length,
  };

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
        <PoolSelector value={choice} counts={counts} onChange={setPicked} />
        {/* Keyed so the setup's own state starts over when the pool changes,
            or when a saved setup finishes restoring after first render. */}
        <RankingSetup
          key={`${choice}-${existingSetupData ? 'restored' : 'new'}`}
          playerPool={pool}
          onComplete={handleComplete}
          existingSetupData={restrictSetupToPool(existingSetupData, pool)}
        />
      </div>
    </div>
  );
};

export default RankerSetupPage;
