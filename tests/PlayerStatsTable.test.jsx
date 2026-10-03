import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import PlayerStatsTable from '@/features/profile/PlayerDetails/PlayerStatsTable';

describe('profile stats box', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('is labelled with the active season', () => {
    vi.useFakeTimers({ now: new Date('2026-10-03T12:00:00Z') });
    render(<PlayerStatsTable player={{ system: { stats: {} } }} />);
    expect(screen.getByText('2026')).toBeTruthy();
  });

  it('keeps last season until the league year turns over in March', () => {
    vi.useFakeTimers({ now: new Date('2027-02-10T12:00:00Z') });
    render(<PlayerStatsTable player={{ system: { stats: {} } }} />);
    expect(screen.getByText('2026')).toBeTruthy();
  });
});
