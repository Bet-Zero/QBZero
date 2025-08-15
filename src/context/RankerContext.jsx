import React, { createContext, useContext, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';

const RankerContext = createContext();

export const useRankerContext = () => {
  const context = useContext(RankerContext);
  if (!context) {
    throw new Error('useRankerContext must be used within a RankerProvider');
  }
  return context;
};

export const RankerProvider = () => {
  // Player pool from setup
  const [playerPool, setPlayerPool] = useState([]);

  // Setup data (top/bottom tiers, anchor, etc.)
  const [setupData, setSetupData] = useState(null);

  // Comparison results
  const [comparisonResults, setComparisonResults] = useState([]);

  // Final ranking
  const [finalRanking, setFinalRanking] = useState([]);

  // Progress tracking
  const [currentPhase, setCurrentPhase] = useState('landing'); // landing, setup, comparisons, results

  // Reset all state for new ranking session
  const resetRanker = useCallback(() => {
    setPlayerPool([]);
    setSetupData(null);
    setComparisonResults([]);
    setFinalRanking([]);
    setCurrentPhase('landing');
  }, []);

  const value = {
    // State
    playerPool,
    setupData,
    comparisonResults,
    finalRanking,
    currentPhase,

    // Setters
    setPlayerPool,
    setSetupData,
    setComparisonResults,
    setFinalRanking,
    setCurrentPhase,

    // Actions
    resetRanker,
  };

  return (
    <RankerContext.Provider value={value}>
      <Outlet />
    </RankerContext.Provider>
  );
};

export default RankerContext;
