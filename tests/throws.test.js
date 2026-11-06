import { describe, it, expect } from 'vitest';
import { throwsFor } from '@/utils/roster/throws';

describe('throwsFor', () => {
  it('marks the curated left-handed passers as left', () => {
    for (const id of [
      'tua-tagovailoa',
      'michael-penix-jr',
      'dillon-gabriel',
      'cole-payton',
    ]) {
      expect(throwsFor({ id })).toBe('L');
    }
  });

  it('defaults everyone else to right', () => {
    expect(throwsFor({ id: 'josh-allen' })).toBe('R');
    expect(throwsFor({ id: 'joe-milton-iii' })).toBe('R');
  });

  it('lets a hand saved on the profile win', () => {
    expect(throwsFor({ id: 'tua-tagovailoa', bio: { Throws: 'R' } })).toBe('R');
    expect(throwsFor({ id: 'josh-allen', bio: { Throws: 'L' } })).toBe('L');
  });
});
