import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { useEffect, useState } from 'react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';

vi.mock('@/hooks/useAuth', () => ({
  default: () => ({ user: null, isAdmin: false, loading: false }),
}));

const SiteLayout = (await import('@/components/layout/SiteLayout.jsx')).default;

const Broken = () => {
  throw new Error('boom');
};
const Fine = () => <div>fine page</div>;

afterEach(cleanup);

describe('SiteLayout page error boundary', () => {
  it('keeps the header and lets the visitor navigate away from a crashed page', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={['/broken']}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/broken" element={<Broken />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Before, nothing caught this and React unmounted the whole site.
    expect(screen.getByText('This page hit a problem')).toBeTruthy();
    expect(screen.getByRole('banner')).toBeTruthy();
    consoleError.mockRestore();
  });

  it('clears the error when the visitor moves to another page', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={['/broken']}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Fine />} />
            <Route path="/broken" element={<Broken />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('This page hit a problem')).toBeTruthy();

    // The site title in the header links home.
    const home = screen
      .getAllByRole('link')
      .find((a) => a.getAttribute('href') === '/');
    fireEvent.click(home);

    expect(screen.queryByText('This page hit a problem')).toBeNull();
    expect(screen.getByText('fine page')).toBeTruthy();
    consoleError.mockRestore();
  });
});

describe('SiteLayout page error boundary, path changes', () => {
  it('keeps a page mounted when it changes its own path', () => {
    // The tier maker's first save replaces /tier-maker with /tier-maker/<id>.
    // Remounting there would throw away the board being edited.
    let mounts = 0;
    const Board = () => {
      const navigate = useNavigate();
      const [count, setCount] = useState(0);
      useEffect(() => {
        mounts += 1;
      }, []);
      return (
        <div>
          <span>edits {count}</span>
          <button
            onClick={() => {
              setCount(count + 1);
              navigate('/board/abc', { replace: true });
            }}
          >
            save
          </button>
        </div>
      );
    };
    render(
      <MemoryRouter initialEntries={['/board']}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/board/:id?" element={<Board />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('save'));
    expect(screen.getByText('edits 1')).toBeTruthy();
    expect(mounts).toBe(1);
  });
});
