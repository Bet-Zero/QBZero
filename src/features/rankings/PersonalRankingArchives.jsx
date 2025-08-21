import React, { useState, useEffect } from 'react';
import { Clock, ChevronRight, ChevronDown, Eye, ArrowLeft } from 'lucide-react';
import { fetchAllPersonalRankingArchives, fetchPersonalRankingArchive } from '@/firebase/personalRankingHelpers';
import QBRankingCard from '@/features/rankings/QBRankingCard';

const PersonalRankingArchives = ({ onClose, onLoadArchive }) => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingArchive, setViewingArchive] = useState(null);
  const [expandedArchive, setExpandedArchive] = useState(null);

  useEffect(() => {
    loadArchives();
  }, []);

  const loadArchives = async () => {
    try {
      setLoading(true);
      const archiveData = await fetchAllPersonalRankingArchives();
      setArchives(archiveData);
    } catch (error) {
      console.error('Error loading archives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewArchive = async (archiveId) => {
    try {
      const archive = await fetchPersonalRankingArchive(archiveId);
      setViewingArchive(archive);
    } catch (error) {
      console.error('Error loading archive:', error);
    }
  };

  const handleLoadArchive = (archive) => {
    onLoadArchive(archive.rankings);
    onClose();
  };

  const toggleExpanded = (archiveId) => {
    setExpandedArchive(expandedArchive === archiveId ? null : archiveId);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (viewingArchive) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-neutral-900 rounded-xl border border-white/20 w-full max-w-4xl h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewingArchive(null)}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Archive Snapshot #{viewingArchive.snapshotNumber}
                  </h2>
                  <p className="text-white/60 text-sm">
                    {formatDate(viewingArchive.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLoadArchive(viewingArchive)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Load This Version
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            {viewingArchive.notes && (
              <div className="mt-3 p-3 bg-white/5 rounded-lg">
                <p className="text-white/80 text-sm">{viewingArchive.notes}</p>
              </div>
            )}
          </div>

          {/* Archive Content */}
          <div className="p-6 overflow-y-auto h-[calc(100%-120px)]">
            <div className="space-y-4">
              {viewingArchive.rankings?.map((qb, index) => (
                <QBRankingCard
                  key={qb.id}
                  qb={qb}
                  onMoveUp={() => {}} // Disabled in view mode
                  onMoveDown={() => {}} // Disabled in view mode
                  onRemove={() => {}} // Disabled in view mode
                  onEditNotes={() => {}} // Disabled in view mode
                  canMoveUp={false}
                  canMoveDown={false}
                  readOnly={true}
                />
              ))}
              {(!viewingArchive.rankings || viewingArchive.rankings.length === 0) && (
                <div className="text-center py-8 text-white/60">
                  No rankings in this archive
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-xl border border-white/20 w-full max-w-3xl h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-blue-400" />
              <div>
                <h2 className="text-xl font-bold text-white">Personal Rankings Archive</h2>
                <p className="text-white/60 text-sm">View and restore previous ranking snapshots</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Archive List */}
        <div className="p-6 overflow-y-auto h-[calc(100%-120px)]">
          {loading ? (
            <div className="text-center py-8 text-white/60">
              Loading archives...
            </div>
          ) : archives.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              No archives found. Save your first snapshot to start building your archive history.
            </div>
          ) : (
            <div className="space-y-3">
              {archives.map((archive, index) => (
                <div
                  key={archive.id}
                  className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-blue-400 font-bold text-lg">
                          #{archive.snapshotNumber}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            Snapshot {archive.snapshotNumber}
                          </div>
                          <div className="text-white/60 text-sm">
                            {formatDate(archive.timestamp)} • {archive.rankings?.length || 0} QBs ranked
                          </div>
                          {archive.notes && (
                            <div className="text-white/70 text-sm mt-1 italic">
                              "{archive.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewArchive(archive.id)}
                          className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                          title="View this snapshot"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => toggleExpanded(archive.id)}
                          className="p-2 text-white/60 hover:text-white transition-colors"
                        >
                          {expandedArchive === archive.id ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {expandedArchive === archive.id && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="text-sm text-white/80 mb-2">Quick Preview:</div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {archive.rankings?.slice(0, 5).map((qb, qbIndex) => (
                            <div key={qb.id} className="flex items-center gap-3 text-sm">
                              <span className="text-white/60 w-6">#{qb.rank}</span>
                              <span className="text-white">{qb.name}</span>
                              <span className="text-white/60">({qb.team})</span>
                            </div>
                          ))}
                          {archive.rankings?.length > 5 && (
                            <div className="text-white/60 text-sm">
                              ... and {archive.rankings.length - 5} more
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => handleLoadArchive(archive)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                          >
                            Load This Version
                          </button>
                          <button
                            onClick={() => handleViewArchive(archive.id)}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-medium transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalRankingArchives;