import React, { useState, useRef } from 'react';
import { LayoutGrid, ListOrdered, Download, X, TrendingUp } from 'lucide-react';
import useImageDownload from '@/hooks/useImageDownload';
import RankingMovementIndicator from '@/components/shared/RankingMovementIndicator';

// Mapping team abbreviations to logo file names (copied from RankingResults)
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
  LAV: 'raiders',
  LV: 'raiders',
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

// Custom positioning for specific team logos in grid view background (copied from RankingResults)
const teamLogoPositioning = {
  DAL: { x: 55, y: 0 },
  NO: { x: 125, y: 0 },
  DET: { x: 0, y: 75 },
  PHI: { x: 120, y: 0 },
  MIN: { x: 80, y: 140 },
  MIA: { x: 60, y: 60 },
  NE: { x: 0, y: 20 },
  BUF: { x: 80, y: 30 },
  CAR: { x: 20, y: 50 },
  TB: { x: 110, y: 60 },
};

// Helper function to get logo path safely
const getLogoPath = (team) => {
  if (!team) return null;
  const logoId = teamLogoMap[team] || team.toLowerCase();
  return `/assets/logos/${logoId}.svg`;
};

// Helper function to get background positioning for team logos - CENTERED VERSION for personal rankings
const getLogoBackgroundStyle = (team, showLogoBg) => {
  if (!showLogoBg) {
    return { backgroundImage: 'none' };
  }

  const logoPath = getLogoPath(team);
  if (!logoPath) {
    return { backgroundImage: 'none' };
  }

  // Always center logos for personal rankings export (ignore custom positioning)
  // Use a linear gradient with the logo to apply opacity only to the background
  return {
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.25)), url(${logoPath})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  };
};

