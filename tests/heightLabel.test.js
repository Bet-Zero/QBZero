import { describe, it, expect } from 'vitest';
import { formatHeightLabel } from '@/utils/formatting';

describe('formatHeightLabel', () => {
  it('drops the zero pad on single-digit inches', () => {
    expect(formatHeightLabel('6-01')).toBe('6-1');
    expect(formatHeightLabel('6-06')).toBe('6-6');
    expect(formatHeightLabel('6-00')).toBe('6-0');
  });

  it('leaves two-digit inches alone', () => {
    expect(formatHeightLabel('5-10')).toBe('5-10');
    expect(formatHeightLabel('5-11')).toBe('5-11');
  });

  it('leaves an already-unpadded or missing height alone', () => {
    expect(formatHeightLabel('6-2')).toBe('6-2');
    expect(formatHeightLabel(null)).toBeNull();
    expect(formatHeightLabel(undefined)).toBeUndefined();
  });
});
