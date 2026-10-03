import React, { useState } from 'react';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const toastMock = vi.hoisted(() => {
  const fn = vi.fn();
  fn.dismiss = vi.fn();
  return fn;
});
vi.mock('react-hot-toast', () => ({ default: toastMock, toast: toastMock }));

const { default: useUnsavedDraft, readDraft } = await import(
  '@/hooks/useUnsavedDraft.jsx'
);

const KEY = 'test:board';
const stored = () => readDraft(KEY);

// A tiny editor: a value, a saved copy, and the hook keeping a draft.
const Editor = ({ initial = 'saved', confirm = vi.fn(), onRestore }) => {
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(initial);
  useUnsavedDraft({
    key: KEY,
    ready: true,
    dirty: value !== saved,
    snapshot: { value },
    restore: (draft, isDraft) => {
      onRestore?.(draft, isDraft);
      setValue(draft.value);
    },
    confirm,
  });
  return (
    <>
      <output>{value}</output>
      <button onClick={() => setValue(`${value}!`)}>edit</button>
      <button onClick={() => setSaved(value)}>save</button>
    </>
  );
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
afterEach(cleanup);

describe('useUnsavedDraft', () => {
  it('keeps unsaved edits in the browser and forgets them once saved', () => {
    render(<Editor />);
    expect(stored()).toBeNull();

    fireEvent.click(screen.getByText('edit'));
    expect(stored().snapshot).toEqual({ value: 'saved!' });
    expect(stored().base).toBe(JSON.stringify({ value: 'saved' }));

    fireEvent.click(screen.getByText('save'));
    expect(stored()).toBeNull();
  });

  it('puts a draft back when the editor opens again, with a way to discard it', () => {
    localStorage.setItem(
      `qbzero:draft:${KEY}`,
      JSON.stringify({
        snapshot: { value: 'left behind' },
        base: JSON.stringify({ value: 'saved' }),
        at: Date.UTC(2026, 9, 3, 9, 0),
      })
    );
    const onRestore = vi.fn();
    render(<Editor onRestore={onRestore} />);

    expect(screen.getByRole('status').textContent).toBe('left behind');
    expect(onRestore).toHaveBeenCalledWith({ value: 'left behind' }, true);
    // Still unsaved, so the draft is still kept.
    expect(stored().snapshot).toEqual({ value: 'left behind' });

    // The toast's Discard button goes back to what is saved.
    const [render_] = toastMock.mock.calls[0];
    render(render_({ id: 't1' }));
    fireEvent.click(screen.getByText('Discard'));
    expect(screen.getByRole('status').textContent).toBe('saved');
    expect(stored()).toBeNull();
  });

  it('asks first when what is saved changed after the draft was taken', async () => {
    localStorage.setItem(
      `qbzero:draft:${KEY}`,
      JSON.stringify({
        snapshot: { value: 'old edit' },
        base: JSON.stringify({ value: 'older save' }),
        at: Date.now(),
      })
    );
    const confirm = vi.fn(async () => false);
    render(<Editor confirm={confirm} />);

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Restore your unsaved changes?' })
    );
    await act(async () => {});
    expect(screen.getByRole('status').textContent).toBe('saved');
    expect(stored()).toBeNull();
  });

  it('restores after the question when the answer is yes', async () => {
    localStorage.setItem(
      `qbzero:draft:${KEY}`,
      JSON.stringify({
        snapshot: { value: 'old edit' },
        base: JSON.stringify({ value: 'older save' }),
        at: Date.now(),
      })
    );
    render(<Editor confirm={vi.fn(async () => true)} />);
    await act(async () => {});
    expect(screen.getByRole('status').textContent).toBe('old edit');
    expect(stored().snapshot).toEqual({ value: 'old edit' });
  });

  it('drops the draft when the editor is left inside the site', () => {
    const { unmount } = render(<Editor />);
    fireEvent.click(screen.getByText('edit'));
    expect(stored()).not.toBeNull();
    unmount();
    expect(stored()).toBeNull();
  });
});
