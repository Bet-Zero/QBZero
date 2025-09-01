import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

const TakeCard = ({ take }) => {
  const getStatusIcon = () => {
    switch (take.status) {
      case 'correct':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'wrong':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Eye className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (take.status) {
      case 'correct':
        return 'border-green-500/30 bg-green-500/10';
      case 'wrong':
        return 'border-red-500/30 bg-red-500/10';
      case 'pending':
        return 'border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border ${getStatusColor()} transition-all duration-200 hover:scale-[1.02] h-[180px] flex flex-col`}
    >
      <div className="flex items-start gap-3 h-full">
        <div className="flex-shrink-0 mt-1">{getStatusIcon()}</div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="text-white/90 font-medium mb-1 line-clamp-2">
            {take.title}
          </div>
          <div className="text-white/70 text-sm mb-2 flex-1 line-clamp-3">
            {take.description}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50 mt-auto">
            <span>QB: {take.qbName}</span>
            <span>•</span>
            <span>{take.date}</span>
            {take.status === 'correct' && take.proofDate && (
              <>
                <span>•</span>
                <span className="text-green-400">Proven: {take.proofDate}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TakeBoard = ({ takes = [] }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredTakes = takes.filter((take) => {
    // First apply status filter
    if (filter !== 'all' && take.status !== filter) return false;

    // Then apply search filter if there is a search term
    if (search.trim()) {
      return take.qbName.toLowerCase().includes(search.toLowerCase());
    }

    return true;
  });

  const statusCounts = takes.reduce((acc, take) => {
    acc[take.status] = (acc[take.status] || 0) + 1;
    return acc;
  }, {});

  const getFilterButtonClass = (filterType) => {
    const isActive = filter === filterType;
    const baseClass =
      'px-3 py-1.5 text-sm rounded-md transition-all duration-200';

    if (isActive) {
      switch (filterType) {
        case 'correct':
          return `${baseClass} bg-green-600 text-white`;
        case 'wrong':
          return `${baseClass} bg-red-600 text-white`;
        case 'pending':
          return `${baseClass} bg-yellow-600 text-white`;
        default:
          return `${baseClass} bg-blue-600 text-white`;
      }
    }

    return `${baseClass} bg-white/10 text-white/70 hover:bg-white/20`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white/90 mb-2">🎯 Take Board</h2>
        <p className="text-white/60">My QB predictions and hot takes</p>
      </div>

      {/* Filter Buttons and Search Bar Container */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Filter Buttons */}
        <button
          onClick={() => setFilter('all')}
          className={getFilterButtonClass('all')}
        >
          All ({takes.length})
        </button>
        <button
          onClick={() => setFilter('correct')}
          className={getFilterButtonClass('correct')}
        >
          ✅ Correct ({statusCounts.correct || 0})
        </button>
        <button
          onClick={() => setFilter('wrong')}
          className={getFilterButtonClass('wrong')}
        >
          ❌ Wrong ({statusCounts.wrong || 0})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={getFilterButtonClass('pending')}
        >
          ⏳ Pending ({statusCounts.pending || 0})
        </button>

        {/* Search Bar */}
        <div className="relative w-[200px]">
          <input
            type="text"
            placeholder="Search QB..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded-md text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Takes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 min-h-[500px]">
        {filteredTakes.length > 0 ? (
          filteredTakes.map((take, index) => (
            <TakeCard key={take.id || index} take={take} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <div className="text-white/40 text-lg">
              No takes match your filter
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeBoard;
