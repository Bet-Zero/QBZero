import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// The rankings history page lists every past snapshot and every standalone
// ranking by name. The nav has always drawn it with a padlock; this checks the
// route agrees, and that the padlocks lift for the account that can edit.

const authState = { user: null, isAdmin: false, loading: false };

vi.mock('@/hooks/useAuth', () => ({
  default: () => ({ ...authState, signIn: vi.fn(), signOut: vi.fn() }),
}));

vi.mock('@/firebaseConfig', () => ({
  db: {},
  auth: {},
  googleProvider: {},
}));

// App pulls in every page, and several build collection references at module
// scope. None of them matter here -- the gate is what is under test.
vi.mock('firebase/firestore', () => {
  const ref = (path) => ({ path });
  return {
    collection: ref,
    doc: ref,
    query: (...args) => args,
    where: () => ({}),
    orderBy: () => ({}),
    limit: () => ({}),
    serverTimestamp: () => ({}),
    runTransaction: vi.fn(),
    addDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDoc: vi.fn(async () => ({ exists: () => false })),
    getDocs: vi.fn(async () => ({ empty: true, docs: [] })),
    onSnapshot: vi.fn(() => () => {}),
    writeBatch: vi.fn(),
    arrayUnion: vi.fn(),
    arrayRemove: vi.fn(),
    increment: vi.fn(),
  };
});

const setAuth = (next) => Object.assign(authState, next);

const App = (await import('@/App.jsx')).default;
const SiteLayout = (await import('@/components/layout/SiteLayout.jsx')).default;

afterEach(cleanup);

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

describe('rankings access', () => {
  it('keeps the rankings history behind the admin gate', () => {
    setAuth({ user: null, isAdmin: false, loading: false });
    renderAt('/rankings/browse');

    expect(screen.getByText('Admin Access Required')).toBeTruthy();
    expect(screen.queryByText('Browse All Rankings')).toBeNull();
  });

  it('leaves the read-only rankings open to everyone', () => {
    setAuth({ user: null, isAdmin: false, loading: false });
    renderAt('/rankings');

    expect(screen.queryByText('Admin Access Required')).toBeNull();
  });
});

describe('site navigation', () => {
  const renderNav = () =>
    render(
      <MemoryRouter>
        <SiteLayout />
      </MemoryRouter>
    );

  it('padlocks the editing routes for a visitor', () => {
    setAuth({ user: null, isAdmin: false, loading: false });
    renderNav();

    const editLinks = screen
      .getAllByText('Edit Rankings')
      .map((node) => node.closest('a'));
    expect(editLinks.every((link) => link === null)).toBe(true);
  });

  it('turns them into real links once the owner is signed in', () => {
    // The padlocks used to be static markup, so they stayed on after signing
    // in and the only way to the editor was typing the URL.
    setAuth({
      user: { email: 'owner@example.com' },
      isAdmin: true,
      loading: false,
    });
    renderNav();

    const editLink = screen
      .getAllByText('Edit Rankings')
      .map((node) => node.closest('a'))
      .find(Boolean);
    expect(editLink).toBeTruthy();
    expect(editLink.getAttribute('href')).toBe('/rankings/edit');

    const browseLink = screen
      .getAllByText('Browse Rankings')
      .map((node) => node.closest('a'))
      .find(Boolean);
    expect(browseLink.getAttribute('href')).toBe('/rankings/browse');
  });
});
