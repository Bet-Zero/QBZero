import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const savePlayerData = vi.fn();
vi.mock('@/firebaseHelpers', () => ({
  savePlayerData: (...args) => savePlayerData(...args),
}));
vi.mock('@/hooks/useAuth', () => ({
  default: () => ({ user: null, isAdmin: true }),
}));
vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const { default: useAutoSavePlayer } = await import(
  '@/hooks/useAutoSavePlayer'
);

const player = { id: 'qb-allen', bio: { Team: 'PIT', Position: 'QB' } };

describe('useAutoSavePlayer queueing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    savePlayerData.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('saves an edit that came due while the previous save was in flight', async () => {
    const finish = [];
    savePlayerData.mockImplementation(
      () => new Promise((resolve) => finish.push(resolve))
    );
    const setHasChanges = vi.fn();

    const { rerender } = renderHook((props) => useAutoSavePlayer(props), {
      initialProps: {
        playerId: 'qb-allen',
        player,
        traits: { Accuracy: 80 },
        hasChanges: true,
        setHasChanges,
      },
    });

    await act(async () => vi.advanceTimersByTime(1000));
    expect(savePlayerData).toHaveBeenCalledTimes(1);

    rerender({
      playerId: 'qb-allen',
      player,
      traits: { Accuracy: 90 },
      hasChanges: true,
      setHasChanges,
    });
    await act(async () => vi.advanceTimersByTime(1000));

    // The first save lands; the dirty flag must survive it, because the
    // second edit has not been written yet.
    await act(async () => finish[0]());
    expect(setHasChanges).not.toHaveBeenCalledWith(false);
    expect(savePlayerData).toHaveBeenCalledTimes(2);

    await act(async () => finish[1]());
    expect(savePlayerData.mock.calls[1][1].traits).toEqual({ Accuracy: 90 });
    expect(setHasChanges).toHaveBeenCalledWith(false);
  });
});
