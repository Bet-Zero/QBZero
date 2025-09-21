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

  const highestPowerOfTwo = 2 ** Math.floor(Math.log2(Math.max(entrantsLength, 1)));
  return Math.max(2, highestPowerOfTwo);
};

export const generateSeedOrder = (size) => {
  if (size < 2 || (size & (size - 1)) !== 0) {
    throw new Error('Bracket size must be a power of two greater than or equal to 2');
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
  const seededEntrants = entrants
    .slice(0, trimmedSize)
    .map((entrant) => ({
      ...entrant,
      display_name: fallbackName(entrant),
    }))
    .sort((a, b) => {
      const nameA = fallbackName(a);
      const nameB = fallbackName(b);
      return collator.compare(nameA, nameB);
    })
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
  const labels32 = ['Round of 32', 'Sweet 16', 'Elite Eight', 'Final Four', 'Championship'];
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

