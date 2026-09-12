// QBRankingsHome.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import {
  fetchAllQBRankings,
  renameQBRanking,
  deleteQBRanking,
} from '@/firebase/listHelpers';
import usePersonalRankingHistory from '@/hooks/usePersonalRankingHistory';
import PersonalRankingPanel from '@/features/rankings/PersonalRankingPanel';
import ArchiveSidebar from '@/features/rankings/ArchiveSidebar';
import CreateRankingModal from '@/features/rankings/CreateRankingModal';
import ListSearchBar from '@/features/lists/ListSearchBar';
import usePlayerData from '@/hooks/usePlayerData.js';
import { formatRankingDate } from '@/utils/formatting/rankingDates';

const QBRankingsHome = () => {
  const [rankings, setRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();
  const { players } = usePlayerData();
  const {
    current: currentPersonal,
    archives: personalArchives,
    selectedArchive,
    setSelectedArchive,
    busyId,
    restore,
    remove,
  } = usePersonalRankingHistory();

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
      setRankings(await fetchAllQBRankings());
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRankings();
  }, []);

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
              <PersonalRankingPanel
                current={currentPersonal}
                selectedArchive={selectedArchive}
                onClearSelection={() => setSelectedArchive(null)}
                onEdit={() => navigate('/rankings/edit')}
                onRestore={restore}
                isRestoring={busyId === selectedArchive?.id}
              />

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
                            {formatRankingDate(ranking)}
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
              <ArchiveSidebar
                archives={personalArchives}
                selectedId={selectedArchive?.id}
                onSelect={setSelectedArchive}
                onRestore={restore}
                onDelete={remove}
                busyId={busyId}
              />
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
