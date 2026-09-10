import {
  render,
  screen,
  cleanup,
  fireEvent,
  within,
} from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import RoleFilters from '@/features/filters/FiltersPanel/FilterPanel/sections/RoleFilters.jsx';
import { runningProfileTiers } from '@/utils/roles';

afterEach(cleanup);

describe('RoleFilters', () => {
  it('renders without throwing', () => {
    // <RunningProfileSelect> was referenced but never defined or imported, so
    // opening the full filter panel on /players threw a ReferenceError during
    // render and blanked the page.
    expect(() =>
      render(<RoleFilters filters={{}} setFilters={() => {}} />)
    ).not.toThrow();
  });

  it('offers every running profile tier', () => {
    render(<RoleFilters filters={{}} setFilters={() => {}} />);
    const select = screen.getByLabelText('Running Profile');

    expect(select.value).toBe('');
    runningProfileTiers.forEach((tier) => {
      expect(within(select).getByText(tier)).toBeTruthy();
    });
  });

  it('reports the selected running profile', () => {
    let filters = {};
    const setFilters = (update) => {
      filters = update(filters);
    };

    render(<RoleFilters filters={filters} setFilters={setFilters} />);
    fireEvent.change(screen.getByLabelText('Running Profile'), {
      target: { value: 'Elite' },
    });

    expect(filters.runningProfile).toBe('Elite');
  });

  it('offers no defensive role filter', () => {
    // The app was duplicated from a basketball project. Quarterbacks have no
    // defensive side, nothing ever writes roles.defense1/2, and the defensive
    // subrole list is empty -- so the panel offered basketball defenders
    // ("Anchor Big", "Post Defender") above an empty subrole column.
    render(<RoleFilters filters={{}} setFilters={() => {}} />);

    expect(screen.queryByLabelText(/defensive role/i)).toBeNull();
    expect(
      screen.queryByText(/Anchor Big|Post Defender|Wing Stopper/)
    ).toBeNull();

    fireEvent.click(screen.getByText('Subroles'));
    expect(screen.queryByText(/Defensive Subroles/i)).toBeNull();
    expect(screen.getByText('Elite Arm Strength')).toBeTruthy();
  });
});
