import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const savePlayerData = vi.fn().mockResolvedValue(undefined);
vi.mock('@/firebaseHelpers', () => ({ savePlayerData }));
vi.mock('react-hot-toast', () => ({ toast: { error: vi.fn() } }));

const useAutoSavePlayer = (await import('@/hooks/useAutoSavePlayer')).default;

const args = (overrides = {}) => ({
  playerId: 'josh-allen',
  player: {
    id: 'josh-allen',
    player_id: 'josh-allen',
    display_name: 'Josh Allen',
    bio: { Team: 'BUF', Position: 'QB' },
    // Derived fields normalizePlayerData adds; these must not be written back.
    heightInInches: 77,
    salaryByYear: { 2025: 43 },
    formattedPosition: 'QB',
  },
  traits: { Throwing: 95 },
  roles: { offense1: 'Gunslinger' },
  subRoles: { offense: [] },
  badges: [],
  runningProfile: 'Plus',
  overallGrade: 92,
  status: 'retired',
  blurbs: {},
  hasChanges: true,
  setHasChanges: vi.fn(),
  ...overrides,
});

describe('useAutoSavePlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    savePlayerData.mockClear();
  });

  const flush = async () => {
    await vi.advanceTimersByTimeAsync(2000);
  };

  it('writes the status so retiring someone survives a reload', async () => {
    renderHook(() => useAutoSavePlayer(args()));
    await flush();

    expect(savePlayerData).toHaveBeenCalledTimes(1);
    const [id, payload] = savePlayerData.mock.calls[0];
    expect(id).toBe('josh-allen');
    expect(payload.status).toBe('retired');
  });

  it('keeps the identity fields the record is found by', async () => {
    // usePlayerData only merges a document whose bio.Position is 'QB', so a
    // save that dropped bio would make the player vanish on reload.
    renderHook(() => useAutoSavePlayer(args()));
    await flush();

    const [, payload] = savePlayerData.mock.calls[0];
    expect(payload.player_id).toBe('josh-allen');
    expect(payload.bio).toEqual({ Team: 'BUF', Position: 'QB' });
  });

  it('does not write derived fields back', async () => {
    renderHook(() => useAutoSavePlayer(args()));
    await flush();

    const [, payload] = savePlayerData.mock.calls[0];
    expect(payload).not.toHaveProperty('heightInInches');
    expect(payload).not.toHaveProperty('salaryByYear');
    expect(payload).not.toHaveProperty('formattedPosition');
  });

  it('saves nothing when there are no changes', async () => {
    renderHook(() => useAutoSavePlayer(args({ hasChanges: false })));
    await flush();

    expect(savePlayerData).not.toHaveBeenCalled();
  });

  it('leaves the edit marked dirty when the write fails', async () => {
    savePlayerData.mockRejectedValueOnce(new Error('permission denied'));
    const setHasChanges = vi.fn();
    renderHook(() => useAutoSavePlayer(args({ setHasChanges })));
    await flush();

    expect(setHasChanges).not.toHaveBeenCalledWith(false);
  });
});
