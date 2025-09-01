import { useMemo } from 'react';
import useFirebaseQuery from './useFirebaseQuery';
import { normalizePlayerData } from '@/utils/roster';
import { quarterbacks } from '@/features/ranker/quarterbacks';

// Fallback QB data for development/testing
const createFallbackQBData = () => {
  return quarterbacks.map((qb) => ({
    id: qb.id,
    player_id: qb.id,
    display_name: qb.name,
    bio: {
      Team: qb.team,
      Position: 'QB',
      AGE: null,
      HT: null,
      WT: null,
      'Years Pro': null,
    },
    traits: {
      Throwing: 0,
      Accuracy: 0,
      Decision: 0,
      Mobility: 0,
      Pocket: 0,
      IQ: 0,
      Leadership: 0,
      Durability: 0,
    },
    roles: {
      offense1: '',
      offense2: '',
      style1: '',
      style2: '',
      twoWay: 50,
      armTalent: 50,
    },
    subRoles: {
      offense: [],
      defense: [],
    },
    badges: [],
    blurbs: {
      traits: {},
      roles: {},
      subroles: {},
      throwingProfile: '',
      playStyle: '',
      overall: '',
    },
    throwingProfile: '',
    system: {
      stats: {}
    },
    contract: {},
    contract_summary: {},
    overall_grade: null,
    status: 'active',
  }));
};

const usePlayerData = () => {
  const { data, loading, error } = useFirebaseQuery('players');

  const players = useMemo(() => {
    // If Firebase data is available and has QB data, use it
    const firebaseQBs = data.filter((p) => p.bio?.Position === 'QB');
    
    if (firebaseQBs.length > 0) {
      return firebaseQBs.map(normalizePlayerData);
    }
    
    // Otherwise, use fallback data when Firebase is not available or empty
    if (error || data.length === 0) {
      console.log('Using fallback QB data');
      return createFallbackQBData().map(normalizePlayerData);
    }
    
    return [];
  }, [data, error]);

  return { players, loading, error };
};

export default usePlayerData;
