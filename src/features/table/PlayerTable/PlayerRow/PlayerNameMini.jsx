import React from 'react';

const formatFullName = (name) => {
  if (!name) return ['', ''];
  const suffixes = ['jr', 'sr', 'ii', 'iii', 'iv', 'v'];

  const words = name
    .trim()
    .split(' ')
    .map((word) => {
      if (suffixes.includes(word.toLowerCase())) return word.toUpperCase();
      if (word.length <= 2 && word === word.toUpperCase()) return word;
      if (word.includes("'")) {
        return word
          .split("'")
          .map(
            (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
          )
          .join("'");
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

  const first = words[0] || '';
  const last = words.slice(1).join(' ') || '';
  return [first, last];
};

// Specific name overrides for spacing/sizing
// Previously this list handled lengthy NBA player names. Repurposed here for
// notable quarterback names that otherwise render awkwardly at default sizes.
const fontSizeOverrides = {
  'Michael Penix Jr': { first: 20, last: 18 },
  'Tua Tagovailoa': { first: 22, last: 17 },
  'C.J. Stroud': { first: 22, last: 19 },
};

const PlayerNameMini = ({
  name = 'Patrick Mahomes',
  scale = 1,
  width = 140,
  firstWeightClass = 'font-light',
  lastWeightClass = 'font-bold',
}) => {
  const [firstName, lastName] = formatFullName(name);
  const override = fontSizeOverrides[name] || {};
  const firstSize = (override.first || 22) * scale;
  const lastSize = (override.last || 21) * scale;

  return (
    <div
      className="flex flex-col items-start justify-center leading-tight mt-1 overflow-visible"
      style={{ width: `${width * scale}px` }}
    >
      <span
        className={`text-white/70 font-anton ${firstWeightClass} uppercase mb-[2px] tracking-normal leading-none whitespace-nowrap`}
        style={{ fontSize: `${firstSize}px` }}
      >
        {firstName}
      </span>
      <span
        className={`text-white font-anton ${lastWeightClass} uppercase tracking-normal leading-none whitespace-nowrap`}
        style={{ fontSize: `${lastSize}px` }}
      >
        {lastName}
      </span>
    </div>
  );
};

export default PlayerNameMini;
