import { describe, it, expect, vi, beforeEach } from 'vitest';
import { quarterbacks } from '@/features/ranker/quarterbacks';

const firestore = { data: [], loading: false, error: null };
vi.mock('@/hooks/useFirebaseQuery', () => ({
  default: () => firestore,
}));

const { renderHook } = await import('@testing-library/react');
const usePlayerData = (await import('@/hooks/usePlayerData')).default;

const target = quarterbacks[0];

describe('usePlayerData — merging saved documents', () => {
  beforeEach(() => {
    firestore.data = [];
  });

  it('merges a saved document whose bio.Position is QB', () => {
    firestore.data = [
      {
        id: target.id,
        bio: { Position: 'QB', Team: 'KC' },
        traits: { Throwing: 91 },
      },
    ];

    const { result } = renderHook(() => usePlayerData());
    const merged = result.current.players.find((p) => p.id === target.id);

    expect(merged.traits.Throwing).toBe(91);
  });

  it('merges a curated quarterback even when bio.Position is missing', () => {
    // populateQBs.js wrote 'bio.Position' as a literal dotted key, which setDoc
    // stores as a top-level field rather than nesting it. Documents written that
    // way have no nested bio.Position, were skipped entirely, and rendered as
    // the zeroed fallback -- which looks exactly like a save that did not work.
    firestore.data = [
      {
        id: target.id,
        'bio.Position': 'QB',
        bio: { Team: 'KC' },
        traits: { Throwing: 88 },
      },
    ];

    const { result } = renderHook(() => usePlayerData());
    const merged = result.current.players.find((p) => p.id === target.id);

    expect(merged.traits.Throwing).toBe(88);
  });

  it('still ignores a document that is neither a QB nor on the list', () => {
    firestore.data = [
      {
        id: 'some-point-guard',
        bio: { Position: 'PG' },
        traits: { Shooting: 99 },
      },
    ];

    const { result } = renderHook(() => usePlayerData());

    expect(
      result.current.players.some((p) => p.id === 'some-point-guard')
    ).toBe(false);
  });

  it('returns the curated list when nothing is saved', () => {
    const { result } = renderHook(() => usePlayerData());

    expect(result.current.players).toHaveLength(quarterbacks.length);
  });
});
