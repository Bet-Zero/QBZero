// The quarterback box-score stats, in display order.
//
// `field` is the property on a normalized player (normalizePlayerData lifts
// these out of system.stats); `key` is the suffix the filters use, so a floor
// on completion percentage is `min_CMPP`. They differ only where the stat name
// contains a character awkward in a filter key, following the convention the
// basketball filters used for FG% -> FGP.
//
// This app was duplicated from a basketball project. The stat displays were
// repurposed for quarterbacks but the filters were not, so the panel offered
// PPG/RPG/APG against players who have no PTS/TRB/AST -- setting any one of
// them compared 0 against the floor and emptied the table. Import from here
// rather than writing the list out again.
export const QB_STATS = [
  { key: 'CMP', label: 'CMP', field: 'CMP', max: 600 },
  { key: 'ATT', label: 'ATT', field: 'ATT', max: 800 },
  { key: 'YDS', label: 'YDS', field: 'YDS', max: 6000 },
  { key: 'TD', label: 'TD', field: 'TD', max: 60 },
  { key: 'INT', label: 'INT', field: 'INT', max: 40 },
  { key: 'CMPP', label: 'CMP%', field: 'CMP%', max: 100, isPercent: true },
  { key: 'RTG', label: 'RTG', field: 'RTG', max: 158.3 },
  { key: 'QBR', label: 'QBR', field: 'QBR', max: 100 },
];

export const QB_STAT_ABBREVIATIONS = Object.fromEntries(
  QB_STATS.map((stat) => [stat.key, stat.label.toLowerCase()])
);
