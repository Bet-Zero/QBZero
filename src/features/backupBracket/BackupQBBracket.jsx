import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  buildBracketBlueprint,
  getChampion,
  getMatchParticipants,
  pickWinner,
  sanitizeWinners,
} from './bracketMath';
import MatchupCard, { MATCH_HEIGHT, COLUMN_GAP } from './MatchupCard';
import { useConfirm } from '@/components/shared/ui/ConfirmModal';
import {
  fetchBracketPicks,
  saveBracketPicks,
} from '@/firebase/backupBracketHelpers';

const BASE_GAP = 28;
const COLUMN_WIDTH = 228;
const MIN_SCALE = 0.6;
const MAX_SCALE = 1.6;
// Fit to Screen stops here on a phone and lets the bracket scroll sideways;
// fitting all five rounds into 390px would make the names unreadable.
const MIN_FIT_SCALE = 0.75;

export const BRACKET_STORAGE_KEY = 'qbzero:backup-bracket';
// Picks reach Firestore this long after the last click, not on every click.
const ACCOUNT_SAVE_DELAY_MS = 800;

const readSavedWinners = () => {
  try {
    const raw = window.localStorage.getItem(BRACKET_STORAGE_KEY);
    return raw ? JSON.parse(raw).winners : null;
  } catch {
    return null;
  }
};

const saveWinners = (winners) => {
  try {
    window.localStorage.setItem(
      BRACKET_STORAGE_KEY,
      JSON.stringify({ winners })
    );
  } catch {
    // Storage blocked (private window): picks just last for this visit.
  }
};

// The bracket is drawn at full size and scaled down. A CSS transform does not
// change layout size, so the scaled copy sits in a box sized to match;
// otherwise the page keeps the full-size height as empty space below it.
const useAutoFit = () => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [fitScale, setFitScale] = useState(1);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const calculateFit = () => {
      const containerWidth = container.clientWidth;
      const width = content.offsetWidth;
      const height = content.offsetHeight;
      if (!width) return;
      setContentSize({ width, height });
      setFitScale(Math.min(1, Math.max(MIN_FIT_SCALE, containerWidth / width)));
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

  return { containerRef, contentRef, fitScale, contentSize };
};

