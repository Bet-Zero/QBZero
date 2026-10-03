const collator = new Intl.Collator('en', {
  sensitivity: 'base',
  numeric: true,
});

const fallbackName = (entrant) => {
  return (
    entrant?.display_name ||
    entrant?.displayName ||
    entrant?.name ||
    entrant?.fullName ||
    entrant?.playerName ||
    entrant?.id ||
    'Unknown QB'
  );
};

export const determineBracketSize = (entrantsLength, preferredSize = 32) => {
  if (!entrantsLength) return 0;
  if (entrantsLength >= preferredSize) return preferredSize;
  if (preferredSize === 32 && entrantsLength >= 16) return 16;

  const highestPowerOfTwo =
    2 ** Math.floor(Math.log2(Math.max(entrantsLength, 1)));
  return Math.max(2, highestPowerOfTwo);
};

export const generateSeedOrder = (size) => {
  if (size < 2 || (size & (size - 1)) !== 0) {
    throw new Error(
      'Bracket size must be a power of two greater than or equal to 2'
    );
  }

  let seeds = [1, 2];
  while (seeds.length < size) {
    const currentSize = seeds.length * 2;
    const next = [];
    for (let i = 0; i < seeds.length; i++) {
      next.push(seeds[i]);
      next.push(currentSize + 1 - seeds[i]);
    }
    seeds = next;
  }

  return seeds;
};

export const seedEntrants = (entrants, size) => {
  const trimmedSize = Math.min(size, entrants.length);
  // Sort before trimming. Trimming first let the order the players arrived in
  // (fallback list, then Firestore) decide who missed the cut, so the field
  // could change between loads.
  const seededEntrants = entrants
    .map((entrant) => ({
      ...entrant,
      display_name: fallbackName(entrant),
    }))
    .sort((a, b) => {
      const nameA = fallbackName(a);
      const nameB = fallbackName(b);
      return collator.compare(nameA, nameB) || collator.compare(a.id, b.id);
    })
    .slice(0, trimmedSize)
    .map((entrant, index) => ({
      ...entrant,
      seed: index + 1,
    }));

  const byId = {};
  const bySeed = new Array(trimmedSize).fill(null);

  seededEntrants.forEach((entrant) => {
    byId[entrant.id] = entrant;
    bySeed[entrant.seed - 1] = entrant;
  });

  return {
    list: seededEntrants,
    byId,
    bySeed,
  };
};

export const getRoundLabels = (size) => {
  const labels32 = [
    'Round of 32',
    'Sweet 16',
    'Elite Eight',
    'Final Four',
    'Championship',
  ];
  const labels16 = ['Round of 16', 'Elite Eight', 'Final Four', 'Championship'];
  const labels8 = ['Quarterfinals', 'Semifinals', 'Championship'];
  const labels4 = ['Semifinals', 'Championship'];

  if (size >= 32) return labels32;
  if (size === 16) return labels16;
  if (size === 8) return labels8;
  if (size === 4) return labels4;
  return ['Final'];
};

export const createBracketRounds = (size) => {
  const rounds = [];
  const seedOrder = generateSeedOrder(size);
  const totalRounds = Math.log2(size);

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
    const matchesInRound = size / Math.pow(2, roundIndex + 1);
    const matches = [];

    for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
      if (roundIndex === 0) {
        const seedIndex = matchIndex * 2;
        matches.push({
          id: `R${roundIndex + 1}-M${matchIndex + 1}`,
          label: `Match ${matchIndex + 1}`,
          roundIndex,
          matchIndex,
          seeds: [seedOrder[seedIndex], seedOrder[seedIndex + 1]],
          sources: [],
        });
      } else {
        matches.push({
          id: `R${roundIndex + 1}-M${matchIndex + 1}`,
          label: `Match ${matchIndex + 1}`,
          roundIndex,
          matchIndex,
          seeds: [],
          sources: [
            { roundIndex: roundIndex - 1, matchIndex: matchIndex * 2 },
            { roundIndex: roundIndex - 1, matchIndex: matchIndex * 2 + 1 },
          ],
        });
      }
    }

    rounds.push({
      roundIndex,
      matches,
    });
  }

  return rounds;
};

