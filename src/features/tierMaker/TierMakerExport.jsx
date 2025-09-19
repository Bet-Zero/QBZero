// TierMakerExport.jsx
// Export modal for tier lists with download functionality
import React, { useState, useRef } from 'react';
import { Download, X } from 'lucide-react';
import useImageDownload from '@/hooks/useImageDownload';
import TierPlayerTile from '@/features/lists/TierPlayerTile';

const TierMakerExport = ({
  tiers,
  tierOrder,
  onClose,
  tierListName = 'Tier List',
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const exportViewRef = useRef(null);
  const downloadImage = useImageDownload(exportViewRef);

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
      await downloadImage(
        `${tierListName.toLowerCase().replace(/\s+/g, '-')}-${date}.png`
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyText = () => {
    const text = tierOrder
      .filter((tier) => tier !== 'Pool' && tiers[tier]?.length > 0)
      .map((tier) => {
        const players = tiers[tier]
          .map((p) => p.display_name || p.name)
          .join(', ');
        return `${tier}: ${players}`;
      })
      .join('\n');

    navigator.clipboard.writeText(text).catch(() => {});
  };

  const renderExportContent = () => (
    <div
      ref={exportViewRef}
      className="bg-neutral-900 p-8 rounded-lg border border-white/10"
      style={{ width: '1000px' }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-2">
          {tierListName}
        </h1>
        <div className="text-sm text-white/60 italic">
          {new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Tiers - using exact same styling as TierRow */}
      <div className="flex flex-col gap-2 w-full max-w-[1000px] mx-auto">
        {tierOrder
          .filter((tier) => tier !== 'Pool' && tiers[tier]?.length > 0)
          .map((tier) => (
            <div
              key={tier}
              className={`flex items-center gap-2 border border-white/10 rounded-md min-h-[38px] bg-neutral-800 p-0`}
            >
              <div className="w-[70px] text-sm text-white font-bold flex items-center justify-between px-1">
                <span className="flex-1 text-center">{tier}</span>
              </div>
              <div className="flex flex-wrap gap-[2px] flex-1">
                {tiers[tier].map((player) => (
                  <TierPlayerTile key={player.player_id} player={player} />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-xl border border-white/20 w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Download className="text-blue-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">Export Tier List</h2>
              <p className="text-white/60 text-sm">
                Download your tier list as an image or copy as text
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
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center transition-colors disabled:opacity-50"
              title="Download as Image"
            >
              <Download size={16} className="mr-2" />
              {isDownloading ? 'Downloading...' : 'Download Image'}
            </button>
            <button
              onClick={handleCopyText}
              className="px-4 py-2 text-sm text-white bg-white/10 rounded hover:bg-white/20 flex items-center transition-colors"
              title="Copy as Text"
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy Text
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          <div className="flex justify-center">
            <div
              style={{
                transform: 'scale(0.85)',
                transformOrigin: 'center top',
              }}
            >
              {renderExportContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierMakerExport;
