// QBRankingsHome.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Users, Calendar, Eye } from 'lucide-react';
import {
  fetchAllQBRankings,
  renameQBRanking,
  deleteQBRanking,
} from '@/firebase/listHelpers';
import {
  getArchivedPersonalRankings,
  getCurrentPersonalRanking,
} from '@/firebase/personalRankingHelpers';
import CreateRankingModal from '@/features/rankings/CreateRankingModal';
import ListSearchBar from '@/features/lists/ListSearchBar';
import usePlayerData from '@/hooks/usePlayerData.js';
import QBRankingCard from '@/features/rankings/QBRankingCard';

const QBRankingsHome = () => {
  const [rankings, setRankings] = useState([]);
  const [personalArchives, setPersonalArchives] = useState([]);
  const [currentPersonal, setCurrentPersonal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const navigate = useNavigate();
  const { players } = usePlayerData();

  const playersMap = useMemo(() => {
    const map = {};
    players.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [players]);

  const rankingsMap = useMemo(() => {
    const map = {};
    rankings.forEach((r) => {
      const playerIds = r.rankings?.map((qb) => qb.id) || [];
      map[r.id] = { name: r.name, playerIds };
    });
    return map;
  }, [rankings]);

  const fetchAllRankings = async () => {
    try {
      const [standalonRankings, archives, current] = await Promise.all([
        fetchAllQBRankings(),
        getArchivedPersonalRankings(),
        getCurrentPersonalRanking(),
      ]);

      setRankings(standalonRankings);
      setPersonalArchives(archives);
      setCurrentPersonal(current);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRankings();
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

  // Helper function to clean up redundant notes
  const cleanNotes = (notes) => {
    if (!notes) return null; // Return null instead of "No notes" to hide the area
    // Remove auto-archive text since we already show the date in the header
    if (notes.startsWith('Auto-archived on')) {
      return null; // Return null to hide the notes area completely
    }
    return notes;
  };

  const handleRename = async () => {
    if (!renameValue.trim()) return;
    try {
      await renameQBRanking(renamingId, renameValue.trim());
      setRenamingId(null);
      setRenameValue('');
      fetchAllRankings();
    } catch (error) {
      console.error('Error renaming ranking:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteQBRanking(deletingId);
      setDeletingId(null);
      fetchAllRankings();
    } catch (error) {
      console.error('Error deleting ranking:', error);
    }
  };

  const handleCreateSuccess = (rankingId) => {
    setShowCreateModal(false);
    fetchAllRankings();
    navigate(`/rankings/other/${rankingId}`);
  };

  return (
    <>
      <div className="max-w-6xl py-4 mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">All QB Rankings</h1>
          <div className="flex items-center gap-3">
            <ListSearchBar
              listsData={rankingsMap}
              playersData={playersMap}
              onSelect={(id) => navigate(`/rankings/other/${id}`)}
              placeholder="Search QB rankings..."
            />
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              onClick={() => setShowCreateModal(true)}
            >
              + New Ranking
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-white/60">Loading rankings...</div>
        ) : (
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
                        {selectedArchive.rankings?.length || 0} QBs ranked
                        {cleanNotes(selectedArchive.notes) && (
                          <> • {cleanNotes(selectedArchive.notes)}</>
                        )}
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
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
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
                        isArchiveMode={true} // Enable archive mode for uniform row heights
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
                      {currentPersonal.rankings
                        .slice(0, 10)
                        .map((qb, index) => (
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
                      <p>No current personal rankings yet</p>
                      <button
                        onClick={() => navigate('/rankings')}
                        className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                      >
                        Create Your Personal Rankings
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Other Standalone Rankings */}
              <div className="bg-neutral-800/50 rounded-xl p-6 border border-white/10 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar size={20} className="text-purple-400" />
                  <h3 className="text-lg font-bold text-white">
                    Other Ranking Lists
                  </h3>
                </div>

                {rankings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rankings.map((ranking) => (
                      <div
                        key={ranking.id}
                        className="p-4 bg-[#1a1a1a] hover:bg-[#232323] border border-white/10 rounded transition relative"
                      >
                        <Link
                          to={`/rankings/other/${ranking.id}`}
                          className="block group"
                        >
                          <h2 className="text-lg font-bold text-white mb-1 group-hover:underline">
                            {ranking.name}
                          </h2>
                          <div className="text-xs text-white/30">
                            {ranking.rankings?.length || 0} QBs • Last updated{' '}
                            {ranking.updatedAt
                              ?.toDate?.()
                              .toLocaleDateString?.() ||
                              ranking.createdAt
                                ?.toDate?.()
                                .toLocaleDateString?.() ||
                              '—'}
                          </div>
                        </Link>

                        <div className="absolute top-4 right-4 flex gap-2">
                          <button
                            onClick={() => {
                              setRenamingId(ranking.id);
                              setRenameValue(ranking.name);
                            }}
                            className="text-white/40 hover:text-white text-xs"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => setDeletingId(ranking.id)}
                            className="text-red-500 hover:text-red-600 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <p>No other ranking lists yet</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                    >
                      Create New Ranking List
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Rankings Archives Sidebar */}
            <div>
              <div className="bg-neutral-800/50 rounded-xl p-6 border border-white/10">
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
                        {archive.notes && cleanNotes(archive.notes) && (
                          <div className="text-white/70 text-xs mt-1 italic">
                            {cleanNotes(archive.notes).length > 50
                              ? `${cleanNotes(archive.notes).substring(0, 50)}...`
                              : cleanNotes(archive.notes)}
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
                    No archives yet. Your personal rankings will be
                    automatically archived when you make changes.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateRankingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreateSuccess}
      />

      {renamingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#111] p-6 rounded border border-white/10 w-full max-w-sm">
            <h2 className="text-white font-bold text-lg mb-4">
              Rename QB Ranking
            </h2>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full p-2 rounded bg-black border border-white/20 text-white mb-4"
              placeholder="New name"
            />
            <div className="flex justify-end gap-2">
              <button
                className="text-white/50 hover:text-white text-sm"
                onClick={() => setRenamingId(null)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                onClick={handleRename}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#111] p-6 rounded border border-white/10 w-full max-w-sm">
            <h2 className="text-white font-bold text-lg mb-4">
              Delete this QB ranking?
            </h2>
            <p className="text-white/60 text-sm mb-6">
              This action cannot be undone. Are you sure?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="text-white/50 hover:text-white text-sm"
                onClick={() => setDeletingId(null)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QBRankingsHome;
