import React from 'react';
import PropTypes from 'prop-types';
import RankingMovementIndicator from '@/components/shared/RankingMovementIndicator';
import {
  getLogoPath,
  getLogoBackgroundStyle,
  getRankBackgroundStyle,
  getHeadshotSrc,
  createColumns,
} from '@/utils/rankingExportHelpers';

/**
 * The two ways a ranking is drawn: a poster-style grid card and a compact list
 * row. Extracted from RankingsExportModal so the ranker's results page can show
 * a ranking without opening a modal, and so the list row is defined once
 * instead of four times (mobile, tablet, desktop and the hidden export view).
 *
 * The markup is a verbatim move. Changing it changes both the on-screen view
 * and the downloaded image.
 */

/** Ranking entries may be bare players or { qb } / { player } wrappers. */
export const unwrapPlayer = (item) => item?.qb || item?.player || item;

const TeamLine = ({ player, className, logoBoxClass, spanClassName }) => {
  const logoPath = getLogoPath(player.team);
  return (
    <div className={className}>
      {logoPath && (
        <div className={logoBoxClass}>
          <img
            src={logoPath}
            alt={player.team}
            className="w-full h-full object-contain"
            loading="eager"
            decoding="async"
            crossOrigin="anonymous"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      <span className={spanClassName}>{player.team?.toUpperCase() || '—'}</span>
    </div>
  );
};

TeamLine.propTypes = {
  player: PropTypes.object.isRequired,
  className: PropTypes.string.isRequired,
  logoBoxClass: PropTypes.string.isRequired,
  // The grid card styles the team text; the list row inherits from its parent.
  spanClassName: PropTypes.string,
};

export const RankingGridCard = ({
  player,
  rank,
  showLogoBg,
  showMovement,
  movementData = {},
}) => {
  const headshot = getHeadshotSrc(player);
  const logoBackgroundStyle = getLogoBackgroundStyle(player.team, showLogoBg);
  const rankBackgroundStyle = getRankBackgroundStyle(player.team);
  const movement = movementData?.[player.id];

  return (
    <div className="inline-block w-full">
      {/* Card */}
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] rounded-lg overflow-hidden border border-white/25 transition-all hover:border-white/40 shadow-2xl">
        {/* Headshot Container with overlaid rank */}
        <div
          className="aspect-square w-full overflow-hidden bg-[#0a0a0a] relative border-b border-white/15"
          style={logoBackgroundStyle}
        >
          <img
            src={headshot}
            alt={player.name || player.display_name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="eager"
            decoding="async"
            crossOrigin="anonymous"
            onError={(e) => {
              e.target.src = '/assets/headshots/default.png';
            }}
          />
          {/* Rank overlay in corner */}
          <div className={`absolute top-2 left-2 ${rankBackgroundStyle}`}>
            {rank}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-3 relative bg-gradient-to-b from-[#1f1f1f] to-[#1a1a1a] border-t border-white/20">
          <div className="text-white font-medium truncate mb-1">
            {player.name || player.display_name}
          </div>
          <TeamLine
            player={player}
            className="flex items-center gap-1.5"
            logoBoxClass="w-4 h-4"
            spanClassName="text-white/60 text-sm"
          />

          {/* Movement indicator positioned absolutely in bottom-right */}
          {showMovement && movement?.moved && (
            <div className="absolute bottom-3 right-3">
              <RankingMovementIndicator movement={movement} showMovement />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

RankingGridCard.propTypes = {
  player: PropTypes.object.isRequired,
  rank: PropTypes.number.isRequired,
  showLogoBg: PropTypes.bool.isRequired,
  showMovement: PropTypes.bool.isRequired,
  movementData: PropTypes.object,
};

export const RankingListRow = ({ player, rank }) => (
  <div className="bg-white/5 rounded p-2 flex items-center gap-2">
    <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full font-bold text-white/80">
      {rank}
    </div>
    <img
      src={getHeadshotSrc(player)}
      alt={player.name || player.display_name}
      className="w-10 h-10 rounded-full object-cover"
      loading="eager"
      decoding="async"
      crossOrigin="anonymous"
      onError={(e) => {
        e.target.src = '/assets/headshots/default.png';
      }}
    />
    <div className="flex-1 truncate text-sm">
      <div className="font-medium text-white truncate">
        {player.name || player.display_name}
      </div>
      <TeamLine
        player={player}
        className="flex items-center gap-1 text-white/60 text-xs"
        logoBoxClass="w-4 h-4"
      />
    </div>
  </div>
);

RankingListRow.propTypes = {
  player: PropTypes.object.isRequired,
  rank: PropTypes.number.isRequired,
};

/**
 * One responsive band of the list view: `cols` balanced columns, shown only at
 * the breakpoint described by `className`.
 */
export const RankingListColumns = ({ rankings, cols, className }) => (
  <>
    {createColumns(rankings, cols).map((column, colIndex) => (
      <div key={colIndex} className={className}>
        {column.map(({ player, rank }) => (
          <RankingListRow
            key={player.id || player.player_id || player.name}
            player={player}
            rank={rank}
          />
        ))}
      </div>
    ))}
  </>
);

RankingListColumns.propTypes = {
  rankings: PropTypes.array.isRequired,
  cols: PropTypes.number.isRequired,
  className: PropTypes.string.isRequired,
};

/**
 * A whole ranking rendered for on-screen reading, in either view.
 *
 * The container classes mirror the modal's on-screen (non-export) layout. The
 * modal keeps its own containers because it also has a fixed-width export
 * variant; only the cards and rows are shared, and those are what the download
 * actually rasterises.
 */
export const RankingBoard = ({
  rankings = [],
  viewType = 'grid',
  showLogoBg = true,
  showMovement = false,
  movementData = {},
}) => {
  if (viewType === 'list') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-2 gap-y-1">
        <RankingListColumns
          rankings={rankings}
          cols={2}
          className="flex flex-col gap-1 sm:hidden"
        />
        <RankingListColumns
          rankings={rankings}
          cols={3}
          className="hidden sm:flex md:hidden flex-col gap-1"
        />
        <RankingListColumns
          rankings={rankings}
          cols={4}
          className="hidden md:flex flex-col gap-1"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-4 sm:gap-y-5 md:gap-y-6 justify-items-center">
      {rankings.slice(0, 42).map((item, idx) => {
        const player = unwrapPlayer(item);
        return (
          <RankingGridCard
            key={player.id || player.player_id || idx}
            player={player}
            rank={idx + 1}
            showLogoBg={showLogoBg}
            showMovement={showMovement}
            movementData={movementData}
          />
        );
      })}
    </div>
  );
};

RankingBoard.propTypes = {
  rankings: PropTypes.array,
  viewType: PropTypes.oneOf(['grid', 'list']),
  showLogoBg: PropTypes.bool,
  showMovement: PropTypes.bool,
  movementData: PropTypes.object,
};
