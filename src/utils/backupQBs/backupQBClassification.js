// Classification of backup QBs vs starters
// Based on typical NFL roles and depth chart positions

export const BACKUP_QBS = [
  // Veteran backups who are known for the backup role
  'joe-flacco',
  'jameis-winston', 
  'tyrod-taylor',
  'sam-howell',
  
  // Young/developmental backups
  'jake-haener',
  'spencer-rattler',
  'tyler-shough',
  'jaxson-dart',
  'cameron-ward',
  
  // Rookies likely to be backups initially
  'bo-nix', // might be starter but often backup role
  'michael-penix-jr',
  'j-j-mccarthy',
  
  // QBs in backup/transition roles
  'justin-fields', // moved to backup role
  'russell-wilson', // veteran in backup/competition
  'sam-darnold', // often backup role
];

export const STARTER_QBS = [
  'patrick-mahomes',
  'josh-allen', 
  'lamar-jackson',
  'joe-burrow',
  'jalen-hurts',
  'dak-prescott',
  'brock-purdy',
  'jared-goff',
  'jordan-love',
  'tua-tagovailoa',
  'justin-herbert',
  'c-j-stroud',
  'trevor-lawrence',
  'kyler-murray',
  'matthew-stafford',
  'kirk-cousins',
  'geno-smith',
  'baker-mayfield',
  'aaron-rodgers',
  'jayden-daniels',
  'caleb-williams',
  'anthony-richardson',
  'drake-maye',
  'bryce-young',
  'daniel-jones',
];

// Function to determine if a QB is considered a backup
export const isBackupQB = (qbId) => {
  return BACKUP_QBS.includes(qbId);
};

// Function to get all backup QBs from a list of QBs
export const filterBackupQBs = (qbs) => {
  return qbs.filter(qb => isBackupQB(qb.id || qb.player_id));
};

// Hall of Fame worthy backup QBs (legendary career backups)
export const BACKUP_QB_HALL_OF_FAME = [
  {
    id: 'joe-flacco',
    name: 'Joe Flacco',
    team: 'CLE',
    accomplishments: [
      'Super Bowl XLVII Champion & MVP',
      'Master of the backup QB role',
      'Clutch playoff performer',
      'Veteran leadership'
    ],
    blurb: 'The ultimate backup QB who can step in and lead a team to victory when called upon.'
  },
  {
    id: 'jameis-winston', 
    name: 'Jameis Winston',
    team: 'NYG',
    accomplishments: [
      '5,000 yard passer',
      'High-risk, high-reward style',
      'Proven starter experience',
      'Team chemistry builder'
    ],
    blurb: 'A former starter who brings elite arm talent and experience to the backup role.'
  },
  {
    id: 'tyrod-taylor',
    name: 'Tyrod Taylor', 
    team: 'NYJ',
    accomplishments: [
      'Mobile backup specialist',
      'Playoff experience',
      'Veteran mentor',
      'Dual-threat capability'
    ],
    blurb: 'The mobile backup who can change the game plan when he enters.'
  }
];