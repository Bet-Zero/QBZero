import { render, screen, cleanup } from '@testing-library/react';
import { Component, Suspense } from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import lazyPage from '@/utils/lazyPage';

// Pages now load as separate files. A tab open across a deploy asks for a file
// the deploy removed; lazyPage reloads once to pick up the new build, and
// only once, so a page that is genuinely broken surfaces its error.

const reload = vi.fn();

beforeEach(() => {
  sessionStorage.clear();
  reload.mockReset();
  vi.stubGlobal('location', { ...window.location, reload });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const Page = () => <div>page body</div>;

class Boundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? <div>page failed</div> : this.props.children;
  }
}

const renderLazy = (Lazy) =>
  render(
    <Boundary>
      <Suspense fallback={<div>loading</div>}>
        <Lazy />
      </Suspense>
    </Boundary>
  );

describe('lazyPage', () => {
  it('renders the page once its file arrives', async () => {
    renderLazy(lazyPage(async () => ({ default: Page })));

    expect(screen.getByText('loading')).toBeTruthy();
    expect(await screen.findByText('page body')).toBeTruthy();
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads once when a page file is missing', async () => {
    const load = () => Promise.reject(new TypeError('Failed to fetch'));
    renderLazy(lazyPage(load));

    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(screen.getByText('loading')).toBeTruthy();
  });

  it('does not reload a second time in the same session', async () => {
    sessionStorage.setItem('qbzero:chunk-reload', '1');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderLazy(
      lazyPage(() => Promise.reject(new TypeError('Failed to fetch')))
    );

    expect(await screen.findByText('page failed')).toBeTruthy();
    expect(reload).not.toHaveBeenCalled();
  });

  it('clears the flag after a page loads, so the next deploy can reload', async () => {
    sessionStorage.setItem('qbzero:chunk-reload', '1');
    renderLazy(lazyPage(async () => ({ default: Page })));

    await screen.findByText('page body');
    expect(sessionStorage.getItem('qbzero:chunk-reload')).toBeNull();
  });
});
