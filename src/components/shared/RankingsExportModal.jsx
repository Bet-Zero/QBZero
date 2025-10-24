import React, { useState, useRef } from 'react';
import { LayoutGrid, ListOrdered, Download, X, TrendingUp, Edit3 } from 'lucide-react';
import useImageDownload from '@/hooks/useImageDownload';
import RankingMovementIndicator from '@/components/shared/RankingMovementIndicator';
import AdjustableRankings from '@/features/ranker/AdjustableRankings';
import PropTypes from 'prop-types';
import {
  getLogoPath,
  getLogoBackgroundStyle,
  getRankBackgroundStyle,
  getHeadshotSrc,
  createColumns,
} from '@/utils/rankingExportHelpers';

const GridCard = ({
  player,
  rank,
  showLogoBg,
  showMovement,
  movementData = {},
}) => {
  const logoPath = getLogoPath(player.team);
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
          <div className="flex items-center gap-1.5">
            {logoPath && (
              <div className="w-4 h-4">
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
            <span className="text-white/60 text-sm">
              {player.team?.toUpperCase() || '—'}
            </span>
          </div>

          {/* Movement indicator positioned absolutely in bottom-right */}
          {showMovement && movement?.moved && (
            <div className="absolute bottom-3 right-3">
              <RankingMovementIndicator
                movement={movement}
                showMovement={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

GridCard.propTypes = {
  player: PropTypes.object.isRequired,
  rank: PropTypes.number.isRequired,
  showLogoBg: PropTypes.bool.isRequired,
  showMovement: PropTypes.bool.isRequired,
  movementData: PropTypes.object,
};

const RankingsExportModal = ({
  rankings = [],
  rankingName = 'QB Rankings',
  onClose,
  movementData = {},
  title = 'Export Rankings',
  subtitle = 'Choose your export format and download your rankings',
  onRankingAdjusted,
}) => {
  const [viewType, setViewType] = useState('grid'); // 'list' or 'grid'
  const [showLogoBg, setShowLogoBg] = useState(true);
  const [showMovement, setShowMovement] = useState(
    Object.keys(movementData).length > 0
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAdjustMode, setIsAdjustMode] = useState(false);
  const [currentRanking, setCurrentRanking] = useState(rankings);
  const [isExportReady, setIsExportReady] = useState(false);
  const shareViewRef = useRef(null);
  const exportViewRef = useRef(null);
  const downloadImageHook = useImageDownload(exportViewRef);
  
  // Update current ranking when prop changes
  React.useEffect(() => {
    setCurrentRanking(rankings);
  }, [rankings]);

  // Ensure export container is ready before allowing download
  React.useEffect(() => {
    // Small delay to ensure the hidden container has rendered
    const timer = setTimeout(() => {
      if (exportViewRef.current) {
        setIsExportReady(true);
      } else {
        console.warn('Export container not ready after timeout');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [viewType]);

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

  const handleCopy = () => {
    const text = currentRanking
      .map((item, idx) => {
        const player = item.qb || item.player || item;
        return `#${idx + 1} ${player.name || player.display_name}`;
      })
      .join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleDownloadImage = async () => {
    if (!exportViewRef.current) {
      console.error('Export container ref is not attached');
      alert('Failed to download: Export container not ready. Please try again.');
      return;
    }

    // Extra validation for mobile devices
    const rect = exportViewRef.current.getBoundingClientRect();
    console.log('Export container dimensions:', {
      width: exportViewRef.current.offsetWidth,
      height: exportViewRef.current.offsetHeight,
      scrollWidth: exportViewRef.current.scrollWidth,
      scrollHeight: exportViewRef.current.scrollHeight,
      boundingRect: rect
    });

    setIsDownloading(true);
    const date = new Date()
      .toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      .replace(/,/g, '');

    try {
      // Use the hook-based download function
      await downloadImageHook(`${rankingName || 'qb-rankings'}-${date}.png`);
      console.log('Download completed successfully');
    } catch (error) {
      console.error('Download failed with error:', error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.includes('toBlob')) {
        errorMessage = 'Failed to generate image. Please try again or use a different browser.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Download timed out. Please try again with a stable connection.';
      } else if (errorMessage.includes('dimensions')) {
        errorMessage = 'Invalid image dimensions. Please refresh the page and try again.';
      }
      
      alert(`Failed to download image: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
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
        disabled={isDownloading || !isExportReady}
        className="px-3 py-2 text-sm text-white bg-white/10 rounded hover:bg-white/20 flex items-center transition-colors disabled:opacity-50"
        title={!isExportReady ? 'Export container loading...' : 'Download Image'}
      >
        <Download size={16} className="mr-1" />
        <span className="hidden sm:inline">
          {isDownloading ? 'Downloading...' : !isExportReady ? 'Loading...' : 'Download'}
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
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2z"
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

  const renderPosterHeader = () => {
    const updatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <div className="mb-6">
        {/* Title line */}
        <h1 className="text-3xl sm:text-4xl md:text-[56px] lg:text-[64px] font-black uppercase tracking-[0.04em] leading-none text-white">
          NFL QB RANKINGS
        </h1>
        {/* Thin underline under title - shortened and aligned with column 1 */}
        <div className="mt-3 h-[2px] w-[28%] bg-white/20"></div>
        {/* Subline */}
        <div className="mt-4 text-sm sm:text-base md:text-[16px] lg:text-[18px] text-white/70">
          Updated {updatedDate}
        </div>
      </div>
    );
  };

  const renderPosterFooter = () => {
    return (
      <div className="pt-8 border-t border-white/25">
        <div className="flex items-center justify-between text-[12px] text-white/55">
          <span>QBZero</span>
          <span></span>
        </div>
      </div>
    );
  };

  const renderGridLayout = (isExport = false) => {
    const containerRef = isExport ? exportViewRef : shareViewRef;

    return (
      <div className="min-h-screen w-full bg-neutral-950 text-white flex items-center justify-center">
        <div
          ref={containerRef}
          className={isExport ? "w-[1400px] px-16 pt-20 pb-12 flex flex-col" : "w-full max-w-[1400px] px-4 sm:px-8 md:px-16 pt-8 sm:pt-12 md:pt-20 pb-8 md:pb-12 flex flex-col"}
        >
          {/* Header (top-left) */}
          {renderPosterHeader()}

          {/* Grid with 6 columns x 7 rows on desktop, responsive on mobile */}
          <div className={isExport ? "mt-6 mb-12 grid grid-cols-6 gap-x-4 gap-y-6 justify-items-center" : "mt-6 mb-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-4 sm:gap-y-5 md:gap-y-6 justify-items-center"}>
            {currentRanking.slice(0, 42).map((item, idx) => {
              const player = item.qb || item.player || item;
              return (
                <GridCard
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

          {/* Footer */}
          {renderPosterFooter()}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (viewType === 'grid') {
      return renderGridLayout(false);
    }

    // List view
    return (
      <div
        ref={shareViewRef}
        className="bg-neutral-900 p-6 rounded-lg border border-white/10"
      >
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-2 gap-y-1">
          {/* Mobile columns (2) */}
          {createColumns(currentRanking, numCols.base).map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-1 sm:hidden">
              {column.map(({ player: columnPlayer, rank }) => {
                const headshot = getHeadshotSrc(columnPlayer);
                const logoPath = getLogoPath(columnPlayer.team);

                return (
                  <div
                    key={columnPlayer.id || columnPlayer.player_id || columnPlayer.name}
                    className="bg-white/5 rounded p-2 flex items-center gap-2"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full font-bold text-white/80">
                      {rank}
                    </div>
                    <img
                      src={headshot}
                      alt={columnPlayer.name || columnPlayer.display_name}
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
                        {columnPlayer.name || columnPlayer.display_name}
                      </div>
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        {logoPath && (
                          <div className="w-4 h-4">
                            <img
                              src={logoPath}
                              alt={columnPlayer.team}
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
                        <span>{columnPlayer.team?.toUpperCase() || '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Tablet columns (3) */}
          {createColumns(currentRanking, numCols.sm).map((column, colIndex) => (
            <div
              key={colIndex}
              className="hidden sm:flex md:hidden flex-col gap-1"
            >
              {column.map(({ player: columnPlayer, rank }) => {
                const headshot = getHeadshotSrc(columnPlayer);
                const logoPath = getLogoPath(columnPlayer.team);

                return (
                  <div
                    key={columnPlayer.id || columnPlayer.player_id || columnPlayer.name}
                    className="bg-white/5 rounded p-2 flex items-center gap-2"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full font-bold text-white/80">
                      {rank}
                    </div>
                    <img
                      src={headshot}
                      alt={columnPlayer.name || columnPlayer.display_name}
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
                        {columnPlayer.name || columnPlayer.display_name}
                      </div>
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        {logoPath && (
                          <div className="w-4 h-4">
                            <img
                              src={logoPath}
                              alt={columnPlayer.team}
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
                        <span>{columnPlayer.team?.toUpperCase() || '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Desktop columns (4) */}
          {createColumns(currentRanking, numCols.md).map((column, colIndex) => (
            <div key={colIndex} className="hidden md:flex flex-col gap-1">
              {column.map(({ player: columnPlayer, rank }) => {
                const headshot = getHeadshotSrc(columnPlayer);
                const logoPath = getLogoPath(columnPlayer.team);

                return (
                  <div
                    key={columnPlayer.id || columnPlayer.player_id || columnPlayer.name}
                    className="bg-white/5 rounded p-2 flex items-center gap-2"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full font-bold text-white/80">
                      {rank}
                    </div>
                    <img
                      src={headshot}
                      alt={columnPlayer.name || columnPlayer.display_name}
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
                        {columnPlayer.name || columnPlayer.display_name}
                      </div>
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        {logoPath && (
                          <div className="w-4 h-4">
                            <img
                              src={logoPath}
                              alt={columnPlayer.team}
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
                        <span>{columnPlayer.team?.toUpperCase() || '—'}</span>
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
    <>
      {/* Hidden export container - always renders desktop layout for consistent screenshots */}
      {/* Positioned fixed off-screen left but with proper dimensions to ensure rendering */}
      <div 
        className="fixed pointer-events-none"
        style={{ 
          left: '-10000px',
          top: '0',
          width: 'auto',
          height: 'auto',
          overflow: 'visible',
          zIndex: -9999
        }}
      >
        {viewType === 'grid' ? (
          renderGridLayout(true)
        ) : (
          <div
            ref={exportViewRef}
            className="bg-neutral-900 p-6 rounded-lg border border-white/10"
          >
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

            <div className="grid grid-cols-4 gap-x-2 gap-y-1">
              {/* Always render desktop 4-column layout for export */}
              {createColumns(currentRanking, numCols.md).map((column, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-1">
                  {column.map(({ player: columnPlayer, rank }) => {
                    const headshot = getHeadshotSrc(columnPlayer);
                    const logoPath = getLogoPath(columnPlayer.team);

                    return (
                      <div
                        key={columnPlayer.id || columnPlayer.player_id || columnPlayer.name}
                        className="bg-white/5 rounded p-2 flex items-center gap-2"
                      >
                        <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full font-bold text-white/80">
                          {rank}
                        </div>
                        <img
                          src={headshot}
                          alt={columnPlayer.name || columnPlayer.display_name}
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
                            {columnPlayer.name || columnPlayer.display_name}
                          </div>
                          <div className="flex items-center gap-1 text-white/60 text-xs">
                            {logoPath && (
                              <div className="w-4 h-4">
                                <img
                                  src={logoPath}
                                  alt={columnPlayer.team}
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
                            <span>{columnPlayer.team?.toUpperCase() || '—'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visible modal */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-neutral-900 rounded-xl border border-white/20 w-full max-w-7xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Download className="text-blue-500" size={24} />
              <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <p className="text-white/60 text-sm">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="text-white/60" size={20} />
            </button>
          </div>

          {/* Action Buttons - Only show if not in adjust mode */}
          {!isAdjustMode && (
            <div className="p-6 border-b border-white/10">
              <ActionButtons />
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            {isAdjustMode ? (
              <AdjustableRankings
                initialRanking={currentRanking}
                onSave={handleSaveAdjustments}
                onCancel={handleCancelAdjustments}
              />
            ) : (
              renderContent()
            )}
          </div>
        </div>
      </div>
    </>
  );
};

RankingsExportModal.propTypes = {
  rankings: PropTypes.array,
  rankingName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  movementData: PropTypes.object,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  onRankingAdjusted: PropTypes.func,
};

export default RankingsExportModal;