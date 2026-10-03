// The Backup QB bracket's field, picked by the owner (3 Oct 2026). Exactly
// 32, so everyone listed gets in; tests/backupQBClassification.test.js checks
// that each id is on the roster in src/features/ranker/quarterbacks.js.
export const BACKUP_QBS = [
  'joshua-dobbs',
  'tyrod-taylor',
  'carson-wentz',
  'tyson-bagent',
  'sam-howell',
  'andy-dalton',
  'marcus-mariota',
  'jameis-winston',
  'kenny-pickett',
  'spencer-rattler',
  'jalon-daniels',
  'tua-tagovailoa',
  'stetson-bennett-iv',
  'mac-jones',
  'drew-lock',
  'gardner-minshew-ii',
  'joe-flacco',
  'tyler-huntley',
  'mason-rudolph',
  'j-j-mccarthy',
  'tommy-devito',
  'kyle-allen',
  'jack-strand',
  'case-keenum',
  'anthony-richardson',
  'quinn-ewers',
  'davis-mills',
  'mitchell-trubisky',
  'justin-fields',
  'fernando-mendoza',
  'jarrett-stidham',
  'trey-lance',
];

// Function to determine if a QB is considered a backup
export const isBackupQB = (qbId) => {
  return BACKUP_QBS.includes(qbId);
};

// Function to get all backup QBs from a list of QBs
export const filterBackupQBs = (qbs) => {
  return qbs.filter((qb) => isBackupQB(qb.id || qb.player_id));
};

// Hall of Fame worthy backup QBs (legendary career backups)
export const BACKUP_QB_HALL_OF_FAME = [
  {
    id: 'joe-flacco',
    name: 'Joe Flacco',
    team: 'CIN',
    accomplishments: [
      'Super Bowl XLVII Champion & MVP',
      'Master of the backup QB role',
      'Clutch playoff performer',
      'Veteran leadership',
    ],
    blurb:
      'The ultimate backup QB who can step in and lead a team to victory when called upon.',
  },
  {
    id: 'jameis-winston',
    name: 'Jameis Winston',
    team: 'NYG',
    accomplishments: [
      '5,000 yard passer',
      'High-risk, high-reward style',
      'Proven starter experience',
      'Team chemistry builder',
    ],
    blurb:
      'A former starter who brings elite arm talent and experience to the backup role.',
  },
  {
    id: 'tyrod-taylor',
    name: 'Tyrod Taylor',
    team: 'GB',
    accomplishments: [
      'Mobile backup specialist',
      'Playoff experience',
      'Veteran mentor',
      'Dual-threat capability',
    ],
    blurb: 'The mobile backup who can change the game plan when he enters.',
  },
];
