import { TEAM_LOGO_MAP } from '@/utils/formatting/teamLogos';

// TEAM_LOGO_MAP is keyed by abbreviation and valued by the nickname each team
// uses as its id here, so invert it rather than writing the pairing out twice.
const ABBR_BY_ID = Object.fromEntries(
  Object.entries(TEAM_LOGO_MAP)
    .filter(([key]) => /^[A-Z]{2,3}$/.test(key))
    .map(([abbr, nickname]) => [nickname, abbr])
);

const TEAMS = [
  {
    id: 'cardinals',
    teamName: 'Arizona Cardinals',
    nickname: 'Cardinals',
    conference: 'NFC',
  },
  {
    id: 'falcons',
    teamName: 'Atlanta Falcons',
    nickname: 'Falcons',
    conference: 'NFC',
  },
  {
    id: 'ravens',
    teamName: 'Baltimore Ravens',
    nickname: 'Ravens',
    conference: 'AFC',
  },
  {
    id: 'bills',
    teamName: 'Buffalo Bills',
    nickname: 'Bills',
    conference: 'AFC',
  },
  {
    id: 'panthers',
    teamName: 'Carolina Panthers',
    nickname: 'Panthers',
    conference: 'NFC',
  },
  {
    id: 'bears',
    teamName: 'Chicago Bears',
    nickname: 'Bears',
    conference: 'NFC',
  },
  {
    id: 'bengals',
    teamName: 'Cincinnati Bengals',
    nickname: 'Bengals',
    conference: 'AFC',
  },
  {
    id: 'browns',
    teamName: 'Cleveland Browns',
    nickname: 'Browns',
    conference: 'AFC',
  },
  {
    id: 'cowboys',
    teamName: 'Dallas Cowboys',
    nickname: 'Cowboys',
    conference: 'NFC',
  },
  {
    id: 'broncos',
    teamName: 'Denver Broncos',
    nickname: 'Broncos',
    conference: 'AFC',
  },
  {
    id: 'lions',
    teamName: 'Detroit Lions',
    nickname: 'Lions',
    conference: 'NFC',
  },
  {
    id: 'packers',
    teamName: 'Green Bay Packers',
    nickname: 'Packers',
    conference: 'NFC',
  },
  {
    id: 'texans',
    teamName: 'Houston Texans',
    nickname: 'Texans',
    conference: 'AFC',
  },
  {
    id: 'colts',
    teamName: 'Indianapolis Colts',
    nickname: 'Colts',
    conference: 'AFC',
  },
  {
    id: 'jaguars',
    teamName: 'Jacksonville Jaguars',
    nickname: 'Jaguars',
    conference: 'AFC',
  },
  {
    id: 'chiefs',
    teamName: 'Kansas City Chiefs',
    nickname: 'Chiefs',
    conference: 'AFC',
  },
  {
    id: 'raiders',
    teamName: 'Las Vegas Raiders',
    nickname: 'Raiders',
    conference: 'AFC',
  },
  {
    id: 'chargers',
    teamName: 'Los Angeles Chargers',
    nickname: 'Chargers',
    conference: 'AFC',
  },
  {
    id: 'rams',
    teamName: 'Los Angeles Rams',
    nickname: 'Rams',
    conference: 'NFC',
  },
  {
    id: 'dolphins',
    teamName: 'Miami Dolphins',
    nickname: 'Dolphins',
    conference: 'AFC',
  },
  {
    id: 'vikings',
    teamName: 'Minnesota Vikings',
    nickname: 'Vikings',
    conference: 'NFC',
  },
  {
    id: 'patriots',
    teamName: 'New England Patriots',
    nickname: 'Patriots',
    conference: 'AFC',
  },
  {
    id: 'saints',
    teamName: 'New Orleans Saints',
    nickname: 'Saints',
    conference: 'NFC',
  },
  {
    id: 'giants',
    teamName: 'New York Giants',
    nickname: 'Giants',
    conference: 'NFC',
  },
  {
    id: 'jets',
    teamName: 'New York Jets',
    nickname: 'Jets',
    conference: 'AFC',
  },
  {
    id: 'eagles',
    teamName: 'Philadelphia Eagles',
    nickname: 'Eagles',
    conference: 'NFC',
  },
  {
    id: 'steelers',
    teamName: 'Pittsburgh Steelers',
    nickname: 'Steelers',
    conference: 'AFC',
  },
  {
    id: '49ers',
    teamName: 'San Francisco 49ers',
    nickname: '49ers',
    conference: 'NFC',
  },
  {
    id: 'seahawks',
    teamName: 'Seattle Seahawks',
    nickname: 'Seahawks',
    conference: 'NFC',
  },
  {
    id: 'buccaneers',
    teamName: 'Tampa Bay Buccaneers',
    nickname: 'Buccaneers',
    conference: 'NFC',
  },
  {
    id: 'titans',
    teamName: 'Tennessee Titans',
    nickname: 'Titans',
    conference: 'AFC',
  },
  {
    id: 'commanders',
    teamName: 'Washington Commanders',
    nickname: 'Commanders',
    conference: 'NFC',
  },
];

// Player records store the abbreviation (bio.Team is 'ARI'), while the filter
// dropdowns are keyed by id ('cardinals'). Carrying both lets the two meet.
export const TeamListFull = TEAMS.map((team) => ({
  ...team,
  abbr: ABBR_BY_ID[team.id],
}));

export const TeamMap = Object.fromEntries(TeamListFull.map((t) => [t.id, t]));

// Accepts either an id ('cardinals') or an abbreviation ('ARI'/'ari').
export const teamAbbrFor = (idOrAbbr) => {
  if (!idOrAbbr) return '';
  return (TeamMap[idOrAbbr]?.abbr || idOrAbbr).toUpperCase();
};
