/**
 * Splitting a name across two lines.
 *
 * The archive cards force a two-line layout on mobile so every row is the same
 * height. Splitting on the last space put "Jr." alone on the second line for
 * Michael Penix Jr. and Marvin Mims Jr. -- a suffix belongs with the surname it
 * qualifies, not on a line of its own.
 */

const SUFFIXES = new Set([
  'jr',
  'jr.',
  'sr',
  'sr.',
  'ii',
  'iii',
  'iv',
  'v',
  'vi',
]);

const isSuffix = (part) => SUFFIXES.has(part.toLowerCase());

/**
 * @param {string} name - "Michael Penix Jr."
 * @returns {{ first: string, last: string }} - { first: "Michael", last: "Penix Jr." }
 *
 * A single-word name returns it as `first` with an empty `last`, so a caller
 * rendering two lines simply draws nothing on the second.
 */
export const splitNameForTwoLines = (name) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };

  // Take the surname, plus a suffix if one trails it. "Michael Penix Jr."
  // keeps "Penix Jr." together; "Aidan O'Connell" is unaffected.
  const tailLength = parts.length > 2 && isSuffix(parts[parts.length - 1]) ? 2 : 1;

  return {
    first: parts.slice(0, parts.length - tailLength).join(' '),
    last: parts.slice(parts.length - tailLength).join(' '),
  };
};
