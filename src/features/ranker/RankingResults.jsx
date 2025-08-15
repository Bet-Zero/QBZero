import React from 'react';

// Simple grid display for final rankings. Renders a responsive list of
// player names with their rank number. Designed to scale up to large player
// pools by using a multi-column layout.

const RankingResults = ({ ranking = [] }) => {
  const handleCopy = () => {
    const text = ranking
      .map((p, idx) => `#${idx + 1} ${p.display_name || p.name}`)
      .join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleExportCSV = () => {
    const rows = ranking
      .map(
        (p, idx) =>
          `${idx + 1},"${(p.display_name || p.name).replace(/"/g, '""')}"`
      )
      .join('\n');
    const csv = `Rank,Name\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ranking.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 mx-auto max-w-5xl px-4">
      <div className="flex flex-col items-center mb-4 mt-12 gap-2 sm:flex-row sm:justify-between sm:gap-4">
        <h2 className="text-2xl font-bold text-center flex-1 mb-1">
          QB Rankings 2025
        </h2>
        <div className="flex gap-2">
          {/* Copy icon button */}
          <button
            onClick={handleCopy}
            className="px-3 py-1 text-sm text-white bg-white/10 rounded hover:bg-white/20 flex items-center"
            title="Copy List"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="mr-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy
          </button>
        </div>
      </div>
      <ol className="list-none columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
        {ranking.map((p, idx) => {
          const headshot =
            p.headshot ||
            p.headshotUrl ||
            `/assets/headshots/${p.player_id || p.id}.png`;
          return (
            <li
              key={p.id}
              className="flex items-center h-10 px-2 mb-2 bg-white/5 rounded text-white gap-2 break-inside-avoid"
            >
              <span className="font-bold">#{idx + 1}</span>
              <img
                src={headshot}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = '/assets/headshots/default.png';
                }}
              />
              <span className="truncate">{p.display_name || p.name}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default RankingResults;
