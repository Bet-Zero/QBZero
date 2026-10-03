import { describe, expect, it } from 'vitest';
import { BACKUP_QBS } from '@/utils/backupQBs/backupQBClassification';
import { quarterbacks } from '@/features/ranker/quarterbacks';

describe('backup QB bracket field', () => {
  it('lists 32 different quarterbacks, all on the roster', () => {
    const rosterIds = new Set(quarterbacks.map((qb) => qb.id));
    expect(BACKUP_QBS).toHaveLength(32);
    expect(new Set(BACKUP_QBS).size).toBe(32);
    expect(BACKUP_QBS.filter((id) => !rosterIds.has(id))).toEqual([]);
  });
});
