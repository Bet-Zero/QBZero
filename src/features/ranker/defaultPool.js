// The ranker's default pool: every team's starter, plus the backups worth
// ranking alongside them.
//
// The full roster carries ~90 quarterbacks, most of them practice-squad depth
// nobody wants to sit through comparisons for. The default trims that to the
// ones a ranking is actually about; "Every active QB" on the setup page still
// offers the whole list.
//
// Size is a multiple of 6 on purpose — the rankings export lays out six per
// row, so 42 fills seven clean rows. Keep it that way when editing: swap a
// backup out rather than adding one. tests/defaultPool.test.js enforces it.
//
// `starters` is keyed by team, so there is exactly one per team by
// construction. When a team changes starter, move the old one into `backups`
// if they are still worth ranking, and drop the weakest backup to keep the
// total on a row boundary.
//
// Ids must exist in quarterbacks.js. A retired quarterback drops out of the
// pool at runtime, so retiring someone here does not need an edit — but it
// leaves a gap in the last row until the list is updated.
//
// Last set: 2 Oct 2026, week 5. See VERIFY below.

export const DEFAULT_POOL_STARTERS = {
  ARI: 'jacoby-brissett',
  ATL: 'tua-tagovailoa',
  BAL: 'lamar-jackson',
  BUF: 'josh-allen',
  CAR: 'bryce-young',
  CHI: 'caleb-williams',
  CIN: 'joe-burrow',
  CLE: 'shedeur-sanders',
  DAL: 'dak-prescott',
  DEN: 'bo-nix',
  DET: 'jared-goff',
  GB: 'jordan-love',
  HOU: 'c-j-stroud',
  IND: 'daniel-jones',
  JAX: 'trevor-lawrence',
  KC: 'patrick-mahomes',
  LAC: 'justin-herbert',
  LAR: 'matthew-stafford',
  LV: 'fernando-mendoza',
  MIA: 'malik-willis',
  MIN: 'kyler-murray',
  NE: 'drake-maye',
  NO: 'tyler-shough',
  NYG: 'jaxson-dart',
  NYJ: 'geno-smith',
  PHI: 'jalen-hurts',
  PIT: 'aaron-rodgers',
  SEA: 'sam-darnold',
  SF: 'brock-purdy',
  TB: 'baker-mayfield',
  TEN: 'cameron-ward',
  WAS: 'jayden-daniels',
};

// Backups with a real claim to playing time: injury fill-ins, the other half
// of an open competition, and recent starters.
export const DEFAULT_POOL_BACKUPS = [
  'michael-penix-jr', // ATL
  'deshaun-watson', // CLE
  'anthony-richardson', // IND
  'justin-fields', // KC
  'kirk-cousins', // LV
  'j-j-mccarthy', // MIN
  'jameis-winston', // NYG — starting while Dart is out
  'joe-flacco', // CIN
  'mac-jones', // SF
  'marcus-mariota', // WAS
];

export const DEFAULT_POOL_IDS = [
  ...Object.values(DEFAULT_POOL_STARTERS),
  ...DEFAULT_POOL_BACKUPS,
];

// VERIFY — teams whose starter here is a projection rather than a confirmed
// depth chart, mostly open competitions where both quarterbacks are in the
// pool anyway, so a wrong pick only mislabels who is the starter:
//
//   ARI Brissett, ATL Tagovailoa / Penix, CLE Sanders / Watson,
//   IND Jones / Richardson, LV Mendoza / Cousins, MIN Murray / McCarthy,
//   PIT Rodgers
