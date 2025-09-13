import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, ListOrdered, Download, Edit3 } from 'lucide-react';
import useImageDownload from '@/hooks/useImageDownload';
import AdjustableRankings from './AdjustableRankings';

// Mapping team abbreviations to logo file names
const teamLogoMap = {
  ARI: 'cardinals',
  ATL: 'falcons',
  BAL: 'ravens',
  BUF: 'bills',
  CAR: 'panthers',
  CHI: 'bears',
  CIN: 'bengals',
  CLE: 'browns',
  DAL: 'cowboys',
  DEN: 'broncos',
  DET: 'lions',
  GB: 'packers',
  HOU: 'texans',
  IND: 'colts',
  JAX: 'jaguars',
  KC: 'chiefs',
  LAC: 'chargers',
  LAR: 'rams',
  LAV: 'raiders', // Fix Raiders abbreviation
  LV: 'raiders', // Support both LAV and LV
  MIA: 'dolphins',
  MIN: 'vikings',
  NE: 'patriots',
  NO: 'saints',
  NYG: 'giants',
  NYJ: 'jets',
  PHI: 'eagles',
  PIT: 'steelers',
  SF: '49ers',
  SEA: 'seahawks',
  TB: 'buccaneers',
  TEN: 'titans',
  WAS: 'commanders',
};

// Custom positioning for specific team logos in grid view background
// Values are in pixels - positive X moves right, positive Y moves down
// Only add teams here that need positioning adjustments - all others will stay centered
const teamLogoPositioning = {
  // Add only the specific teams that need positioning adjustments:
  DAL: { x: 55, y: 0 }, // Cowboys logo shifted left 15px
  NO: { x: 125, y: 0 },
  DET: { x: 0, y: 75 },
  PHI: { x: 120, y: 0 },
  MIN: { x: 80, y: 140 },
  MIA: { x: 60, y: 60 },
  NE: { x: 0, y: 20 },
  BUF: { x: 80, y: 30 },
  CAR: { x: 20, y: 50 },
  TB: { x: 110, y: 60 },
  // Add more teams here as needed
};

// Helper function to get logo path safely
const getLogoPath = (team) => {
  if (!team) return null;
  const logoId = teamLogoMap[team] || team.toLowerCase();
  return `/assets/logos/${logoId}.svg`;
};