export const createInitialWinners = (size) => {
  const totalRounds = Math.log2(size);
  return Array.from({ length: totalRounds }, (_, roundIndex) => {
    const matchesInRound = size / Math.pow(2, roundIndex + 1);
    return new Array(matchesInRound).fill(null);
  });
};

export const getMatchParticipants = ({
  rounds,
  seededBySeed,
  winners,
  roundIndex,
  matchIndex,
  entrantsById,
}) => {
  const match = rounds[roundIndex]?.matches[matchIndex];
  if (!match) return [null, null];

  if (roundIndex === 0) {
    return match.seeds.map((seed) => {
      const entrant = seededBySeed[seed - 1];
      if (!entrant) return null;
      return entrant;
    });
  }

  return match.sources.map((source) => {
    const winnerId = winners[source.roundIndex]?.[source.matchIndex];
    if (!winnerId) return null;
    return entrantsById[winnerId] || null;
  });
};

export const clearDependentWinners = (winners, roundIndex, matchIndex) => {
  const cloned = winners.map((round) => [...round]);
  let currentRound = roundIndex + 1;
  let currentMatch = Math.floor(matchIndex / 2);

  while (currentRound < cloned.length) {
    cloned[currentRound][currentMatch] = null;
    currentMatch = Math.floor(currentMatch / 2);
    currentRound += 1;
  }

  return cloned;
};

// Picks `playerId` (or clears with null) for one match. Later rounds lose only
// the picks the previous winner had made it into; a pick in the next round that
// came from the other side of the bracket stays.
export const pickWinner = (winners, roundIndex, matchIndex, playerId) => {
  const cloned = winners.map((round) => [...round]);
  const previous = cloned[roundIndex][matchIndex];
  cloned[roundIndex][matchIndex] = playerId;
  if (!previous || previous === playerId) return cloned;

  let currentRound = roundIndex + 1;
  let currentMatch = Math.floor(matchIndex / 2);
  while (
    currentRound < cloned.length &&
    cloned[currentRound][currentMatch] === previous
  ) {
    cloned[currentRound][currentMatch] = null;
    currentMatch = Math.floor(currentMatch / 2);
    currentRound += 1;
  }

  return cloned;
};

// Fits saved picks onto the current bracket: a pick survives only if that
// player is actually in that match, given the picks before it.
export const sanitizeWinners = (blueprint, saved) => {
  const { rounds, seeded, winners: empty } = blueprint;
  if (!Array.isArray(saved)) return empty;

  const result = empty.map((round) => [...round]);
  rounds.forEach((round, roundIndex) => {
    round.matches.forEach((match) => {
      const pick = saved[roundIndex]?.[match.matchIndex];
      if (!pick) return;
      const participants = getMatchParticipants({
        rounds,
        seededBySeed: seeded.bySeed,
        winners: result,
        roundIndex,
        matchIndex: match.matchIndex,
        entrantsById: seeded.byId,
      });
      if (participants.some((participant) => participant?.id === pick)) {
        result[roundIndex][match.matchIndex] = pick;
      }
    });
  });

  return result;
};

export const setWinner = (winners, roundIndex, matchIndex, playerId) => {
  const cloned = winners.map((round) => [...round]);
  cloned[roundIndex][matchIndex] = playerId;
  return cloned;
};

export const getChampion = (winners, entrantsById) => {
  if (!winners.length) return null;
  const championId = winners[winners.length - 1]?.[0];
  if (!championId) return null;
  return entrantsById[championId] || null;
};

export const buildBracketBlueprint = (entrants, preferredSize = 32) => {
  const bracketSize = determineBracketSize(entrants.length, preferredSize);
  if (bracketSize < 2) {
    return {
      size: 0,
      rounds: [],
      seeded: { list: [], byId: {}, bySeed: [] },
      labels: [],
      winners: [],
    };
  }

  const seeded = seedEntrants(entrants, bracketSize);
  const rounds = createBracketRounds(bracketSize);
  const labels = getRoundLabels(bracketSize);
  const winners = createInitialWinners(bracketSize);

  return {
    size: bracketSize,
    seeded,
    rounds,
    labels,
    winners,
  };
};
