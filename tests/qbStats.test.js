import { describe, it, expect } from 'vitest';
import { formatQBStat } from '@/utils/formatting/qbStats';

describe('formatQBStat', () => {
  it('shows counting stats as whole numbers', () => {
    expect(formatQBStat(4200, 'YDS')).toBe('4200');
    expect(formatQBStat('31', 'TD')).toBe('31');
  });

  it('reads completion percentage stored either way', () => {
    expect(formatQBStat(0.653, 'CMP%')).toBe('65.3');
    expect(formatQBStat(65.3, 'CMP%')).toBe('65.3');
    expect(formatQBStat('65.3%', 'CMP%')).toBe('65.3');
  });

  it('gives rates one decimal and nothing for a missing value', () => {
    expect(formatQBStat(101.24, 'RTG')).toBe('101.2');
    expect(formatQBStat(null, 'QBR')).toBeNull();
    expect(formatQBStat('', 'YDS')).toBeNull();
    expect(formatQBStat('n/a', 'YDS')).toBeNull();
  });
});