const QBRankingsExport = ({
  rankings,
  rankingName,
  onClose,
  movementData = {},
}) => {
  const [viewType, setViewType] = useState('grid'); // 'list' or 'grid'
  const [showLogoBg, setShowLogoBg] = useState(true);
  const [showMovement, setShowMovement] = useState(
    Object.keys(movementData).length > 0
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const shareViewRef = useRef(null);
  const downloadImage = useImageDownload(shareViewRef);

  const handleCopy = () => {
    const text = rankings.map((qb, idx) => `#${idx + 1} ${qb.name}`).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
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
      await downloadImage(`${rankingName || 'qb-rankings'}-${date}.png`);
    } finally {
      setIsDownloading(false);
    }
  };

  const ActionButtons = () => (
    <div className="flex gap-2 justify-center sm:justify-start">
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
      {Object.keys(movementData).length > 0 && (
        <button
          onClick={() => setShowMovement(!showMovement)}
          className={`px-3 py-2 text-sm text-white rounded hover:bg-white/20 flex items-center transition-colors ${
            showMovement ? 'bg-green-600/80 hover:bg-green-700' : 'bg-white/10'
          }`}
          title={showMovement ? 'Hide Movement' : 'Show Movement'}
        >
          <TrendingUp size={16} className="mr-1" />
          <span className="hidden sm:inline">
            {showMovement ? 'Hide Movement' : 'Show Movement'}
          </span>
          <span className="sm:hidden">Movement</span>
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
        disabled={isDownloading}
        className="px-3 py-2 text-sm text-white bg-white/10 rounded hover:bg-white/20 flex items-center transition-colors disabled:opacity-50"
        title="Download Image"
      >
        <Download size={16} className="mr-1" />
        <span className="hidden sm:inline">
          {isDownloading ? 'Downloading...' : 'Download'}
        </span>
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
    const itemsPerCol = Math.ceil(rankings.length / cols);
    const columns = Array(cols)
      .fill()
      .map(() => []);

    rankings.forEach((qb, idx) => {
      const colIndex = Math.floor(idx / itemsPerCol);
      if (colIndex < cols) {
        columns[colIndex].push({ qb, rank: idx + 1 });
      }
    });

    return columns;
  };

  const renderContent = () => {
    const sharedHeader = (
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-2">
          NFL QB Rankings
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

          {/* Use the same desktop-style grid that works well on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-[1400px] mx-auto">
            {rankings.map((qb, idx) => {
              const logoPath = getLogoPath(qb.team);
              const headshot = qb.headshotUrl || qb.imageUrl || `/assets/headshots/${qb.player_id || qb.id}.png`;
              const logoBackgroundStyle = getLogoBackgroundStyle(
                qb.team,
                showLogoBg
              );

              return (
                <div key={qb.id} className="relative group">
                  {/* Card */}
                  <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-white/10 transition-all hover:border-white/20">
                    {/* Headshot Container with overlaid rank */}
                    <div
                      className="aspect-square w-full overflow-hidden bg-[#111] relative"
                      style={logoBackgroundStyle}
                    >
                      <img
                        src={headshot}
                        alt={qb.name}
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
                    <div className="p-3 relative">
                      <div className="text-white font-medium truncate mb-1">
                        {qb.name}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {logoPath && (
                          <div className="w-4 h-4">
                            <img
                              src={logoPath}
                              alt={qb.team}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <span className="text-white/60 text-sm">
                          {qb.team?.toUpperCase() || '—'}
                        </span>
                      </div>

                      {/* Movement indicator positioned absolutely in bottom-right */}
                      {showMovement &&
                        movementData[qb.id] &&
                        movementData[qb.id].moved && (
                          <div className="absolute bottom-3 right-3">
                            <RankingMovementIndicator
                              movement={movementData[qb.id]}
                              showMovement={true}
                            />
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

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
              {column.map(({ qb, rank }) => {
                const headshot =
                  qb.headshotUrl || qb.imageUrl || `/assets/headshots/${qb.player_id || qb.id}.png`;
                const logoPath = getLogoPath(qb.team);

                return (
                  <div
                    key={qb.id}
                    className="bg-white/5 rounded p-2 flex items-center gap-2"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full font-bold text-white/80">
                      {rank}
                    </div>
                    <img
                      src={headshot}
                      alt={qb.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = '/assets/headshots/default.png';
                      }}
                    />
                    <div className="flex-1 truncate text-sm">
                      <div className="font-medium text-white truncate">
                        {qb.name}
                      </div>
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        {logoPath && (
                          <div className="w-4 h-4">
                            <img
                              src={logoPath}
                              alt={qb.team}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <span>{qb.team?.toUpperCase() || '—'}</span>
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
              {column.map(({ qb, rank }) => {
                const headshot =
                  qb.headshotUrl || qb.imageUrl || `/assets/headshots/${qb.player_id || qb.id}.png`;
                const logoPath = getLogoPath(qb.team);

                return (
                  <div
                    key={qb.id}
                    className="bg-white/5 rounded p-2 flex items-center gap-2"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full font-bold text-white/80">
                      {rank}
                    </div>
                    <img
                      src={headshot}
                      alt={qb.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = '/assets/headshots/default.png';
                      }}
                    />
                    <div className="flex-1 truncate text-sm">
                      <div className="font-medium text-white truncate">
                        {qb.name}
                      </div>
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        {logoPath && (
                          <div className="w-4 h-4">
                            <img
                              src={logoPath}
                              alt={qb.team}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <span>{qb.team?.toUpperCase() || '—'}</span>
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
              {column.map(({ qb, rank }) => {
                const headshot =
                  qb.headshotUrl || qb.imageUrl || `/assets/headshots/${qb.player_id || qb.id}.png`;
                const logoPath = getLogoPath(qb.team);

                return (
                  <div
                    key={qb.id}
                    className="bg-white/5 rounded p-2 flex items-center gap-2"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full font-bold text-white/80">
                      {rank}
                    </div>
                    <img
                      src={headshot}
                      alt={qb.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = '/assets/headshots/default.png';
                      }}
                    />
                    <div className="flex-1 truncate text-sm">
                      <div className="font-medium text-white truncate">
                        {qb.name}
                      </div>
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        {logoPath && (
                          <div className="w-4 h-4">
                            <img
                              src={logoPath}
                              alt={qb.team}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <span>{qb.team?.toUpperCase() || '—'}</span>
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-xl border border-white/20 w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Download className="text-blue-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">Export Rankings</h2>
              <p className="text-white/60 text-sm">
                Choose your export format and download your rankings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="text-white/60" size={20} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-b border-white/10">
          <ActionButtons />
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default QBRankingsExport;
