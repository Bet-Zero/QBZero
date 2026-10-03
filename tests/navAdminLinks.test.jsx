import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';

const auth = { isAdmin: false, loading: false, user: null };
vi.mock('@/hooks/useAuth', () => ({ default: () => auth }));

const SiteLayout = (await import('@/components/layout/SiteLayout.jsx')).default;

const renderNav = () =>
  render(
    <MemoryRouter>
      <SiteLayout />
    </MemoryRouter>
  );

afterEach(cleanup);

describe('Lists and Tiers in the nav', () => {
  it('links the signed-in admin to them', () => {
    auth.isAdmin = true;
    renderNav();
    const lists = screen.getAllByText('Lists');
    const tiers = screen.getAllByText('Tiers');
    expect(lists.length).toBeGreaterThan(0);
    lists.forEach((el) =>
      expect(el.closest('a')?.getAttribute('href')).toBe('/lists')
    );
    tiers.forEach((el) =>
      expect(el.closest('a')?.getAttribute('href')).toBe('/tier-lists')
    );
  });

  it('keeps them padlocked for a visitor', () => {
    auth.isAdmin = false;
    renderNav();
    [...screen.getAllByText('Lists'), ...screen.getAllByText('Tiers')].forEach(
      (el) => expect(el.closest('a')).toBeNull()
    );
  });
});
