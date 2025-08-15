import React from 'react';
import RankingSession from '@/features/ranker/RankingSession';
import { quarterbacks } from '@/features/ranker/quarterbacks';
import '@/features/ranker/ranker.css';

const PlayerRankerPage = () => (
  <div className="bg-neutral-900 min-h-screen text-white">
    <RankingSession playerPool={quarterbacks} />
  </div>
);

export default PlayerRankerPage;
