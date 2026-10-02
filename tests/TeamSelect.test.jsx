import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import PlayerHeader from '@/features/profile/PlayerDetails/PlayerHeader';

vi.mock('@/components/shared/QBRankingBadge', () => ({ default: () => null }));
vi.mock('@/components/shared/PlayerHeadshot', () => ({ default: () => null }));

const player = {
  id: 'j-j-mccarthy',
  display_name: 'J.J. McCarthy',
  bio: { Team: 'MIN', Position: 'QB' },
};

describe('the profile team field', () => {
  afterEach(cleanup);

  it('offers all 32 teams and reports a change', () => {
    const onTeamChange = vi.fn();
    render(
      <PlayerHeader
        player={player}
        selectedPlayer={player.id}
        team="MIN"
        onTeamChange={onTeamChange}
      />
    );

    const select = screen.getByRole('combobox', { name: 'Team' });
    expect(select.value).toBe('MIN');
    expect(select.querySelectorAll('option')).toHaveLength(32);

    fireEvent.change(select, { target: { value: 'NYG' } });
    expect(onTeamChange).toHaveBeenCalledWith('NYG');
  });

  it('shows the edited team ahead of the saved one', () => {
    render(
      <PlayerHeader
        player={player}
        selectedPlayer={player.id}
        team="NYG"
        onTeamChange={() => {}}
      />
    );

    expect(screen.getByRole('combobox', { name: 'Team' }).value).toBe('NYG');
  });

  it('stays read-only where nothing edits it', () => {
    render(<PlayerHeader player={player} selectedPlayer={player.id} />);

    expect(screen.queryByRole('combobox', { name: 'Team' })).toBeNull();
    expect(screen.getByText('TEAM').parentElement.textContent).toBe(
      'TEAM: MIN'
    );
  });
});
