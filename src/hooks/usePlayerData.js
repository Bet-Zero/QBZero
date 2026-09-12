import { useMemo } from 'react';
import useFirebaseQuery from './useFirebaseQuery';
import { normalizePlayerData } from '@/utils/roster';
import { emptyTraits } from '@/constants/traits';
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
    traits: emptyTraits(),
    roles: {
      offense1: '',
      offense2: '',
      style1: '',
      style2: '',
      armTalent: 50,
    },
    subRoles: {
      offense: [],
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

      // A saved document used to be merged only if its nested bio.Position was
      // 'QB'. That failed silently and invisibly: populateQBs.js wrote the key
      // as the string 'bio.Position', which setDoc stores literally rather than
      // as a path, so a document can carry the value while the nested field is
      // absent. Such a document was skipped and the zeroed fallback rendered in
      // its place -- indistinguishable from an edit that never saved.
      //
      // The curated list is the authority on who counts as a quarterback, so a
      // document whose id is on it is accepted whatever its bio says. That
      // cannot pull in anyone who does not belong.
      const curatedIds = new Set(quarterbacks.map((qb) => qb.id));
      const skipped = [];

      firestoreData.forEach((fbPlayer) => {
        if (fbPlayer?.bio?.Position === 'QB' || curatedIds.has(fbPlayer?.id)) {
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
        } else if (fbPlayer?.id) {
          skipped.push({
            id: fbPlayer.id,
            'bio.Position': fbPlayer?.bio?.Position,
            hasDottedKey: Object.prototype.hasOwnProperty.call(
              fbPlayer,
              'bio.Position'
            ),
          });
        }
      });

      if (skipped.length > 0) {
        console.warn(
          `usePlayerData: ignored ${skipped.length} of ${firestoreData.length} saved player documents -- ` +
            "their bio.Position is not 'QB' and their id is not in quarterbacks.js. " +
            'Their saved grades will not appear and edits to them will look like they did not save.',
          skipped
        );
      }

      return mergedPlayers;
    }

    // If no Firestore data or error, return fallback data
    return fallbackQBs;
  }, [firestoreData, loading]);

  return { players, loading, error };
};

export default usePlayerData;
