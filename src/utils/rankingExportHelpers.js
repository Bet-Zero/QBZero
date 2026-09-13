/**
 * Shared utilities for ranking exports across different components
 */

import { TEAM_LOGO_MAP } from '@/utils/formatting/teamLogos';

// Canonical map lives in utils/formatting/teamLogos.js, which the shared
// TeamLogo component already uses. Re-exported here so existing importers keep
// working. The previous local copy carried an extra `LAV: 'raiders'` alias that
// appears nowhere in the data (the Raiders are `LV`).
export const teamLogoMap = TEAM_LOGO_MAP;

// Teams whose logos occupy the top-left area and interfere with rank numbers
export const teamsWithTopLeftLogos = [
  'LV', // Raiders
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
 * Split a ranking into `cols` balanced columns, reading down each in turn.
 *
 * Every column used to take `ceil(n / cols)` entries, so the remainder piled
 * up at the front and the last column could come out empty -- four players
 * across three columns filled two, two and none.
 */
export const createColumns = (rankings, cols) => {
  const columns = Array(cols)
    .fill()
    .map(() => []);
  if (!cols) return columns;

  const base = Math.floor(rankings.length / cols);
  const remainder = rankings.length % cols;

  let index = 0;
  for (let col = 0; col < cols; col += 1) {
    const size = base + (col < remainder ? 1 : 0);
    for (let n = 0; n < size; n += 1, index += 1) {
      const item = rankings[index];
      // Support both player objects directly and wrapped objects like { qb, rank }
      const player = item.qb || item.player || item;
      columns[col].push({ player, rank: index + 1 });
    }
  }

  return columns;
};