// Helper function to get background positioning for team logos
const getLogoBackgroundStyle = (team, showLogoBg) => {
  if (!showLogoBg) {
    return { backgroundImage: 'none' };
  }

  const logoPath = getLogoPath(team);
  if (!logoPath) {
    return { backgroundImage: 'none' };
  }

  const positioning = teamLogoPositioning[team];

  if (positioning) {
    // Custom positioning for specific teams that need adjustment
    return {
      backgroundImage: `url(${logoPath})`,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: `calc(50% + ${positioning.x}px) calc(50% + ${positioning.y}px)`,
      opacity: 0.1,
    };
  }

  // Default center positioning for all other teams (exactly like before)
  return {
    backgroundImage: `url(${logoPath})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    opacity: 0.1,
  };
};

// Simple grid display for final rankings. Renders a responsive list of
// player names with their rank number. Designed to scale up to large player
// pools by using a multi-column layout.

const RankingResults = ({ ranking = [], onRankingAdjusted }) => {
  const [viewType, setViewType] = useState('list'); // 'list' or 'grid'
  const [showLogoBg, setShowLogoBg] = useState(true); // Add state for logo background toggle
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // Add state to manage lock status
  const [isAdjustMode, setIsAdjustMode] = useState(false);
  const [currentRanking, setCurrentRanking] = useState(ranking);
  const shareViewRef = useRef(null);
  const downloadImage = useImageDownload(shareViewRef);

  useEffect(() => {
    setIsLocked(false); // Unlock the page by default
  }, []);

  // Update current ranking when prop changes
  useEffect(() => {
    setCurrentRanking(ranking);
  }, [ranking]);

  const handleCopy = () => {
    const text = currentRanking
      .map((p, idx) => `#${idx + 1} ${p.display_name || p.name}`)
      .join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleExportCSV = () => {
    const rows = currentRanking
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

  const handleDownloadImage = async () => {
    setIsDownloading(true);
    const date = new Date()
      .toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      .replace(/,/g, '');
    try {
      await downloadImage(`qb-rankings-${date}.png`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAdjustRankings = () => {
    setIsAdjustMode(true);
  };

  const handleSaveAdjustments = (adjustedRanking) => {
    setCurrentRanking(adjustedRanking);
    setIsAdjustMode(false);
    if (onRankingAdjusted) {
      onRankingAdjusted(adjustedRanking);
    }
  };

  const handleCancelAdjustments = () => {
    setIsAdjustMode(false);
  };

  // Separate export-only content with fixed 5-column layout
  const renderExportContent = () => {
    const sharedHeader = (
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-2">
          QB Rankings 2025
        </h1>
        <div className="text-sm text-white/60 italic">
          {new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>
    );

    return (
      <div
        ref={shareViewRef}
        className="bg-neutral-900 p-6 rounded-lg border border-white/10"
        style={{ width: '1400px' }} // Force desktop width
      >
        {sharedHeader}

        {/* Force 5-column layout with inline styles - completely ignore device/screen size */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '16px', 
            maxWidth: '1400px', 
            margin: '0 auto' 
          }}
        >
          {currentRanking.map((p, idx) => {
            const logoPath = getLogoPath(p.team);
            const headshot =
              p.headshotUrl || `/assets/headshots/${p.player_id || p.id}.png`;
            const logoBackgroundStyle = getLogoBackgroundStyle(
              p.team,
              showLogoBg
            );

            return (
              <div key={p.id} className="relative group">
                {/* Card */}
                <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-white/10 transition-all hover:border-white/20">
                  {/* Headshot Container with overlaid rank */}
                  <div
                    className="aspect-square w-full overflow-hidden bg-[#111] relative"
                    style={
                      teamLogoPositioning[p.team]
                        ? {
                            backgroundImage: showLogoBg
                              ? `url(${logoPath})`
                              : 'none',
                            backgroundPosition: `calc(50% + ${teamLogoPositioning[p.team].x}px) calc(50% + ${teamLogoPositioning[p.team].y}px)`,
                          }
                        : {
                            backgroundImage: showLogoBg
                              ? `url(${logoPath})`
                              : 'none',
                          }
                    }
                  >
                    <img
                      src={headshot}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = '/assets/headshots/default.png';
                      }}
                    />
                    {/* Rank overlay in corner */}
                    <div className="absolute top-2 left-2 bg-neutral-600/50 backdrop-blur-sm text-white font-bold text-2xl px-1.5 py-1 rounded shadow-lg">
                      {idx + 1}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="p-3">
                    <div className="text-white font-medium truncate mb-1">
                      {p.display_name || p.name}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {logoPath && (
                        <div className="w-4 h-4">
                          <img
                            src={logoPath}
                            alt={p.team}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <span className="text-white/60 text-sm">
                        {p.team?.toUpperCase() || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // If in adjust mode, show the adjustable rankings component
  if (isAdjustMode) {
    return (
      <AdjustableRankings
        initialRanking={currentRanking}
        onSave={handleSaveAdjustments}
        onCancel={handleCancelAdjustments}
      />
    );
  }

  const ActionButtons = () => (
    <div className="flex gap-2 justify-center sm:justify-start">
      <button
        onClick={handleAdjustRankings}
        className="px-3 py-2 text-sm text-white bg-orange-600/80 hover:bg-orange-700 rounded flex items-center transition-colors"
        title="Adjust Rankings"
      >
        <Edit3 size={16} className="mr-1" />
        <span className="hidden sm:inline">Adjust Rankings</span>
        <span className="sm:hidden">Adjust</span>
      </button>
      {viewType === 'grid' && (
        <button
          onClick={() => setShowLogoBg(!showLogoBg)}
          className="px-3 py-2 text-sm text-white bg-white/10 rounded hover:bg-white/20 flex items-center transition-colors"
          title={showLogoBg ? 'Hide Logo Background' : 'Show Logo Background'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="mr-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="hidden sm:inline">
            {showLogoBg ? 'Hide Logo BG' : 'Show Logo BG'}
          </span>
        </button>
      )}
      <button
        onClick={() => setViewType(viewType === 'grid' ? 'list' : 'grid')}
        className="px-3 py-2 text-sm text-white bg-white/10 rounded hover:bg-white/20 flex items-center transition-colors"
        title={
          viewType === 'grid' ? 'Switch to List View' : 'Switch to Grid View'
        }
      >
        {viewType === 'grid' ? (
          <>
            <ListOrdered size={16} className="mr-1" />
            <span className="hidden sm:inline">List View</span>
          </>
        ) : (
          <>
            <LayoutGrid size={16} className="mr-1" />
            <span className="hidden sm:inline">Grid View</span>
          </>
        )}
      </button>
      <button
        onClick={handleDownloadImage}
        className="px-3 py-2 text-sm text-white bg-white/10 rounded hover:bg-white/20 flex items-center transition-colors"
        title="Download Image"
      >
        <Download size={16} className="mr-1" />
        <span className="hidden sm:inline">Download</span>
      </button>
      <button
        onClick={handleCopy}
        className="px-3 py-2 text-sm text-white bg-white/10 rounded hover:bg-white/20 flex items-center transition-colors"
        title="Copy List"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
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
        <span className="hidden sm:inline">Copy</span>
      </button>
    </div>
  );

  // Calculate number of columns and items per column for list view
  const numCols = {
    base: 2, // mobile
    sm: 3, // tablet
    md: 4, // desktop
  };

  // Create column arrays for list view
  const createColumns = (cols) => {
    const itemsPerCol = Math.ceil(currentRanking.length / cols);
    const columns = Array(cols)
      .fill()
      .map(() => []);

    currentRanking.forEach((player, idx) => {
      const colIndex = Math.floor(idx / itemsPerCol);
      if (colIndex < cols) {
        columns[colIndex].push({ player, rank: idx + 1 });
      }
    });

    return columns;
  };

  const renderContent = () => {
    const sharedHeader = (
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-2">
          QB Rankings 2025
        </h1>
        <div className="text-sm text-white/60 italic">
          {new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>
    );

    if (viewType === 'grid') {
      return (
        <div
          ref={shareViewRef}
          className="bg-neutral-900 p-6 rounded-lg border border-white/10"
        >
          {sharedHeader}

          {/* Desktop: 5 columns, Mobile: 2 columns for readability, Export: always 5 columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-[1400px] mx-auto">
            {currentRanking.map((p, idx) => {
              const logoPath = getLogoPath(p.team);
              const headshot =
                p.headshotUrl || `/assets/headshots/${p.player_id || p.id}.png`;
              const logoBackgroundStyle = getLogoBackgroundStyle(
                p.team,
                showLogoBg
              );

              return (
                <div key={p.id} className="relative group">
                  {/* Card */}
                  <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-white/10 transition-all hover:border-white/20">
                    {/* Headshot Container with overlaid rank */}
                    <div
                      className="aspect-square w-full overflow-hidden bg-[#111] relative"
                      style={
                        teamLogoPositioning[p.team]
                          ? {
                              backgroundImage: showLogoBg
                                ? `url(${logoPath})`
                                : 'none',
                              backgroundPosition: `calc(50% + ${teamLogoPositioning[p.team].x}px) calc(50% + ${teamLogoPositioning[p.team].y}px)`,
                            }
                          : {
                              backgroundImage: showLogoBg
                                ? `url(${logoPath})`
                                : 'none',
                            }
                      }
                    >
                      <img
                        src={headshot}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = '/assets/headshots/default.png';
                        }}
                      />
                      {/* Rank overlay in corner */}
                      <div className="absolute top-2 left-2 bg-neutral-600/50 backdrop-blur-sm text-white font-bold text-2xl px-1.5 py-1 rounded shadow-lg">
                        {idx + 1}
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="p-3">
                      <div className="text-white font-medium truncate mb-1">
                        {p.display_name || p.name}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {logoPath && (
                          <div className="w-4 h-4">
                            <img
                              src={logoPath}
                              alt={p.team}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <span className="text-white/60 text-sm">
                          {p.team?.toUpperCase() || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // List view
    return (
      <div
        ref={shareViewRef}
        className="bg-neutral-900 p-6 rounded-lg border border-white/10"
      >
        {sharedHeader}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-2 gap-y-1">
          {/* Mobile columns (2) */}
          {createColumns(numCols.base).map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-1 sm:hidden">
              {column.map(({ player: p, rank }) => {
                const headshot =
                  p.headshotUrl ||
                  `/assets/headshots/${p.player_id || p.id}.png`;
                const logoPath = getLogoPath(p.team);

                return (
                  <div
                    key={p.id}
                    className="bg-white/5 rounded p-2 flex items-center gap-2"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full font-bold text-white/80">
                      {rank}
                    </div>
                    <img
                      src={headshot}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = '/assets/headshots/default.png';
                      }}
                    />
                    <div className="flex-1 truncate text-sm">
                      <div className="font-medium text-white truncate">
                        {p.display_name || p.name}
                      </div>
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        {logoPath && (
                          <div className="w-4 h-4">
                            <img
                              src={logoPath}
                              alt={p.team}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <span>{p.team?.toUpperCase() || '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Tablet columns (3) */}
          {createColumns(numCols.sm).map((column, colIndex) => (
            <div
              key={colIndex}
              className="hidden sm:flex md:hidden flex-col gap-1"
            >
              {column.map(({ player: p, rank }) => {
                const headshot =
                  p.headshotUrl ||
                  `/assets/headshots/${p.player_id || p.id}.png`;
                const logoPath = getLogoPath(p.team);

                return (
                  <div
                    key={p.id}
                    className="bg-white/5 rounded p-2 flex items-center gap-2"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full font-bold text-white/80">
                      {rank}
                    </div>
                    <img
                      src={headshot}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = '/assets/headshots/default.png';
                      }}
                    />
                    <div className="flex-1 truncate text-sm">
                      <div className="font-medium text-white truncate">
                        {p.display_name || p.name}
                      </div>
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        {logoPath && (
                          <div className="w-4 h-4">
                            <img
                              src={logoPath}
                              alt={p.team}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <span>{p.team?.toUpperCase() || '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Desktop columns (4) */}
          {createColumns(numCols.md).map((column, colIndex) => (
            <div key={colIndex} className="hidden md:flex flex-col gap-1">
              {column.map(({ player: p, rank }) => {
                const headshot =
                  p.headshotUrl ||
                  `/assets/headshots/${p.player_id || p.id}.png`;
                const logoPath = getLogoPath(p.team);

                return (
                  <div
                    key={p.id}
                    className="bg-white/5 rounded p-2 flex items-center gap-2"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full font-bold text-white/80">
                      {rank}
                    </div>
                    <img
                      src={headshot}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = '/assets/headshots/default.png';
                      }}
                    />
                    <div className="flex-1 truncate text-sm">
                      <div className="font-medium text-white truncate">
                        {p.display_name || p.name}
                      </div>
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        {logoPath && (
                          <div className="w-4 h-4">
                            <img
                              src={logoPath}
                              alt={p.team}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <span>{p.team?.toUpperCase() || '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 mx-auto max-w-5xl px-4">
      {/* Header with title and desktop buttons */}
      <div className="flex flex-col items-center mb-4 mt-8 sm:mt-12 gap-3 sm:flex-row sm:justify-between sm:gap-4">
        {/* Desktop buttons - hidden on mobile */}
        <div className="hidden sm:block">
          <ActionButtons />
        </div>
      </div>

      {/* Hidden export content with fixed 5-column layout */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1400px' }}>
        {renderExportContent()}
      </div>

      {/* Visible display content with responsive layout */}
      {renderContent()}

      {/* Mobile buttons - shown only on mobile, positioned after rankings */}
      <div className="mt-6 sm:hidden">
        <ActionButtons />
      </div>

      {/* CSV Export button at bottom */}
      <div className="flex justify-center mt-6 mb-8">
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 text-sm text-white bg-white/10 rounded hover:bg-white/20 flex items-center transition-colors"
          title="Export as CSV"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="mr-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export to CSV
        </button>
      </div>
    </div>
  );
};

export default RankingResults;
