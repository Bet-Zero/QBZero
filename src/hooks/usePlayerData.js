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
      stats: {},
    },
    contract: {},
    contract_summary: {},
    overall_grade: null,
    status: 'active',
  }));
};

const usePlayerData = () => {
  const { data: firestoreData, loading, error } = useFirebaseQuery('players');

  const players = useMemo(() => {
    // Create map of fallback data first
    const fallbackQBs = createFallbackQBData().map(normalizePlayerData);
    const fallbackMap = {};
    fallbackQBs.forEach((qb) => {
      if (qb?.id) {
        fallbackMap[qb.id] = qb;
      }
    });

    // Handle loading case
    if (!firestoreData && loading) return fallbackQBs;

    // If we have Firestore data, merge it with fallback data
    if (firestoreData && firestoreData.length > 0) {
      const mergedPlayers = [...fallbackQBs];

      firestoreData.forEach((fbPlayer) => {
        if (fbPlayer?.bio?.Position === 'QB') {
          const normalizedPlayer = normalizePlayerData(fbPlayer);
          const existingIndex = mergedPlayers.findIndex(
            (p) => p.id === normalizedPlayer.id
          );

          if (existingIndex >= 0) {
            // Update existing player with Firestore data
            mergedPlayers[existingIndex] = normalizedPlayer;
          } else {
            // Add new player from Firestore
            mergedPlayers.push(normalizedPlayer);
          }
        }
      });

      return mergedPlayers;
    }

    // If no Firestore data or error, return fallback data
    return fallbackQBs;
  }, [firestoreData, loading, error]);

  return { players, loading, error };
};

export default usePlayerData;
