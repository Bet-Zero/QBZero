import { unwrapPlayer } from '@/components/shared/rankings/RankingViews';

/**
 * A ranking as text, for the places an image will not do.
 *
 * The export used to be a PNG or nothing -- fine for posting a board, useless
 * for pasting one into a spreadsheet or a message.
 */

const nameOf = (player) => player.name || player.display_name || '';

/** Numbered plain text: "#1 Josh Allen (BUF)". */
export const toPlainText = (rankings = []) =>
  rankings
    .map((item, index) => {
      const player = unwrapPlayer(item);
      const team = player.team ? ` (${player.team.toUpperCase()})` : '';
      return `#${index + 1} ${nameOf(player)}${team}`;
    })
    .join('\n');

/** A field needs quoting if it carries a comma, a quote or a line break. */
const csvCell = (value) => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Rank, name, team and notes, for a spreadsheet. */
export const toCsv = (rankings = []) => {
  const rows = rankings.map((item, index) => {
    const player = unwrapPlayer(item);
    return [
      index + 1,
      nameOf(player),
      player.team ? player.team.toUpperCase() : '',
      player.notes || '',
    ]
      .map(csvCell)
      .join(',');
  });

  return ['Rank,Name,Team,Notes', ...rows].join('\n');
};

/** A filename that every OS will accept, with today's date on it. */
export const exportFilename = (rankingName, extension) => {
  const date = new Date().toISOString().slice(0, 10);
  const safe =
    String(rankingName || 'qb-rankings')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'qb-rankings';
  return `${safe}-${date}.${extension}`;
};

/**
 * Hand the browser a file built in memory.
 *
 * Kept here rather than in the modal so the archive viewer can reuse it.
 */
export const downloadTextFile = (filename, text, mimeType = 'text/plain') => {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Revoking immediately can cancel the download in some browsers; a tick is
  // enough for the click to have been handled.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