const BackupQBBracket = ({ entrants = [], preferredSize = 32 }) => {
  const blueprint = useMemo(
    () => buildBracketBlueprint(entrants, preferredSize),
    [entrants, preferredSize]
  );
  const { size, seeded, rounds, labels } = blueprint;
  // Picks are kept in this browser, which shows them instantly, and in the
  // owner's Firestore document, which carries them between devices. The
  // player list arrives twice (bundled list, then Firestore), so each new
  // blueprint re-reads the browser copy and keeps the picks that still fit.
  const [winners, setWinners] = useState(() =>
    sanitizeWinners(blueprint, readSavedWinners())
  );
  const [savedToAccount, setSavedToAccount] = useState(false);
  // Set by the first pick or reset; after that, the account copy arriving
  // late must not overwrite what was just clicked.
  const changedHere = useRef(false);
  const blueprintRef = useRef(blueprint);
  blueprintRef.current = blueprint;
  const [isManualZoom, setIsManualZoom] = useState(false);
  const { confirm, confirmDialog } = useConfirm();

  const { containerRef, contentRef, fitScale, contentSize } = useAutoFit();
  const [baseScale, setBaseScale] = useState(1);

  useEffect(() => {
    setWinners(sanitizeWinners(blueprint, readSavedWinners()));
  }, [blueprint]);

  useEffect(() => {
    // An empty bracket (players still loading) must not overwrite saved picks.
    if (size) saveWinners(winners);
  }, [winners, size]);

  useEffect(() => {
    let cancelled = false;
    fetchBracketPicks()
      .then(async (remote) => {
        if (cancelled || changedHere.current) return;
        if (remote) {
          saveWinners(remote);
          setWinners(sanitizeWinners(blueprintRef.current, remote));
          setSavedToAccount(true);
          return;
        }
        // Nothing in the account yet: upload what this browser has.
        const local = readSavedWinners();
        if (local) {
          await saveBracketPicks(local);
          if (!cancelled) setSavedToAccount(true);
        }
      })
      .catch(() => {
        // Not readable (rules not published yet, or offline): the browser
        // copy still works, and the label says picks are on this device.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!size || !changedHere.current) return undefined;
    const timer = setTimeout(() => {
      saveBracketPicks(winners)
        .then(() => setSavedToAccount(true))
        .catch(() => setSavedToAccount(false));
    }, ACCOUNT_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [winners, size]);

  useEffect(() => {
    if (!isManualZoom) {
      setBaseScale(fitScale);
    }
  }, [fitScale, isManualZoom]);

  const handleSelectWinner = (roundIndex, matchIndex, playerId) => {
    changedHere.current = true;
    setWinners((current) =>
      pickWinner(
        current,
        roundIndex,
        matchIndex,
        current[roundIndex]?.[matchIndex] === playerId ? null : playerId
      )
    );
  };

  const champion = useMemo(
    () => getChampion(winners, seeded.byId),
    [winners, seeded.byId]
  );

  const pickCount = winners.reduce(
    (total, round) => total + round.filter(Boolean).length,
    0
  );

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

  const handleResetBracket = async () => {
    if (pickCount) {
      const ok = await confirm({
        title: 'Reset the bracket?',
        message: `This clears all ${pickCount} pick${pickCount === 1 ? '' : 's'}, including the saved ones.`,
        confirmLabel: 'Reset',
        danger: true,
      });
      if (!ok) return;
    }
    changedHere.current = true;
    setWinners(blueprint.winners);
    setIsManualZoom(false);
    setBaseScale(fitScale);
  };

  const columnStyle = (roundIndex) => {
    const offset =
      roundIndex === 0
        ? 0
        : ((Math.pow(2, roundIndex) - 1) / 2) * (MATCH_HEIGHT + BASE_GAP);

    return {
      width: `${COLUMN_WIDTH}px`,
      paddingTop: `${offset}px`,
    };
  };

  const getRoundMeasurements = (roundIndex) => {
    const centerSpacing = Math.pow(2, roundIndex) * (MATCH_HEIGHT + BASE_GAP);
    const gap = centerSpacing - MATCH_HEIGHT;

    return {
      centerSpacing,
      gap: Math.max(gap, 16),
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
            {size}-quarterback single-elimination showdown. Click a QB to
            advance them and build your champion.
          </p>
          <p className="mt-1 text-xs text-white/40">
            {savedToAccount
              ? 'Picks saved to your account'
              : 'Picks saved on this device'}
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
              <p className="text-sm text-emerald-200/80 uppercase tracking-wide">
                Champion
              </p>
              <p className="text-lg font-semibold text-emerald-100">
                {champion.display_name}
              </p>
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} className="overflow-x-auto">
        <div
          style={{
            width: contentSize.width
              ? `${contentSize.width * baseScale}px`
              : undefined,
            height: contentSize.height
              ? `${contentSize.height * baseScale}px`
              : undefined,
          }}
        >
          <div
            ref={contentRef}
            className="w-max px-6 py-10"
            style={{
              transform: `scale(${baseScale})`,
              transformOrigin: 'left top',
            }}
          >
            <div className="flex" style={{ gap: `${COLUMN_GAP}px` }}>
              {rounds.map((round, roundIndex) => {
                const label = labels[roundIndex] || `Round ${roundIndex + 1}`;
                const { centerSpacing, gap } = getRoundMeasurements(roundIndex);

                return (
                  <div
                    key={round.roundIndex}
                    className="flex flex-col"
                    style={columnStyle(roundIndex)}
                  >
                    <h3 className="text-center text-sm font-semibold uppercase tracking-widest text-white/60 mb-4">
                      {label}
                    </h3>
                    <div className="flex flex-col" style={{ gap: `${gap}px` }}>
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
                            : match.sources.map(
                                // Always the column to the left, so the
                                // round name would only crowd the card.
                                (source) =>
                                  `Winner of Match ${source.matchIndex + 1}`
                              );

                        return (
                          <MatchupCard
                            key={match.id}
                            roundIndex={roundIndex}
                            matchIndex={match.matchIndex}
                            participants={participants}
                            winnerId={
                              winners[roundIndex]?.[match.matchIndex] ?? null
                            }
                            placeholderLabels={placeholderLabels}
                            onSelect={(playerId) =>
                              handleSelectWinner(
                                roundIndex,
                                match.matchIndex,
                                playerId
                              )
                            }
                            isFirstRound={roundIndex === 0}
                            isLastRound={roundIndex === rounds.length - 1}
                            centerSpacing={centerSpacing}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {confirmDialog}
    </section>
  );
};

export default BackupQBBracket;
