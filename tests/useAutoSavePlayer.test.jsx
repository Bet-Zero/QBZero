import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const savePlayerData = vi.fn().mockResolvedValue(undefined);
vi.mock('@/firebaseHelpers', () => ({ savePlayerData }));
vi.mock('react-hot-toast', () => ({ toast: { error: vi.fn() } }));

const authState = { user: null, isAdmin: false };
vi.mock('@/hooks/useAuth', () => ({ default: () => authState }));

const useAutoSavePlayer = (await import('@/hooks/useAutoSavePlayer')).default;

// setHasChanges must be stable across renders, as a useState setter is: the
// hook's save callback depends on it, and the debounce effect depends on that
// callback. A fresh function each render restarts the timer forever.
const setHasChanges = vi.fn();

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
  setHasChanges,
  ...overrides,
});

// Render with a fixed props object so repeated renders do not look like new
// input, the way React state does in the real page.
const renderAutosave = (overrides) => {
  const props = args(overrides);
  return renderHook(() => useAutoSavePlayer(props));
};

const flush = async () => {
  await vi.advanceTimersByTimeAsync(2000);
};

describe('useAutoSavePlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    savePlayerData.mockClear();
    savePlayerData.mockResolvedValue(undefined);
    setHasChanges.mockClear();
  });

  it('writes the status so retiring someone survives a reload', async () => {
    renderAutosave();
    await flush();

    expect(savePlayerData).toHaveBeenCalledTimes(1);
    const [id, payload] = savePlayerData.mock.calls[0];
    expect(id).toBe('josh-allen');
    expect(payload.status).toBe('retired');
  });

  it('keeps the identity fields the record is found by', async () => {
    // usePlayerData only merges a document whose bio.Position is 'QB', so a
    // save that dropped bio would make the player vanish on reload.
    renderAutosave();
    await flush();

    const [, payload] = savePlayerData.mock.calls[0];
    expect(payload.player_id).toBe('josh-allen');
    expect(payload.bio).toEqual({ Team: 'BUF', Position: 'QB' });
  });

  it('does not write derived fields back', async () => {
    renderAutosave();
    await flush();

    const [, payload] = savePlayerData.mock.calls[0];
    expect(payload).not.toHaveProperty('heightInInches');
    expect(payload).not.toHaveProperty('salaryByYear');
    expect(payload).not.toHaveProperty('formattedPosition');
  });

  it('saves nothing when there are no changes', async () => {
    renderAutosave({ hasChanges: false });
    await flush();

    expect(savePlayerData).not.toHaveBeenCalled();
  });

  it('leaves the edit marked dirty when the write fails', async () => {
    savePlayerData.mockRejectedValueOnce(new Error('permission denied'));
    renderAutosave();
    await flush();

    expect(setHasChanges).not.toHaveBeenCalledWith(false);
  });
});

describe('useAutoSavePlayer — reporting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    savePlayerData.mockClear();
    savePlayerData.mockResolvedValue(undefined);
    setHasChanges.mockClear();
  });

  it('reports pending, then saved', async () => {
    const { result } = renderAutosave();

    expect(result.current.saveState).toBe('pending');
    await flush();
    expect(result.current.saveState).toBe('saved');
    expect(result.current.saveError).toBeNull();
  });

  it('reports the error when the write is rejected', async () => {
    savePlayerData.mockRejectedValueOnce(new Error('backend unavailable'));
    const { result } = renderAutosave();
    await flush();

    expect(result.current.saveState).toBe('error');
    expect(result.current.saveError).toBe('Not saved: backend unavailable');
  });

  it('stays idle when there is nothing to save', () => {
    const { result } = renderAutosave({ hasChanges: false });

    expect(result.current.saveState).toBe('idle');
  });

  it('strips undefined values, which Firestore rejects outright', async () => {
    renderAutosave({
      overallGrade: undefined,
      runningProfile: undefined,
      roles: { offense1: 'Gunslinger', offense2: undefined },
    });
    await flush();

    const [, payload] = savePlayerData.mock.calls[0];
    expect('runningProfile' in payload).toBe(false);
    expect('offense2' in payload.roles).toBe(false);
    expect(payload.overall_grade).toBeNull();
  });
});

describe('useAutoSavePlayer — permission errors', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    savePlayerData.mockClear();
    setHasChanges.mockClear();
  });

  const permissionDenied = () => {
    const denied = new Error('Missing or insufficient permissions.');
    denied.code = 'permission-denied';
    return denied;
  };

  it('says you are signed out when nobody is signed in', async () => {
    Object.assign(authState, { user: null, isAdmin: false });
    savePlayerData.mockRejectedValueOnce(permissionDenied());

    const { result } = renderAutosave();
    await flush();

    expect(result.current.saveState).toBe('error');
    expect(result.current.saveError).toBe('Not saved: you are not signed in.');
  });

  it('names the account when it is signed in but not an admin', async () => {
    Object.assign(authState, {
      user: { email: 'someone@example.com' },
      isAdmin: false,
    });
    savePlayerData.mockRejectedValueOnce(permissionDenied());

    const { result } = renderAutosave();
    await flush();

    expect(result.current.saveError).toBe(
      'Not saved: someone@example.com is not an admin account.'
    );
  });

  it('points at unpublished rules when the app already thinks you are admin', async () => {
    // The two states can disagree: the client only reads admins/<uid>, while
    // the write is judged by whatever ruleset is actually live in Firebase.
    Object.assign(authState, {
      user: { email: 'owner@example.com' },
      isAdmin: true,
    });
    savePlayerData.mockRejectedValueOnce(permissionDenied());

    const { result } = renderAutosave();
    await flush();

    expect(result.current.saveError).toMatch(/firestore\.rules/);
    expect(result.current.saveError).toMatch(/not the ones/);
  });

  it('reports other failures verbatim', async () => {
    savePlayerData.mockRejectedValueOnce(new Error('network unreachable'));

    const { result } = renderAutosave();
    await flush();

    expect(result.current.saveError).toBe('Not saved: network unreachable');
  });
});
