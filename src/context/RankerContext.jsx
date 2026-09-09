import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  encodeRankerState,
  decodeRankerState,
  MAX_ENCODED_LENGTH,
} from '@/utils/ranker/rankerStateCodec';

const RankerContext = createContext();

export const useRankerContext = () => {
  const context = useContext(RankerContext);
  if (!context) {
    throw new Error('useRankerContext must be used within a RankerProvider');
  }
  return context;
};

// localStorage throws in private-browsing modes and when the quota is
// exceeded, so every access is guarded. Persistence is a convenience here; a
// failure must never take the ranker down.
const safeStorage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* nothing to clean up */
    }
  },
  keys() {
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  },
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

  // Session id namespaces the stored keys. It must be persisted the moment it
  // is minted; otherwise every reload starts a new session and orphans the
  // previous one's saved state.
  const [sessionId, setSessionId] = useState(() => {
    const existing = safeStorage.get(STORAGE_KEYS.SESSION_ID);
    if (existing) return existing;
    const created = Date.now().toString();
    safeStorage.set(STORAGE_KEYS.SESSION_ID, created);
    return created;
  });

  // Player pool from setup
  const [playerPool, setPlayerPoolState] = useState([]);

  // Setup data (top/bottom tiers, anchor, etc.)
  const [setupData, setSetupDataState] = useState(null);

  // Comparison results
  const [comparisonResults, setComparisonResultsState] = useState([]);

  // Final ranking
  const [finalRanking, setFinalRankingState] = useState([]);

  // Load state from localStorage on mount
  useEffect(() => {
    const read = (key) => {
      const raw = safeStorage.get(`${key}_${sessionId}`);
      if (!raw) return undefined;
      try {
        return JSON.parse(raw);
      } catch {
        // A corrupted entry should not block the rest of the session.
        safeStorage.remove(`${key}_${sessionId}`);
        return undefined;
      }
    };

    const pool = read(STORAGE_KEYS.PLAYER_POOL);
    const setup = read(STORAGE_KEYS.SETUP_DATA);
    const comparisons = read(STORAGE_KEYS.COMPARISON_RESULTS);
    const ranking = read(STORAGE_KEYS.FINAL_RANKING);

    if (pool) setPlayerPoolState(pool);
    if (setup) setSetupDataState(setup);
    if (comparisons) setComparisonResultsState(comparisons);
    if (ranking) setFinalRankingState(ranking);
  }, [sessionId]);

  // Drop entries belonging to sessions other than the current one. Before the
  // session id was persisted, every reload minted a new one and left a full
  // copy of the previous session's state behind, unreachable and unbounded.
  useEffect(() => {
    const dataKeys = [
      STORAGE_KEYS.PLAYER_POOL,
      STORAGE_KEYS.SETUP_DATA,
      STORAGE_KEYS.COMPARISON_RESULTS,
      STORAGE_KEYS.FINAL_RANKING,
    ];
    safeStorage.keys().forEach((key) => {
      const owner = dataKeys.find((k) => key.startsWith(`${k}_`));
      if (owner && key !== `${owner}_${sessionId}`) {
        safeStorage.remove(key);
      }
    });
  }, [sessionId]);

  // Load state from URL parameters if available. A shared link is an explicit
  // instruction, so it wins over whatever was restored from storage above.
  useEffect(() => {
    const stateParam = new URLSearchParams(location.search).get('state');
    if (!stateParam) return;

    const decoded = decodeRankerState(stateParam);
    if (!decoded) return;

    setPlayerPoolState(decoded.playerPool);
    setSetupDataState(decoded.setupData);
    setComparisonResultsState(decoded.comparisonResults);
    setFinalRankingState(decoded.finalRanking);
  }, [location.search]);

  // Enhanced setters that persist to localStorage
  const setPlayerPool = useCallback(
    (pool) => {
      setPlayerPoolState(pool);
      safeStorage.set(
        `${STORAGE_KEYS.PLAYER_POOL}_${sessionId}`,
        JSON.stringify(pool)
      );
    },
    [sessionId]
  );

  const setSetupData = useCallback(
    (data) => {
      setSetupDataState(data);
      safeStorage.set(
        `${STORAGE_KEYS.SETUP_DATA}_${sessionId}`,
        JSON.stringify(data)
      );
    },
    [sessionId]
  );

  const setComparisonResults = useCallback(
    (results) => {
      setComparisonResultsState(results);
      safeStorage.set(
        `${STORAGE_KEYS.COMPARISON_RESULTS}_${sessionId}`,
        JSON.stringify(results)
      );
    },
    [sessionId]
  );

  const setFinalRanking = useCallback(
    (ranking) => {
      setFinalRankingState(ranking);
      safeStorage.set(
        `${STORAGE_KEYS.FINAL_RANKING}_${sessionId}`,
        JSON.stringify(ranking)
      );
    },
    [sessionId]
  );

  // Build a shareable URL carrying the whole session.
  //
  // Returns { url } on success or { error } when the session cannot be encoded
  // into a link that will survive the trip. Callers must not report success
  // unconditionally: an over-long URL is rejected by most servers and CDNs, so
  // silently handing one out produces a link that simply fails to load.
  const generateShareableURL = useCallback(
    (path) => {
      const encodedState = encodeRankerState({
        playerPool,
        setupData,
        comparisonResults,
        finalRanking,
      });

      if (!encodedState) {
        return { error: 'This session could not be encoded into a link.' };
      }
      if (encodedState.length > MAX_ENCODED_LENGTH) {
        return {
          error:
            'This session is too large to share as a link. Export your rankings instead.',
        };
      }

      return { url: `${window.location.origin}${path}?state=${encodedState}` };
    },
    [playerPool, setupData, comparisonResults, finalRanking]
  );

  // Reset all state for new ranking session
  const resetRanker = useCallback(() => {
    // Clear the current session's stored data. SESSION_ID is deliberately
    // excluded: it is stored unsuffixed and is replaced below.
    [
      STORAGE_KEYS.PLAYER_POOL,
      STORAGE_KEYS.SETUP_DATA,
      STORAGE_KEYS.COMPARISON_RESULTS,
      STORAGE_KEYS.FINAL_RANKING,
    ].forEach((key) => {
      safeStorage.remove(`${key}_${sessionId}`);
    });

    // Generate new session ID
    const newSessionId = Date.now().toString();
    setSessionId(newSessionId);
    safeStorage.set(STORAGE_KEYS.SESSION_ID, newSessionId);

    // Reset state
    setPlayerPoolState([]);
    setSetupDataState(null);
    setComparisonResultsState([]);
    setFinalRankingState([]);
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
    sessionId,

    // Setters
    setPlayerPool,
    setSetupData,
    setComparisonResults,
    setFinalRanking,

    // Actions
    resetRanker,
    generateShareableURL,
    canNavigateToStep,
  };

  return (
    <RankerContext.Provider value={value}>
      <Outlet />
    </RankerContext.Provider>
  );
};

export default RankerProvider;
