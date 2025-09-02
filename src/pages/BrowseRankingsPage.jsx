import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Calendar, Eye } from 'lucide-react';
import {
  getArchivedPersonalRankings,
  getCurrentPersonalRanking,
} from '@/firebase/personalRankingHelpers';
import { fetchAllQBRankings } from '@/firebase/listHelpers';
import QBRankingCard from '@/features/rankings/QBRankingCard';

const BrowseRankingsPage = () => {
  const navigate = useNavigate();
  const [personalArchives, setPersonalArchives] = useState([]);
  const [otherRankings, setOtherRankings] = useState([]);
  const [currentPersonal, setCurrentPersonal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArchive, setSelectedArchive] = useState(null);

  useEffect(() => {
    const loadAllRankings = async () => {
      try {
        // Load personal ranking archives
        const [archives, current, others] = await Promise.all([
          getArchivedPersonalRankings(),
          getCurrentPersonalRanking(),
          fetchAllQBRankings(),
        ]);

        setPersonalArchives(archives);
        setCurrentPersonal(current);
        setOtherRankings(others);
      } catch (error) {
        console.error('Error loading rankings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllRankings();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="text-white/60 text-lg">Loading rankings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-3">
            Browse All Rankings
          </h1>
          <p className="text-white/60 text-lg">
            View your current rankings, archives, and other QB ranking lists
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Current or Selected Archive */}
          <div className="lg:col-span-2">
            {selectedArchive ? (
              /* Selected Archive Display */
              <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Clock size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Archive from {formatDate(selectedArchive.timestamp)}
                    </h2>
                    <p className="text-blue-300/80 text-sm">
                      {selectedArchive.rankings?.length || 0} QBs ranked •{' '}
                      {selectedArchive.notes || 'No notes'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedArchive(null)}
                    className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Back to Current
                  </button>
                </div>

                {/* Full Archive Rankings Display */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {selectedArchive.rankings?.map((qb, index) => (
                    <QBRankingCard
                      key={qb.id}
                      qb={{
                        ...qb,
                        rank: index + 1,
                      }}
                      readOnly={true}
                      onMoveUp={() => {}}
                      onMoveDown={() => {}}
                      onRemove={() => {}}
                      onEditNotes={() => {}}
                      canMoveUp={false}
                      canMoveDown={false}
                    />
                  )) || (
                    <div className="text-center py-8 text-white/60">
                      No rankings found in this archive
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Current Personal Rankings */
              <div className="bg-gradient-to-r from-green-900/20 to-green-800/10 border border-green-500/30 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-600/20 rounded-lg">
                    <Users size={24} className="text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Current Personal Rankings
                    </h2>
                    <p className="text-green-300/80 text-sm">
                      Your most up-to-date QB rankings
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/rankings')}
                    className="ml-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    View & Edit
                  </button>
                </div>

                {currentPersonal?.rankings?.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {currentPersonal.rankings.slice(0, 10).map((qb, index) => (
                      <div
                        key={qb.id}
                        className="bg-white/5 rounded-lg p-3 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 flex items-center justify-center bg-green-600/20 rounded-full font-bold text-green-400">
                          {qb.rank}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">
                            {qb.name}
                          </div>
                          {qb.team && (
                            <div className="text-white/60 text-sm">
                              {qb.team}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {currentPersonal.rankings.length > 10 && (
                      <div className="text-center py-2">
                        <span className="text-white/60 text-sm">
                          ... and {currentPersonal.rankings.length - 10} more
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <p>No current rankings yet</p>
                    <button
                      onClick={() => navigate('/rankings')}
                      className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                    >
                      Create Your First Rankings
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Other Rankings */}
            <div className="bg-neutral-800/50 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Calendar size={20} className="text-purple-400" />
                <h3 className="text-lg font-bold text-white">Other Rankings</h3>
              </div>

              {otherRankings.length > 0 ? (
                <div className="space-y-2">
                  {otherRankings.slice(0, 5).map((ranking) => (
                    <div
                      key={ranking.id}
                      className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                      onClick={() => navigate(`/rankings/other/${ranking.id}`)}
                    >
                      <div className="text-white font-medium text-sm">
                        {ranking.name}
                      </div>
                      <div className="text-white/60 text-xs">
                        {ranking.rankings?.length || 0} QBs •{' '}
                        {formatDate(
                          ranking.updatedAt?.toDate?.()?.toISOString() ||
                            ranking.createdAt?.toDate?.()?.toISOString()
                        )}
                      </div>
                    </div>
                  ))}
                  {otherRankings.length > 5 && (
                    <button
                      onClick={() => navigate('/rankings/all')}
                      className="w-full text-center py-2 text-white/60 hover:text-white text-sm"
                    >
                      View all {otherRankings.length} rankings
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-white/60 text-sm">
                  No other rankings found
                </div>
              )}
            </div>
          </div>

          {/* Archives Sidebar */}
          <div>
            {/* Personal Rankings Archives */}
            <div className="bg-neutral-800/50 rounded-xl p-6 border border-white/10 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock size={20} className="text-blue-400" />
                <h3 className="text-lg font-bold text-white">
                  Personal Rankings History
                </h3>
                {selectedArchive && (
                  <span className="text-blue-400 text-xs bg-blue-600/20 px-2 py-1 rounded-full">
                    Archive Selected
                  </span>
                )}
              </div>

              {personalArchives.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto overflow-x-hidden archive-scrollbar">
                  {personalArchives.map((archive) => (
                    <div
                      key={archive.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all transform hover:scale-[1.02] ${
                        selectedArchive?.id === archive.id
                          ? 'bg-blue-600/30 border-blue-400/70 shadow-lg'
                          : 'bg-white/5 border-white/10 hover:bg-white/15'
                      }`}
                      onClick={() => setSelectedArchive(archive)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium text-sm">
                            {formatDate(archive.timestamp)}
                          </div>
                          <div className="text-white/60 text-xs">
                            {archive.rankings?.length || 0} QBs ranked
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedArchive?.id === archive.id && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          )}
                          <Eye size={16} className="text-white/40" />
                        </div>
                      </div>
                      {archive.notes && (
                        <div className="text-white/70 text-xs mt-1 italic">
                          {archive.notes.length > 50
                            ? `${archive.notes.substring(0, 50)}...`
                            : archive.notes}
                        </div>
                      )}
                      <div className="text-blue-400/60 text-xs mt-1 font-medium">
                        {selectedArchive?.id === archive.id
                          ? 'Viewing archive'
                          : 'Click to view →'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-white/60 text-sm">
                  No archives yet. Your rankings will be automatically archived
                  when you make changes.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseRankingsPage;
