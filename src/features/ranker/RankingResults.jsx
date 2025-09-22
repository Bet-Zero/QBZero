import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, ListOrdered, Download, Edit3 } from 'lucide-react';
import useImageDownload from '@/hooks/useImageDownload';
import RankingsPoster from '@/features/rankings/components/RankingsPoster';
import RankingsListView from '@/features/rankings/components/RankingsListView';
import { getDisplayName } from '@/features/rankings/utils/rankingTemplateUtils';
import AdjustableRankings from './AdjustableRankings';

const RankingResults = ({ ranking = [], onRankingAdjusted }) => {
  const [viewType, setViewType] = useState('grid');
  const [showLogoBg, setShowLogoBg] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAdjustMode, setIsAdjustMode] = useState(false);
  const [currentRanking, setCurrentRanking] = useState(ranking);

  const gridViewRef = useRef(null);
  const listViewRef = useRef(null);

  const downloadGridImage = useImageDownload(gridViewRef);
  const downloadListImage = useImageDownload(listViewRef);

  useEffect(() => {
    setCurrentRanking(ranking);
  }, [ranking]);

  const handleCopy = () => {
    const text = currentRanking
      .map((player, index) => `#${index + 1} ${getDisplayName(player)}`)
      .join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleExportCSV = () => {
    const rows = currentRanking
      .map(
        (player, index) =>
          `${index + 1},"${getDisplayName(player).replace(/"/g, '""')}"`
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
      const filename = `qb-rankings-${date}.png`;
      if (viewType === 'grid') {
        await downloadGridImage(filename);
      } else {
        await downloadListImage(filename);
      }
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
        title={viewType === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
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
        className="px-3 py-2 text-sm text-white bg-white/10 rounded hover:bg-white/20 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Download Image"
      >
        <Download size={16} className="mr-1" />
        <span className="hidden sm:inline">
          {isDownloading ? 'Downloading…' : 'Download'}
        </span>
        <span className="sm:hidden">DL</span>
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

  const renderContent = () => {
    if (viewType === 'grid') {
      return (
        <RankingsPoster
          players={currentRanking}
          showLogoBg={showLogoBg}
          containerRef={gridViewRef}
          title="NFL QB RANKINGS"
        />
      );
    }

    return (
      <RankingsListView
        ref={listViewRef}
        players={currentRanking}
        title="NFL QB Rankings"
      />
    );
  };

  return (
    <div className="mt-6 mx-auto max-w-5xl px-4">
      <div className="flex flex-col items-center mb-4 mt-8 sm:mt-12 gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div className="hidden sm:block">
          <ActionButtons />
        </div>
      </div>

      {renderContent()}

      <div className="mt-6 sm:hidden">
        <ActionButtons />
      </div>

      <div className="flex justify-center mt-6 mb-6">
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2z"
            />
          </svg>
          Export to CSV
        </button>
      </div>
    </div>
  );
};

export default RankingResults;
