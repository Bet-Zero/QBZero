import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/hooks/useAuth', () => ({
  default: () => ({
    user: null,
    isAdmin: false,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

import App from '@/App';

afterEach(cleanup);

// These pages are padlocked in the nav because they aren't ready to show.
// Typing the URL must not get a visitor past the padlock either.
describe.each(['/qbw', '/backup-qbs', '/backup-qbs/hall-of-fame'])(
  '%s',
  (path) => {
    it('asks a visitor to sign in as admin', async () => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      );
      expect(await screen.findByText('Admin Access Required')).toBeTruthy();
    });
  }
);
