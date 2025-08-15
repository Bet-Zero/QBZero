import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRankerContext } from '@/context/RankerContext';
import RankingBuilder from '@/features/ranker/RankingBuilder';

const RankerSetupPage = () => {
  const navigate = useNavigate();
  const { setPlayerPool, setCurrentPhase } = useRankerContext();

  useEffect(() => {
    setCurrentPhase('setup');
  }, [setCurrentPhase]);

  const handleStartRanking = (pool) => {
    setPlayerPool(pool);
    navigate('/ranker/comparisons');
  };

  return (
    <div className="bg-neutral-900 min-h-screen">
      <RankingBuilder onStartRanking={handleStartRanking} />
    </div>
  );
};

export default RankerSetupPage;
