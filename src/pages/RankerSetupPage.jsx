import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRankerContext } from '@/context/RankerContext';
import { RankingSetup } from '@/features/ranker/RankingSetup';
import { PoolSelector } from '@/features/ranker/PoolSelector';
import useQBRoster from '@/hooks/useQBRoster';
import RankerNavBar from '@/components/ranker/RankerNavBar';
import { sessionProgressKey } from '@/features/ranker/RankingSession';
import { useConfirm } from '@/components/shared/ui/ConfirmModal';
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
    sessionProgress,
    finalRanking,
    setSessionProgress,
    setFinalRanking,
    setComparisonResults,
    isSharedView,
    leaveSharedView,
    getSavedSession,
  } = useRankerContext();
  const { confirm, confirmDialog } = useConfirm();

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

  // A different pool or setup starts the comparisons over: saved picks only
  // resume against the setup they were made for. That used to happen
  // silently, and the old results stayed one click away under a setup they
  // no longer matched. Now it asks first when there is work to lose, and
  // clears those results with the picks.
  const handleComplete = async (data) => {
    // Confirming a shared setup makes it the viewer's own session, so what
    // could be lost is the session they had saved before opening the link.
    const own = isSharedView
      ? getSavedSession()
      : { sessionProgress, finalRanking };

    const progress = own.sessionProgress;
    const changed =
      !progress || progress.key !== sessionProgressKey(pool, data);
    const picks = (progress?.history || []).filter(
      (entry) => entry.type === 'answer'
    ).length;
    const hasResults = own.finalRanking.length > 0;
    const hasWork =
      picks > 0 || (progress?.anchorResults || []).length > 0 || hasResults;

    if (changed && hasWork) {
      const lost = picks
        ? `Your ${picks} pick${picks === 1 ? ' was' : 's were'}`
        : 'Your saved progress was';
      const ok = await confirm({
        title: 'Start your comparisons over?',
        message: `${lost} made against a different setup, so ${
          hasResults ? 'it is cleared along with your results' : 'it is cleared'
        }.`,
        confirmLabel: 'Start over',
        danger: true,
      });
      if (!ok) return;
    }

    if (isSharedView) leaveSharedView();
    if (changed) {
      setSessionProgress(null);
      setFinalRanking([]);
      setComparisonResults([]);
    }

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
      {confirmDialog}
    </div>
  );
};

export default RankerSetupPage;
