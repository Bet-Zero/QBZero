import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const RankerContext = createContext();

export const useRankerContext = () => {
  const context = useContext(RankerContext);
  if (!context) {
    throw new Error('useRankerContext must be used within a RankerProvider');
  }
  return context;
};

// Helper functions for URL state management
const encodeStateToURL = (state) => {
  try {
    return btoa(JSON.stringify(state));
  } catch (e) {
    return '';
  }
};

const decodeStateFromURL = (encoded) => {
  try {
    return JSON.parse(atob(encoded));
  } catch (e) {
    return null;
  }
};

// LocalStorage keys
const STORAGE_KEYS = {
  PLAYER_POOL: 'ranker_player_pool',
  SETUP_DATA: 'ranker_setup_data',
  COMPARISON_RESULTS: 'ranker_comparison_results',
  FINAL_RANKING: 'ranker_final_ranking',
  SESSION_ID: 'ranker_session_id',
};

export const RankerProvider = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Generate a unique session ID to prevent state mixing between sessions
  const [sessionId, setSessionId] = useState(() => {
    const existing = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    return existing || Date.now().toString();
  });

  // Player pool from setup
  const [playerPool, setPlayerPoolState] = useState([]);

  // Setup data (top/bottom tiers, anchor, etc.)
  const [setupData, setSetupDataState] = useState(null);

  // Comparison results
  const [comparisonResults, setComparisonResultsState] = useState([]);

  // Final ranking
  const [finalRanking, setFinalRankingState] = useState([]);

  // Progress tracking
  const [currentPhase, setCurrentPhase] = useState('landing');

  // Load state from localStorage on mount
  useEffect(() => {
    const loadStoredState = () => {
      try {
        const storedPlayerPool = localStorage.getItem(
          `${STORAGE_KEYS.PLAYER_POOL}_${sessionId}`
        );
        const storedSetupData = localStorage.getItem(
          `${STORAGE_KEYS.SETUP_DATA}_${sessionId}`
        );
        const storedComparisonResults = localStorage.getItem(
          `${STORAGE_KEYS.COMPARISON_RESULTS}_${sessionId}`
        );
        const storedFinalRanking = localStorage.getItem(
          `${STORAGE_KEYS.FINAL_RANKING}_${sessionId}`
        );

        if (storedPlayerPool) {
          setPlayerPoolState(JSON.parse(storedPlayerPool));
        }
        if (storedSetupData) {
          setSetupDataState(JSON.parse(storedSetupData));
        }
        if (storedComparisonResults) {
          setComparisonResultsState(JSON.parse(storedComparisonResults));
        }
        if (storedFinalRanking) {
          setFinalRankingState(JSON.parse(storedFinalRanking));
        }
      } catch (error) {
        console.warn('Failed to load ranker state from localStorage:', error);
      }
    };

    loadStoredState();
  }, [sessionId]);

  // Load state from URL parameters if available
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const stateParam = urlParams.get('state');

    if (stateParam) {
      const decodedState = decodeStateFromURL(stateParam);
      if (decodedState) {
        if (decodedState.playerPool)
          setPlayerPoolState(decodedState.playerPool);
        if (decodedState.setupData) setSetupDataState(decodedState.setupData);
        if (decodedState.comparisonResults)
          setComparisonResultsState(decodedState.comparisonResults);
        if (decodedState.finalRanking)
          setFinalRankingState(decodedState.finalRanking);
      }
    }
  }, [location.search]);

  // Enhanced setters that persist to localStorage
  const setPlayerPool = useCallback(
    (pool) => {
      setPlayerPoolState(pool);
      localStorage.setItem(
        `${STORAGE_KEYS.PLAYER_POOL}_${sessionId}`,
        JSON.stringify(pool)
      );
    },
    [sessionId]
  );

  const setSetupData = useCallback(
    (data) => {
      setSetupDataState(data);
      localStorage.setItem(
        `${STORAGE_KEYS.SETUP_DATA}_${sessionId}`,
        JSON.stringify(data)
      );
    },
    [sessionId]
  );

  const setComparisonResults = useCallback(
    (results) => {
      setComparisonResultsState(results);
      localStorage.setItem(
        `${STORAGE_KEYS.COMPARISON_RESULTS}_${sessionId}`,
        JSON.stringify(results)
      );
    },
    [sessionId]
  );

  const setFinalRanking = useCallback(
    (ranking) => {
      setFinalRankingState(ranking);
      localStorage.setItem(
        `${STORAGE_KEYS.FINAL_RANKING}_${sessionId}`,
        JSON.stringify(ranking)
      );
    },
    [sessionId]
  );

  // Function to generate shareable URL with state
  const generateShareableURL = useCallback(
    (path) => {
      const state = {
        playerPool,
        setupData,
        comparisonResults,
        finalRanking,
      };
      const encodedState = encodeStateToURL(state);
      const baseUrl = window.location.origin;
      return `${baseUrl}${path}?state=${encodedState}`;
    },
    [playerPool, setupData, comparisonResults, finalRanking]
  );

  // Function to navigate to a step with current state
  const navigateToStep = useCallback(
    (step, preserveState = true) => {
      if (preserveState) {
        const state = {
          playerPool,
          setupData,
          comparisonResults,
          finalRanking,
        };
        const encodedState = encodeStateToURL(state);
        navigate(`/ranker/${step}?state=${encodedState}`);
      } else {
        navigate(`/ranker/${step}`);
      }
    },
    [navigate, playerPool, setupData, comparisonResults, finalRanking]
  );

  // Reset all state for new ranking session
  const resetRanker = useCallback(() => {
    // Clear localStorage for current session
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(`${key}_${sessionId}`);
    });

    // Generate new session ID
    const newSessionId = Date.now().toString();
    setSessionId(newSessionId);
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);

    // Reset state
    setPlayerPoolState([]);
    setSetupDataState(null);
    setComparisonResultsState([]);
    setFinalRankingState([]);
    setCurrentPhase('landing');
  }, [sessionId]);

  // Check if we can navigate to a specific step
  const canNavigateToStep = useCallback(
    (step) => {
      switch (step) {
        case 'setup':
          return true; // Setup is always accessible
        case 'comparisons':
          return playerPool.length > 0 && setupData; // Need player pool and setup
        case 'results':
          return finalRanking.length > 0; // Need final ranking
        default:
          return true;
      }
    },
    [playerPool, setupData, finalRanking]
  );

  const value = {
    // State
    playerPool,
    setupData,
    comparisonResults,
    finalRanking,
    currentPhase,
    sessionId,

    // Setters
    setPlayerPool,
    setSetupData,
    setComparisonResults,
    setFinalRanking,
    setCurrentPhase,

    // Actions
    resetRanker,
    generateShareableURL,
    navigateToStep,
    canNavigateToStep,
  };

  return (
    <RankerContext.Provider value={value}>
      <Outlet />
    </RankerContext.Provider>
  );
};

export default RankerProvider;
