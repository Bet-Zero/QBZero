import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRankerContext } from '@/context/RankerContext';
import { RankingSetup } from '@/features/ranker/RankingSetup';
import { quarterbacks } from '@/features/ranker/quarterbacks';
import RankerNavBar from '@/components/ranker/RankerNavBar';

const RankerSetupPage = () => {
  const navigate = useNavigate();
  const {
    setSetupData,
    setCurrentPhase,
    setPlayerPool,
    canNavigateToStep,
    generateShareableURL,
    playerPool: existingPlayerPool,
    setupData: existingSetupData,
  } = useRankerContext();

  useEffect(() => {
    setCurrentPhase('setup');
  }, [setCurrentPhase]);

  const handleComplete = async (data) => {
    // Set all state before navigation
    setSetupData(data);
    setPlayerPool(quarterbacks);
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      navigate('/ranker/comparisons');
    }, 0);
  };

  return (
    <div className="bg-neutral-900 min-h-screen">
      <RankerNavBar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Setup component */}
        <RankingSetup
          playerPool={
            existingPlayerPool.length > 0 ? existingPlayerPool : quarterbacks
          }
          onComplete={handleComplete}
          existingSetupData={existingSetupData}
        />
      </div>
    </div>
  );
};

export default RankerSetupPage;
