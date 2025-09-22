import React, { forwardRef } from 'react';
import {
  formatListDate,
  getDisplayName,
  getHeadshotSrc,
  getLogoPath,
  getPlayerIdentifier,
  getTeamDisplay,
} from '@/features/rankings/utils/rankingTemplateUtils';

const RankingsListView = forwardRef(({ players = [], title = 'NFL QB Rankings', updatedDate = new Date() }, ref) => {
  const formattedDate = formatListDate(updatedDate);

  const numCols = {
    base: 2,
    sm: 3,
    md: 4,
  };

  const createColumns = (cols) => {
    if (cols <= 0) return [];
    const itemsPerCol = Math.ceil(players.length / cols) || 1;
    const columns = Array.from({ length: cols }, () => []);

    players.forEach((player, idx) => {
      const columnIndex = Math.floor(idx / itemsPerCol);
      if (columnIndex < cols) {
        columns[columnIndex].push({ player, rank: idx + 1 });
      }
    });

    return columns;
  };

  const renderColumn = (column, viewportKey, extraClasses) => (
    <div key={viewportKey} className={extraClasses}>
      {column.map(({ player, rank }) => {
        const identifier = getPlayerIdentifier(player, rank);
        const headshot = getHeadshotSrc(player);
        const logoPath = getLogoPath(player?.team);

        return (
          <div
            key={identifier}
            className="bg-white/5 rounded p-2 flex items-center gap-2"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full font-bold text-white/80">
              {rank}
            </div>
            <img
              src={headshot}
              alt={getDisplayName(player)}
              className="w-10 h-10 rounded-full object-cover"
              loading="eager"
              decoding="async"
              crossOrigin="anonymous"
              onError={(e) => {
                e.currentTarget.src = '/assets/headshots/default.png';
              }}
            />
            <div className="flex-1 truncate text-sm">
              <div className="font-medium text-white truncate">
                {getDisplayName(player)}
              </div>
              <div className="flex items-center gap-1 text-white/60 text-xs">
                {logoPath && (
                  <div className="w-4 h-4">
                    <img
                      src={logoPath}
                      alt={player?.team}
                      className="w-full h-full object-contain"
                      loading="eager"
                      decoding="async"
                      crossOrigin="anonymous"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <span>{getTeamDisplay(player)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div ref={ref} className="bg-neutral-900 p-6 rounded-lg border border-white/10">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-2">
          {title}
        </h1>
        <div className="text-sm text-white/60 italic">{formattedDate}</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-2 gap-y-1">
        {createColumns(numCols.base).map((column, columnIndex) =>
          renderColumn(column, `mobile-${columnIndex}`, 'flex flex-col gap-1 sm:hidden')
        )}

        {createColumns(numCols.sm).map((column, columnIndex) =>
          renderColumn(column, `tablet-${columnIndex}`, 'hidden sm:flex md:hidden flex-col gap-1')
        )}

        {createColumns(numCols.md).map((column, columnIndex) =>
          renderColumn(column, `desktop-${columnIndex}`, 'hidden md:flex flex-col gap-1')
        )}
      </div>
    </div>
  );
});

RankingsListView.displayName = 'RankingsListView';

export default RankingsListView;
