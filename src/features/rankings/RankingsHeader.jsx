import React from 'react';
import {
  Plus,
  Save,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Share,
  TrendingUp,
  Download,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const RankingsHeader = ({
  onAddQB,
  rankingName,
  isSaving,
  canSave,
  onSave,
  onCreateNew,
  showCreateNew,
  onSaveSnapshot,
  isSavingSnapshot,
  showSaveSnapshot,
  onViewArchives,
  showViewArchives,
  onClearAll,
  showClearAll,
  isCleanView,
  onToggleView,
  showMovement = false,
  onToggleMovement,
  showMovementToggle = false,
  onExport,
  showExport = false,
}) => {
  const handleSharePublicLink = () => {
    const publicUrl = `${window.location.origin}/rankings/public`;
    navigator.clipboard
      .writeText(publicUrl)
      .then(() => {
        toast.success('Public link copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy link');
      });
  };

  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          to="/rankings/all"
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          ← Back to All Rankings
        </Link>
      </div>

      {/* Main Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-3">
          {rankingName || 'QB Rankings 2025'}
        </h1>
        <p className="text-white/60 text-lg">
          Your personal quarterback rankings. Build your board, add notes, and
          rank the QBs how you see them.
        </p>
      </div>

      {/* Action Bar */}
      <div
        className={`flex flex-col gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-white/10 transition-opacity duration-300 ${isCleanView ? 'opacity-0 hover:opacity-100' : ''}`}
      >
        {/* Top row - Title and status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/80">
            <span className="text-sm font-medium">
              🔥 Personal Rankings Board
            </span>
            {isSaving && (
              <span className="text-xs text-yellow-400 flex items-center gap-1">
                <Save size={12} />
                Saving...
              </span>
            )}
          </div>

          {/* Toggle view button - always visible */}
          <button
            onClick={onToggleView}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-white text-xs sm:text-sm transition-all"
          >
            {isCleanView ? (
              <>
                <Eye size={14} />
                <span className="hidden sm:inline">Show Controls</span>
                <span className="sm:hidden">Show</span>
              </>
            ) : (
              <>
                <EyeOff size={14} />
                <span className="hidden sm:inline">Hide Controls</span>
                <span className="sm:hidden">Hide</span>
              </>
            )}
          </button>
        </div>

        {/* Bottom row - Action buttons */}
        {!isCleanView && (
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
            {showMovementToggle && (
              <button
                onClick={onToggleMovement}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-white text-xs transition-all backdrop-blur-sm ${
                  showMovement
                    ? 'bg-green-600/80 hover:bg-green-700'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
                title={
                  showMovement
                    ? 'Hide ranking movement'
                    : 'Show ranking movement'
                }
              >
                <TrendingUp size={14} />
                <span className="hidden sm:inline">
                  {showMovement ? 'Hide Movement' : 'Show Movement'}
                </span>
                <span className="sm:hidden">Movement</span>
              </button>
            )}

            {showExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/80 hover:bg-indigo-700 rounded-lg font-medium text-white text-xs transition-all backdrop-blur-sm"
                title="Export rankings with grid view display"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Export Rankings</span>
                <span className="sm:hidden">Export</span>
              </button>
            )}

            <button
              onClick={handleSharePublicLink}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/80 hover:bg-purple-700 rounded-lg font-medium text-white text-xs transition-all backdrop-blur-sm"
              title="Copy public read-only link"
            >
              <Share size={14} />
              <span className="hidden sm:inline">Share Public Link</span>
              <span className="sm:hidden">Share</span>
            </button>

            {showClearAll && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600/80 hover:bg-red-700 rounded-lg font-medium text-white text-xs transition-all backdrop-blur-sm"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Clear All</span>
                <span className="sm:hidden">Clear</span>
              </button>
            )}

            {showViewArchives && (
              <button
                onClick={onViewArchives}
                className="flex items-center gap-1.5 px-3 py-2 bg-orange-600/80 hover:bg-orange-700 rounded-lg font-medium text-white text-xs transition-all backdrop-blur-sm"
              >
                <Clock size={14} />
                <span className="hidden sm:inline">View Archives</span>
                <span className="sm:hidden">Archives</span>
              </button>
            )}

            {showSaveSnapshot && (
              <button
                onClick={onSaveSnapshot}
                disabled={isSavingSnapshot}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/80 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 rounded-lg font-medium text-white text-xs transition-all backdrop-blur-sm"
              >
                {isSavingSnapshot ? (
                  <>
                    <Save size={14} className="animate-pulse" />
                    <span className="hidden sm:inline">Saving Snapshot...</span>
                    <span className="sm:hidden">Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    <span className="hidden sm:inline">Save Snapshot</span>
                    <span className="sm:hidden">Snapshot</span>
                  </>
                )}
              </button>
            )}

            {showCreateNew && (
              <button
                onClick={onCreateNew}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600/80 hover:bg-green-700 rounded-lg font-medium text-white text-xs transition-all backdrop-blur-sm"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Create New List</span>
                <span className="sm:hidden">New</span>
              </button>
            )}

            {canSave && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600/80 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 rounded-lg font-medium text-white text-xs transition-all backdrop-blur-sm"
              >
                {isSaving ? (
                  <>
                    <Save size={14} className="animate-pulse" />
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Save</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    Save
                  </>
                )}
              </button>
            )}

            <button
              onClick={onAddQB}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-semibold text-white text-xs sm:text-sm transition-all transform hover:scale-105 shadow-lg"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add QB</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingsHeader;
