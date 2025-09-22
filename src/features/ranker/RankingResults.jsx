import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Edit3 } from 'lucide-react';
import useImageDownload from '@/hooks/useImageDownload';
import RankingsPoster from '@/features/rankings/components/RankingsPoster';
import RankingsListView from '@/features/rankings/components/RankingsListView';
import RankingsBoardView from '@/features/rankings/components/RankingsBoardView';
import { getDisplayName } from '@/features/rankings/utils/rankingTemplateUtils';
import AdjustableRankings from './AdjustableRankings';

const viewModes = [
  { id: 'board', label: 'Board View' },
  { id: 'poster', label: 'Poster View' },
  { id: 'list', label: 'List View' },
];

const RankingResults = ({ ranking = [], onRankingAdjusted }) => {
  const [viewType, setViewType] = useState('board');
  const [showLogoBg, setShowLogoBg] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAdjustMode, setIsAdjustMode] = useState(false);
  const [currentRanking, setCurrentRanking] = useState(ranking);
  const [generatedAt] = useState(() => new Date());

  const posterViewRef = useRef(null);
  const listViewRef = useRef(null);

  const downloadPosterImage = useImageDownload(posterViewRef);
  const downloadListImage = useImageDownload(listViewRef);

  useEffect(() => {
    setCurrentRanking(ranking);
  }, [ranking]);

  const formattedRanking = useMemo(
    () => currentRanking.map((player, index) => ({ ...player, rank: index + 1 })),
    [currentRanking]
  );

  const handleCopy = () => {
    const text = formattedRanking
      .map((player) => `#${player.rank} ${getDisplayName(player)}`)
      .join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleExportCSV = () => {
    const rows = formattedRanking
      .map((player) => `${player.rank},"${getDisplayName(player).replace(/"/g, '""')}"`)
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
    if (viewType === 'board') {
      return;
    }

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
      if (viewType === 'poster') {
        await downloadPosterImage(filename);
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
    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
      <button
        onClick={handleAdjustRankings}
        className="px-3 py-2 text-sm text-white bg-orange-600/80 hover:bg-orange-700 rounded flex items-center transition-colors"
        title="Adjust Rankings"
      >
        <Edit3 size={16} className="mr-1" />
        <span className="hidden sm:inline">Adjust Rankings</span>
        <span className="sm:hidden">Adjust</span>
      </button>

      {viewModes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => setViewType(mode.id)}
          className={`px-3 py-2 text-sm rounded flex items-center transition-colors border border-white/15 ${
            viewType === mode.id
              ? 'bg-white/20 text-white'
              : 'text-white bg-white/5 hover:bg-white/10'
          }`}
          title={mode.label}
        >
          {mode.label}
        </button>
      ))}

      {viewType === 'poster' && (
        <button
          onClick={() => setShowLogoBg(!showLogoBg)}
          className="px-3 py-2 text-sm text-white bg-white/10 rounded hover:bg-white/20 flex items-center transition-colors"
          title={showLogoBg ? 'Hide Logo Background' : 'Show Logo Background'}
        >
          <span className="hidden sm:inline">{showLogoBg ? 'Hide Logo BG' : 'Show Logo BG'}</span>
          <span className="sm:hidden">Logo BG</span>
        </button>
      )}

      <button
        onClick={handleDownloadImage}
        disabled={viewType === 'board' || isDownloading}
        className="px-3 py-2 text-sm text-white bg-white/10 rounded hover:bg-white/20 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          viewType === 'board'
            ? 'Switch to Poster or List to download an image'
            : 'Download Image'
        }
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
        <span className="hidden sm:inline">Copy</span>
        <span className="sm:hidden">Copy</span>
      </button>
    </div>
  );

  const renderContent = () => {
    if (viewType === 'poster') {
      return (
        <RankingsPoster
          players={formattedRanking}
          showLogoBg={showLogoBg}
          containerRef={posterViewRef}
          title="NFL QB RANKINGS"
        />
      );
    }

    if (viewType === 'list') {
      return (
        <RankingsListView
          ref={listViewRef}
          players={formattedRanking}
          title="NFL QB Rankings"
        />
      );
    }

    return (
        <RankingsBoardView
          players={formattedRanking}
          title="Ranker Results Board"
          subtitle="Your completed quarterback board using the official rankings template."
          updatedDate={generatedAt}
          emptyStateMessage="No results available."
          showUpdatedDate={true}
        />
    );
  };

  return (
    <div className="mt-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center mb-4 mt-8 sm:mt-12 gap-3 sm:flex-row sm:justify-between sm:gap-4">
          <div className="hidden sm:block">
            <ActionButtons />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center px-4">
        <div className="w-full">
          {renderContent()}
        </div>
      </div>

      <div className="mt-6 sm:hidden px-4">
        <ActionButtons />
      </div>

      <div className="flex justify-center mt-6 mb-6 px-4">
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
