import React from 'react';
import {
  Plus,
  Save,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
}) => {
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
        className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-white/10 transition-opacity duration-300 ${isCleanView ? 'opacity-0 hover:opacity-100' : ''}`}
      >
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

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleView}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-white text-sm transition-all"
          >
            {isCleanView ? (
              <>
                <Eye size={16} />
                Show Controls
              </>
            ) : (
              <>
                <EyeOff size={16} />
                Hide Controls
              </>
            )}
          </button>

          {!isCleanView && (
            <>
              {showClearAll && (
                <button
                  onClick={onClearAll}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-700 rounded-lg font-medium text-white text-sm transition-all backdrop-blur-sm"
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
              )}

              {showViewArchives && (
                <button
                  onClick={onViewArchives}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600/80 hover:bg-orange-700 rounded-lg font-medium text-white text-sm transition-all backdrop-blur-sm"
                >
                  <Clock size={16} />
                  View Archives
                </button>
              )}

              {showSaveSnapshot && (
                <button
                  onClick={onSaveSnapshot}
                  disabled={isSavingSnapshot}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 rounded-lg font-medium text-white text-sm transition-all backdrop-blur-sm"
                >
                  {isSavingSnapshot ? (
                    <>
                      <Save size={16} className="animate-pulse" />
                      Saving Snapshot...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Save Snapshot
                    </>
                  )}
                </button>
              )}

              {showCreateNew && (
                <button
                  onClick={onCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-700 rounded-lg font-medium text-white text-sm transition-all backdrop-blur-sm"
                >
                  <Plus size={16} />
                  Create New List
                </button>
              )}

              {canSave && (
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 rounded-lg font-medium text-white text-sm transition-all backdrop-blur-sm"
                >
                  {isSaving ? (
                    <>
                      <Save size={16} className="animate-pulse" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Save
                    </>
                  )}
                </button>
              )}

              <button
                onClick={onAddQB}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-semibold text-white transition-all transform hover:scale-105 shadow-lg"
              >
                <Plus size={20} />
                Add QB
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankingsHeader;
