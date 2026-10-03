import { render, screen, cleanup, act } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';

let authListener;
const adminReads = [];

vi.mock('@/firebaseConfig', () => ({ auth: {}, db: {}, googleProvider: {} }));
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, cb) => {
    authListener = cb;
    return () => {};
  },
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  doc: (_db, _col, uid) => uid,
  // Each admin read stays pending until the test resolves it.
  getDoc: (uid) => new Promise((resolve) => adminReads.push({ uid, resolve })),
}));

const { AuthProvider, default: useAuth } = await import('@/hooks/useAuth');

const Probe = () => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div>loading</div>;
  return (
    <div>
      {user ? user.email : 'signed out'} / {isAdmin ? 'admin' : 'not admin'}
    </div>
  );
};

const answer = async (index, exists) => {
  await act(async () => {
    adminReads[index].resolve({ exists: () => exists });
  });
};

afterEach(() => {
  cleanup();
  adminReads.length = 0;
});

describe('AuthProvider', () => {
  it('never shows a signed-in admin as a non-admin while the check runs', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    // A visitor lands signed out, then signs in from the admin prompt.
    await act(async () => {
      authListener(null);
    });
    expect(screen.getByText('signed out / not admin')).toBeTruthy();
    await act(async () => {
      authListener({ uid: 'me', email: 'me@x.com' });
    });

    // The user used to be published before the admin read finished, which
    // rendered "not an admin account" for an admin who had just signed in.
    expect(screen.queryByText(/not admin/)).toBeNull();
    expect(screen.getByText('loading')).toBeTruthy();

    await answer(0, true);
    expect(screen.getByText('me@x.com / admin')).toBeTruthy();
  });

  it('ignores an admin read that finishes after the user signed out', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await act(async () => {
      authListener({ uid: 'me', email: 'me@x.com' });
    });
    await act(async () => {
      authListener(null);
    });
    expect(screen.getByText('signed out / not admin')).toBeTruthy();

    // The signed-in account's read lands late; it must not grant admin to
    // the signed-out state.
    await answer(0, true);
    expect(screen.getByText('signed out / not admin')).toBeTruthy();
  });
});
