import { render, within, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import RoleFilters from '@/features/filters/FiltersPanel/FilterPanel/sections/RoleFilters.jsx';
import { runningProfileTiers } from '@/utils/roles';

afterEach(cleanup);

// The three role selects are siblings with no label association, so address
// the running profile one by the placeholder option it alone carries.
const runningProfileSelect = (container) =>
  [...container.querySelectorAll('select')].find((select) =>
    [...select.options].some((option) => option.text === 'Any Profile')
  );

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
    const { container } = render(
      <RoleFilters filters={{}} setFilters={() => {}} />
    );
    const select = runningProfileSelect(container);

    expect(select).toBeTruthy();
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

    const { container } = render(
      <RoleFilters filters={filters} setFilters={setFilters} />
    );
    fireEvent.change(runningProfileSelect(container), {
      target: { value: 'Elite' },
    });

    expect(filters.runningProfile).toBe('Elite');
  });
});
