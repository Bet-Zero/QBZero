import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';

const authState = { user: null, isAdmin: false, loading: false };

vi.mock('@/hooks/useAuth', () => ({
  default: () => ({ ...authState, signIn: vi.fn(), signOut: vi.fn() }),
}));

const AdminProtectedRoute = (
  await import('@/components/shared/AdminProtectedRoute.jsx')
).default;

const setAuth = (next) => Object.assign(authState, next);

afterEach(cleanup);

const Secret = () => <div>ranking editor</div>;

describe('AdminProtectedRoute', () => {
  it('hides the content from a signed-out visitor', () => {
    // Admin used to be a localStorage flag guarded by a password compiled into
    // the bundle, so anyone could read it -- or skip it entirely by setting
    // the flag from the console.
    setAuth({ user: null, isAdmin: false, loading: false });
    render(
      <AdminProtectedRoute>
        <Secret />
      </AdminProtectedRoute>
    );

    expect(screen.queryByText('ranking editor')).toBeNull();
    expect(screen.getByText('Sign in with Google')).toBeTruthy();
  });

  it('hides the content from a signed-in non-admin', () => {
    setAuth({
      user: { email: 'someone@example.com' },
      isAdmin: false,
      loading: false,
    });
    render(
      <AdminProtectedRoute>
        <Secret />
      </AdminProtectedRoute>
    );

    expect(screen.queryByText('ranking editor')).toBeNull();
    expect(screen.getByText(/not an admin account/)).toBeTruthy();
  });

  it('shows nothing while the check is still running', () => {
    setAuth({ user: null, isAdmin: false, loading: true });
    render(
      <AdminProtectedRoute>
        <Secret />
      </AdminProtectedRoute>
    );

    expect(screen.queryByText('ranking editor')).toBeNull();
  });

  it('lets an admin through', () => {
    setAuth({
      user: { email: 'owner@example.com' },
      isAdmin: true,
      loading: false,
    });
    render(
      <AdminProtectedRoute>
        <Secret />
      </AdminProtectedRoute>
    );

    expect(screen.getByText('ranking editor')).toBeTruthy();
  });
});
