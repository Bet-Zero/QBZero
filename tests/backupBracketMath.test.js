import { describe, expect, it } from 'vitest';
import {
  buildBracketBlueprint,
  clearDependentWinners,
  determineBracketSize,
  getMatchParticipants,
  setWinner,
} from '@/features/backupBracket/bracketMath';

const createEntrants = (count) =>
  Array.from({ length: count }, (_, index) => ({
    id: `qb-${index + 1}`,
    display_name: `QB ${index + 1}`,
    team: `T${index + 1}`,
  }));

describe('backup bracket math', () => {
  it('determines bracket sizes with 32 preference', () => {
    expect(determineBracketSize(40, 32)).toBe(32);
    expect(determineBracketSize(20, 32)).toBe(16);
    expect(determineBracketSize(9, 32)).toBe(8);
    expect(determineBracketSize(1, 32)).toBe(2);
  });

  it('builds bracket blueprint for 32 entrants', () => {
    const blueprint = buildBracketBlueprint(createEntrants(32));
    expect(blueprint.size).toBe(32);
    expect(blueprint.rounds).toHaveLength(5);
    expect(blueprint.rounds[0].matches).toHaveLength(16);
    expect(blueprint.rounds[1].matches).toHaveLength(8);
    expect(blueprint.rounds[4].matches).toHaveLength(1);
  });

  it('builds bracket blueprint for 16 entrants fallback', () => {
    const blueprint = buildBracketBlueprint(createEntrants(18));
    expect(blueprint.size).toBe(16);
    expect(blueprint.rounds).toHaveLength(4);
    expect(blueprint.rounds[0].matches).toHaveLength(8);
    expect(blueprint.rounds[3].matches).toHaveLength(1);
  });

  it('propagates winners to subsequent rounds', () => {
    const blueprint = buildBracketBlueprint(createEntrants(16));
    let winners = blueprint.winners;
    const firstMatchParticipants = getMatchParticipants({
      rounds: blueprint.rounds,
      seededBySeed: blueprint.seeded.bySeed,
      winners,
      roundIndex: 0,
      matchIndex: 0,
      entrantsById: blueprint.seeded.byId,
    });

    const secondMatchParticipants = getMatchParticipants({
      rounds: blueprint.rounds,
      seededBySeed: blueprint.seeded.bySeed,
      winners,
      roundIndex: 0,
      matchIndex: 1,
      entrantsById: blueprint.seeded.byId,
    });

    winners = setWinner(winners, 0, 0, firstMatchParticipants[0].id);
    winners = clearDependentWinners(winners, 0, 0);
    winners = setWinner(winners, 0, 1, secondMatchParticipants[0].id);
    winners = clearDependentWinners(winners, 0, 1);

    const nextRoundParticipants = getMatchParticipants({
      rounds: blueprint.rounds,
      seededBySeed: blueprint.seeded.bySeed,
      winners,
      roundIndex: 1,
      matchIndex: 0,
      entrantsById: blueprint.seeded.byId,
    });

    expect(nextRoundParticipants[0]?.id).toBe(firstMatchParticipants[0].id);
    expect(nextRoundParticipants[1]?.id).toBe(secondMatchParticipants[0].id);
  });

  it('clears downstream winners when an earlier pick is changed', () => {
    const blueprint = buildBracketBlueprint(createEntrants(16));
    let winners = blueprint.winners;
    const [topWinner] = getMatchParticipants({
      rounds: blueprint.rounds,
      seededBySeed: blueprint.seeded.bySeed,
      winners,
      roundIndex: 0,
      matchIndex: 0,
      entrantsById: blueprint.seeded.byId,
    });
    const [, opponent] = getMatchParticipants({
      rounds: blueprint.rounds,
      seededBySeed: blueprint.seeded.bySeed,
      winners,
      roundIndex: 0,
      matchIndex: 1,
      entrantsById: blueprint.seeded.byId,
    });

    winners = setWinner(winners, 0, 0, topWinner.id);
    winners = clearDependentWinners(winners, 0, 0);
    winners = setWinner(winners, 0, 1, opponent.id);
    winners = clearDependentWinners(winners, 0, 1);
    winners = setWinner(winners, 1, 0, topWinner.id);
    winners = clearDependentWinners(winners, 1, 0);

    winners = setWinner(winners, 0, 0, null);
    winners = clearDependentWinners(winners, 0, 0);

    const downstreamWinner = winners[1][0];
    expect(downstreamWinner).toBeNull();
  });
});
