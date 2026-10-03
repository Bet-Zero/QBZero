// src/features/lists/ListExportWrapper.jsx
import React from 'react';
import ListExportPlayerRowSingle from './ListExportPlayerRowSingle';
import ListExportPlayerRowTwoColumn from './ListExportPlayerRowTwoColumn';
import ListExportRowCompactSingle from './ListExportRowCompactSingle';
import ListExportRowCompactTwoColumn from './ListExportRowCompactTwoColumn';
import ListTierExport from './ListTierExport';

const ListExportWrapper = ({
  players = [],
  tiers = [],
  playersMap = {},
  isExport = false,
  isRanked = false,
  exportType = 'list',
  compact = false,
  twoColumn = true,
  title = '',
  subtitle = '',
}) => {
  if (!isExport) return null;

  let Row;
  if (compact) {
    Row = twoColumn
      ? ListExportRowCompactTwoColumn
      : ListExportRowCompactSingle;
  } else {
    Row = twoColumn ? ListExportPlayerRowTwoColumn : ListExportPlayerRowSingle;
  }

  const renderColumn = (plist, startIdx) => (
    <div className="flex flex-col gap-[3px] w-1/2 items-center">
      {plist.map((player, idx) => (
        <Row
          key={player.player_id || startIdx + idx}
          player={player}
          rank={isRanked && exportType === 'list' ? startIdx + idx + 1 : null}
        />
      ))}
    </div>
  );

  const renderSingleFlat = () => (
    <div className="flex flex-col gap-[3px] items-center w-full">
      {players.map((player, idx) => (
        <Row
          key={player.player_id || idx}
          player={player}
          rank={isRanked && exportType === 'list' ? idx + 1 : null}
        />
      ))}
    </div>
  );

  const renderSingleRanked = () => {
    let rankCounter = 1;
    return (
      <div className="flex flex-col gap-[3px] items-center w-full">
        {tiers.map((tier, tIdx) => (
          <React.Fragment key={tier.label || `tier-${tIdx}`}>
            <h2 className="text-white text-xs font-semibold uppercase w-full text-center">
              {tier.label || `Tier ${tIdx + 1}`}
            </h2>
            {tier.players.map((player, pIdx) => (
              <Row
                key={player.player_id || pIdx}
                player={player}
                rank={rankCounter++}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Two columns split evenly, left column first. Every player is shown; the
  // layout used to stop at 30 without saying so.
  const renderTwoColumnFlat = () => {
    const split = Math.ceil(players.length / 2);
    const left = players.slice(0, split);
    const right = players.slice(split);

    return (
      <div className="flex w-full gap-6">
        {renderColumn(left, 0)}
        {renderColumn(right, split)}
      </div>
    );
  };

  const renderRankedColumn = (items) => (
    <div className="flex flex-col gap-[1px] w-1/2 items-start">
      {items.map((it, idx) =>
        it.type === 'heading' ? (
          <h2
            key={`h-${idx}`}
            className="text-white text-xs font-semibold uppercase m-1"
          >
            {it.label}
          </h2>
        ) : (
          <Row
            key={it.player.player_id || it.rank}
            player={it.player}
            rank={exportType === 'list' ? it.rank : null}
          />
        )
      )}
    </div>
  );

  const renderTwoColumnRanked = () => {
    let rankCounter = 1;
    const left = [];
    const right = [];
    const total = tiers.reduce(
      (n, tier) => n + tier.players.filter(Boolean).length,
      0
    );
    const split = Math.ceil(total / 2);

    tiers.forEach((tier, tIdx) => {
      const tierPlayers = tier.players
        .map((p) => playersMap[p.id] || p)
        .filter(Boolean);
      if (tierPlayers.length === 0) return;

      const label = tier.label || `Tier ${tIdx + 1}`;
      let lastColumn = null;
      for (const player of tierPlayers) {
        const column = rankCounter <= split ? left : right;
        // Repeat the heading when a tier continues into the right column.
        if (column !== lastColumn) {
          column.push({ type: 'heading', label });
          lastColumn = column;
        }
        column.push({ type: 'player', player, rank: rankCounter });
        rankCounter += 1;
      }
    });

    return (
      <div className="flex w-full gap-6">
        {renderRankedColumn(left)}
        {renderRankedColumn(right)}
      </div>
    );
  };

  const renderFlatOrRanked = () => {
    if (twoColumn) {
      if (isRanked && tiers.length > 0) return renderTwoColumnRanked();
      return renderTwoColumnFlat();
    }
    if (isRanked && tiers.length > 0) return renderSingleRanked();
    return renderSingleFlat();
  };

  const renderTiered = () => {
    return (
      <div className="flex flex-col gap-2 items-center w-full">
        {(title || subtitle) && (
          <div className="text-center mb-4">
            {title && (
              <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
            )}
            {subtitle && (
              <p className="text-sm text-black whitespace-pre-line">
                {subtitle}
              </p>
            )}
          </div>
        )}
        <ListTierExport tiers={tiers} />
      </div>
    );
  };

  const containerPadding = twoColumn ? 'p-12' : 'p-24';

  return (
    <div
      className={`w-full overflow-auto ${containerPadding} bg-gradient-to-br from-[#1e1e1e] to-[#111] rounded-lg border border-neutral-700 shadow-sm`}
    >
      {title && exportType !== 'tier' && (
        <div className="w-full max-w-[1100px] mx-auto px-4 mb-6">
          <div className="h-[5px] w-24 bg-gradient-to-r from-neutral-500 to-neutral-900 rounded-full mb-4 shadow-lg"></div>
          <h1 className="text-5xl font-extrabold tracking-tight text-neutral-100 mb-3">
            {title}
          </h1>
        </div>
      )}
      {exportType === 'tier' ? renderTiered() : renderFlatOrRanked()}
    </div>
  );
};

export default ListExportWrapper;
