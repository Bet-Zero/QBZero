import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  buildBracketBlueprint,
  clearDependentWinners,
  getChampion,
  getMatchParticipants,
  setWinner,
} from './bracketMath';
import MatchupCard, { MATCH_HEIGHT } from './MatchupCard';
import clsx from 'clsx';

const BASE_GAP = 28;
const COLUMN_WIDTH = 228;
const COLUMN_GAP = 96;
const MIN_SCALE = 0.6;
const MAX_SCALE = 1.6;
const HOVER_BOOST = 0.18;

const useAutoFit = () => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [fitScale, setFitScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const calculateFit = () => {
      const containerWidth = container.clientWidth;
      const contentWidth = content.scrollWidth;
      if (!contentWidth) return;
      const nextFit = Math.min(1, Math.max(MIN_SCALE, containerWidth / contentWidth));
      setFitScale(nextFit);
    };

    calculateFit();

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(calculateFit);
      resizeObserver.observe(container);
      resizeObserver.observe(content);

      return () => {
        resizeObserver.disconnect();
      };
    }

    window.addEventListener('resize', calculateFit);
    return () => {
      window.removeEventListener('resize', calculateFit);
    };
  }, []);

  return { containerRef, contentRef, fitScale };
};

const BackupQBBracket = ({ entrants = [], preferredSize = 32 }) => {
  const blueprint = useMemo(() => buildBracketBlueprint(entrants, preferredSize), [entrants, preferredSize]);
  const { size, seeded, rounds, labels } = blueprint;
  const [winners, setWinners] = useState(blueprint.winners);
  const [hoveredMatch, setHoveredMatch] = useState(null);
  const [isManualZoom, setIsManualZoom] = useState(false);

  const { containerRef, contentRef, fitScale } = useAutoFit();
  const [baseScale, setBaseScale] = useState(1);
  const [displayScale, setDisplayScale] = useState(1);

  useEffect(() => {
    setWinners(blueprint.winners);
    setHoveredMatch(null);
    setIsManualZoom(false);
  }, [blueprint]);

  useEffect(() => {
    if (!isManualZoom) {
      setBaseScale(fitScale);
    }
  }, [fitScale, isManualZoom]);

  useEffect(() => {
    const focusScale = Math.min(MAX_SCALE, Math.max(baseScale, baseScale + HOVER_BOOST));
    if (hoveredMatch) {
      setDisplayScale(focusScale);
    } else {
      setDisplayScale(baseScale);
    }
  }, [baseScale, hoveredMatch]);

  const handleSelectWinner = (roundIndex, matchIndex, playerId) => {
    setWinners((current) => {
      const existing = current[roundIndex][matchIndex];
      let updated = current;
      if (existing === playerId) {
        updated = setWinner(current, roundIndex, matchIndex, null);
        updated = clearDependentWinners(updated, roundIndex, matchIndex);
        return updated;
      }

      updated = setWinner(current, roundIndex, matchIndex, playerId);
      updated = clearDependentWinners(updated, roundIndex, matchIndex);
      return updated;
    });
  };

  const champion = useMemo(() => getChampion(winners, seeded.byId), [winners, seeded.byId]);

  const handleZoomIn = () => {
    setIsManualZoom(true);
    setBaseScale((scale) => Math.min(MAX_SCALE, scale + 0.15));
  };

  const handleZoomOut = () => {
    setIsManualZoom(true);
    setBaseScale((scale) => Math.max(MIN_SCALE, scale - 0.15));
  };

  const handleFit = () => {
    setIsManualZoom(false);
    setBaseScale(fitScale);
  };

  const handleResetZoom = () => {
    setIsManualZoom(true);
    setBaseScale(1);
  };

  const handleResetBracket = () => {
    setWinners(blueprint.winners);
    setHoveredMatch(null);
    setIsManualZoom(false);
    setBaseScale(fitScale);
  };

  const columnStyle = (roundIndex) => {
    const centerSpacing = Math.pow(2, roundIndex) * (MATCH_HEIGHT + BASE_GAP);
    const gap = centerSpacing - MATCH_HEIGHT;
    const offset =
      roundIndex === 0
        ? 0
        : ((Math.pow(2, roundIndex) - 1) / 2) * (MATCH_HEIGHT + BASE_GAP);

    return {
      width: `${COLUMN_WIDTH}px`,
      gap: `${Math.max(gap, 16)}px`,
      paddingTop: `${offset}px`,
    };
  };

  if (!size) {
    return (
      <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 text-center text-white/70">
        Unable to load enough backup quarterbacks for a bracket.
      </div>
    );
  }

  return (
    <section className="bg-neutral-900/60 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Backup QB Bracket</h2>
          <p className="text-white/60 text-sm">
            {size}-quarterback single-elimination showdown. Click a QB to advance them and build your champion.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="px-3 py-2 text-xs font-semibold rounded-md bg-white/10 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
            onClick={handleZoomOut}
          >
            Zoom Out
          </button>
          <button
            type="button"
            className="px-3 py-2 text-xs font-semibold rounded-md bg-white/10 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
            onClick={handleZoomIn}
          >
            Zoom In
          </button>
          <button
            type="button"
            className="px-3 py-2 text-xs font-semibold rounded-md bg-white/10 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
            onClick={handleFit}
          >
            Fit to Screen
          </button>
          <button
            type="button"
            className="px-3 py-2 text-xs font-semibold rounded-md bg-white/10 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
            onClick={handleResetZoom}
          >
            Reset Zoom
          </button>
          <button
            type="button"
            className="px-3 py-2 text-xs font-semibold rounded-md bg-orange-500/20 text-orange-200 hover:bg-orange-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
            onClick={handleResetBracket}
          >
            Reset Bracket
          </button>
        </div>
      </div>

      {champion && (
        <div className="px-6 pt-4">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="Champion">
              🏆
            </span>
            <div>
              <p className="text-sm text-emerald-200/80 uppercase tracking-wide">Champion</p>
              <p className="text-lg font-semibold text-emerald-100">{champion.display_name}</p>
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} className="relative overflow-hidden">
        <div className="overflow-auto">
          <div
            ref={contentRef}
            className={clsx('transition-transform duration-300 ease-out px-6 py-10')}
            style={{
              transform: `scale(${displayScale})`,
              transformOrigin: 'left top',
              minWidth: `${rounds.length * (COLUMN_WIDTH + COLUMN_GAP) + COLUMN_GAP}px`,
            }}
          >
            <div className="flex" style={{ gap: `${COLUMN_GAP}px` }}>
              {rounds.map((round, roundIndex) => {
                const label = labels[roundIndex] || `Round ${roundIndex + 1}`;
                const centerSpacing = Math.pow(2, roundIndex) * (MATCH_HEIGHT + BASE_GAP);

                return (
                  <div key={round.roundIndex} className="flex flex-col" style={columnStyle(roundIndex)}>
                    <h3 className="text-center text-sm font-semibold uppercase tracking-widest text-white/60 mb-4">
                      {label}
                    </h3>
                    {round.matches.map((match) => {
                      const participants = getMatchParticipants({
                        rounds,
                        seededBySeed: seeded.bySeed,
                        winners,
                        roundIndex,
                        matchIndex: match.matchIndex,
                        entrantsById: seeded.byId,
                      });
                      const placeholderLabels =
                        roundIndex === 0
                          ? []
                          : match.sources.map((source) => {
                              const sourceLabel = labels[source.roundIndex] || `Round ${source.roundIndex + 1}`;
                              return `Winner of ${sourceLabel} • Match ${source.matchIndex + 1}`;
                            });

                      return (
                        <MatchupCard
                          key={match.id}
                          roundIndex={roundIndex}
                          matchIndex={match.matchIndex}
                          participants={participants}
                          winnerId={winners[roundIndex][match.matchIndex]}
                          placeholderLabels={placeholderLabels}
                          onSelect={(playerId) => handleSelectWinner(roundIndex, match.matchIndex, playerId)}
                          onHover={() => setHoveredMatch(`${roundIndex}-${match.matchIndex}`)}
                          onHoverEnd={() => setHoveredMatch(null)}
                          isLastRound={roundIndex === rounds.length - 1}
                          centerSpacing={centerSpacing}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BackupQBBracket;
