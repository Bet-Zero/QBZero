export const teamLogoMap = {
  ARI: 'cardinals',
  ATL: 'falcons',
  BAL: 'ravens',
  BUF: 'bills',
  CAR: 'panthers',
  CHI: 'bears',
  CIN: 'bengals',
  CLE: 'browns',
  DAL: 'cowboys',
  DEN: 'broncos',
  DET: 'lions',
  GB: 'packers',
  HOU: 'texans',
  IND: 'colts',
  JAX: 'jaguars',
  KC: 'chiefs',
  LAC: 'chargers',
  LAR: 'rams',
  LAV: 'raiders',
  LV: 'raiders',
  MIA: 'dolphins',
  MIN: 'vikings',
  NE: 'patriots',
  NO: 'saints',
  NYG: 'giants',
  NYJ: 'jets',
  PHI: 'eagles',
  PIT: 'steelers',
  SF: '49ers',
  SEA: 'seahawks',
  TB: 'buccaneers',
  TEN: 'titans',
  WAS: 'commanders',
};

export const teamsWithTopLeftLogos = [
  'LV',
  'LAV',
  'ATL',
  'NYG',
  'HOU',
  'IND',
  'CHI',
  'ARI',
  'TEN',
  'CIN',
  'CLE',
  'JAX',
  'PIT',
];

export const getRankBackgroundStyle = (team) => {
  const hasLogoConflict = teamsWithTopLeftLogos.includes(team);

  if (hasLogoConflict) {
    return 'bg-neutral-900/80 backdrop-blur-sm text-white font-bold text-2xl px-1.5 py-1 rounded shadow-xl border border-white/20';
  }

  return 'bg-neutral-600/50 backdrop-blur-sm text-white font-bold text-2xl px-1.5 py-1 rounded shadow-lg';
};

export const getLogoPath = (team) => {
  if (!team) return null;
  const logoId = teamLogoMap[team] || team.toLowerCase();
  return `/assets/logos/${logoId}.svg`;
};

export const getLogoBackgroundStyle = (team, showLogoBg) => {
  if (!showLogoBg) {
    return { backgroundImage: 'none' };
  }

  const logoPath = getLogoPath(team);
  if (!logoPath) {
    return { backgroundImage: 'none' };
  }

  return {
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15)), url(${logoPath})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  };
};

export const getHeadshotSrc = (player) =>
  player?.headshotUrl ||
  player?.imageUrl ||
  `/assets/headshots/${player?.player_id || player?.id}.png`;
