import { describe, it, expect } from 'vitest';
import { getPlayerPositionLabel } from '@/utils/roles';
import { POSITION_MAP } from '@/utils/roles/positionMap';

describe('getPlayerPositionLabel', () => {
  it('abbreviates quarterback', () => {
    expect(getPlayerPositionLabel('Quarterback')).toBe('QB');
  });

  it('carries no basketball positions', () => {
    expect(Object.keys(POSITION_MAP)).toEqual(['Quarterback']);
  });

  it('passes unknown values through and dashes empty ones', () => {
    expect(getPlayerPositionLabel('QB')).toBe('QB');
    expect(getPlayerPositionLabel(undefined)).toBe('—');
  });
});
