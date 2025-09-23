/**
 * Shared utilities for ranking exports across different components
 */

// Mapping team abbreviations to logo file names
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

// Custom positioning for specific team logos in grid view background
export const teamLogoPositioning = {
  DAL: { x: 55, y: 0 },
  NO: { x: 125, y: 0 },
  DET: { x: 0, y: 75 },
  PHI: { x: 120, y: 0 },
  MIN: { x: 80, y: 140 },
  MIA: { x: 60, y: 60 },
  NE: { x: 0, y: 20 },
  BUF: { x: 80, y: 30 },
  CAR: { x: 20, y: 50 },
  TB: { x: 110, y: 60 },
};

// Teams whose logos occupy the top-left area and interfere with rank numbers
export const teamsWithTopLeftLogos = [
  'LV',
  'LAV', // Raiders
  'ATL', // Falcons
  'NYG', // Giants
  'HOU', // Texans
  'IND', // Colts
  'CHI', // Bears
  'ARI', // Cardinals
  'TEN', // Titans (partial overlap)
  'CIN', // Bengals (partial overlap)
  'CLE', // Browns (partial overlap)
  'JAX', // Jaguars (partial overlap)
  'PIT', // Steelers (partial overlap)
];

/**
 * Get smart rank background styling based on team logo placement
 */
export const getRankBackgroundStyle = (team) => {
  const hasLogoConflict = teamsWithTopLeftLogos.includes(team);

  if (hasLogoConflict) {
    // Higher opacity background with stronger shadow for teams with logo conflicts
    return 'bg-neutral-900/80 backdrop-blur-sm text-white font-bold text-2xl px-1.5 py-1 rounded shadow-xl border border-white/20';
  } else {
    // Keep the original subtle styling for teams without conflicts
    return 'bg-neutral-600/50 backdrop-blur-sm text-white font-bold text-2xl px-1.5 py-1 rounded shadow-lg';
  }
};

/**
 * Helper function to get logo path safely
 */
export const getLogoPath = (team) => {
  if (!team) return null;
  const logoId = teamLogoMap[team] || team.toLowerCase();
  return `/assets/logos/${logoId}.svg`;
};

/**
 * Helper function to get background positioning for team logos - CENTERED VERSION for personal rankings
 */
export const getLogoBackgroundStyle = (team, showLogoBg) => {
  if (!showLogoBg) {
    return { backgroundImage: 'none' };
  }

  const logoPath = getLogoPath(team);
  if (!logoPath) {
    return { backgroundImage: 'none' };
  }

  // Always center logos for personal rankings export (ignore custom positioning)
  // Use a darker gray overlay (instead of the original light gray) for better contrast
  return {
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15)), url(${logoPath})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  };
};

/**
 * Helper function to get headshot source with fallbacks
 */
export const getHeadshotSrc = (player) =>
  player?.headshotUrl ||
  player?.imageUrl ||
  `/assets/headshots/${player?.player_id || player?.id}.png`;

/**
 * Create column arrays for list view
 */
export const createColumns = (rankings, cols) => {
  const itemsPerCol = Math.ceil(rankings.length / cols);
  const columns = Array(cols)
    .fill()
    .map(() => []);

  rankings.forEach((item, idx) => {
    const colIndex = Math.floor(idx / itemsPerCol);
    if (colIndex < cols) {
      // Support both player objects directly and wrapped objects like { qb, rank }
      const player = item.qb || item.player || item;
      columns[colIndex].push({ player, rank: idx + 1 });
    }
  });

  return columns;
};