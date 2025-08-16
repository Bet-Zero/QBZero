import React from 'react';
import { Plus } from 'lucide-react';

const RankingsHeader = ({ onAddQB }) => {
  return (
    <div className="mb-8">
      {/* Main Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-3">
          QB Rankings 2025
        </h1>
        <p className="text-white/60 text-lg">
          Your personal quarterback rankings. Build your board, add notes, and
          rank the QBs how you see them.
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-white/10">
        <div className="flex items-center gap-2 text-white/80">
          <span className="text-sm font-medium">
            🔥 Personal Rankings Board
          </span>
        </div>

        <button
          onClick={onAddQB}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-semibold text-white transition-all transform hover:scale-105 shadow-lg"
        >
          <Plus size={20} />
          Add QB
        </button>
      </div>
    </div>
  );
};

export default RankingsHeader;
