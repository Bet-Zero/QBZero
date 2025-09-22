import React, { useState, useRef } from 'react';
import { LayoutGrid, ListOrdered, Download, X, TrendingUp } from 'lucide-react';
import useImageDownload from '@/hooks/useImageDownload';
import RankingsPoster from '@/features/rankings/components/RankingsPoster';
import RankingsListView from '@/features/rankings/components/RankingsListView';
import { getDisplayName } from '@/features/rankings/utils/rankingTemplateUtils';

const QBRankingsExport = ({
  rankings,
  rankingName,
  onClose,
  movementData = {},
}) => {
  const [viewType, setViewType] = useState('grid');
  const [showLogoBg, setShowLogoBg] = useState(true);
  const [showMovement, setShowMovement] = useState(
    Object.keys(movementData).length > 0
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const gridViewRef = useRef(null);
  const listViewRef = useRef(null);

  const downloadGridImage = useImageDownload(gridViewRef);
  const downloadListImage = useImageDownload(listViewRef);

  const handleCopy = () => {
    const text = rankings
      .map((qb, index) => `#${index + 1} ${getDisplayName(qb)}`)
      .join('\n');
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

    const safeName = (rankingName || 'qb-rankings')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');

    try {
      const filename = `${safeName || 'qb-rankings'}-${date}.png`;
      if (viewType === 'grid') {
        await downloadGridImage(filename);
      } else {
        await downloadListImage(filename);
      }
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
          players={rankings}
          showLogoBg={showLogoBg}
          showMovement={showMovement}
          movementData={movementData}
          containerRef={gridViewRef}
          title={(rankingName || 'NFL QB RANKINGS').toUpperCase()}
        />
      );
    }

    return (
      <RankingsListView
        ref={listViewRef}
        players={rankings}
        title={rankingName || 'NFL QB Rankings'}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-xl border border-white/20 w-full max-w-7xl max-h-[90vh] overflow-hidden">
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

        <div className="p-6 border-b border-white/10">
          <ActionButtons />
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default QBRankingsExport;
