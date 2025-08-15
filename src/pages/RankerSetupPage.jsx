import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRankerContext } from '@/context/RankerContext';
import { RankingSetup } from '@/features/ranker/RankingSetup';
import { quarterbacks } from '@/features/ranker/quarterbacks';

const RankerSetupPage = () => {
  const navigate = useNavigate();
  const { setSetupData, setCurrentPhase, setPlayerPool } = useRankerContext();

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
    <div className="bg-neutral-900 min-h-screen flex items-center justify-center">
      <RankingSetup playerPool={quarterbacks} onComplete={handleComplete} />
    </div>
  );
};

export default RankerSetupPage;
