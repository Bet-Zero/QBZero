import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { fetchAllQBRankings } from '@/firebase/listHelpers';
import usePersonalRankingHistory from '@/hooks/usePersonalRankingHistory';
import PersonalRankingPanel from '@/features/rankings/PersonalRankingPanel';
import ArchiveSidebar from '@/features/rankings/ArchiveSidebar';
import { formatRankingDate } from '@/utils/formatting/rankingDates';

const BrowseRankingsPage = () => {
  const navigate = useNavigate();
  const {
    current,
    archives,
    selectedArchive,
    setSelectedArchive,
    loading,
    error,
    busyId,
    restore,
    remove,
  } = usePersonalRankingHistory();
  const [otherRankings, setOtherRankings] = React.useState([]);

  React.useEffect(() => {
    fetchAllQBRankings()
      .then(setOtherRankings)
      .catch((loadError) => {
        console.error('Error loading other rankings:', loadError);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="text-white/60 text-lg">Loading rankings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-3">
            Browse All Rankings
          </h1>
          <p className="text-white/60 text-lg">
            View your current rankings, archives, and other QB ranking lists
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-500/40 bg-red-900/20 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PersonalRankingPanel
              current={current}
              selectedArchive={selectedArchive}
              onClearSelection={() => setSelectedArchive(null)}
              onEdit={() => navigate('/rankings/edit')}
              onRestore={restore}
              isRestoring={busyId === selectedArchive?.id}
            />

            <div className="bg-neutral-800/50 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Calendar size={20} className="text-purple-400" />
                <h3 className="text-lg font-bold text-white">Other Rankings</h3>
              </div>

              {otherRankings.length > 0 ? (
                <div className="space-y-2">
                  {otherRankings.slice(0, 5).map((ranking) => (
                    <button
                      key={ranking.id}
                      type="button"
                      className="w-full text-left p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                      onClick={() => navigate(`/rankings/other/${ranking.id}`)}
                    >
                      <div className="text-white font-medium text-sm">
                        {ranking.name}
                      </div>
                      <div className="text-white/60 text-xs">
                        {ranking.rankings?.length || 0} QBs •{' '}
                        {formatRankingDate(ranking, { withTime: true })}
                      </div>
                    </button>
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

          <div>
            <ArchiveSidebar
              archives={archives}
              selectedId={selectedArchive?.id}
              onSelect={setSelectedArchive}
              onRestore={restore}
              onDelete={remove}
              busyId={busyId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseRankingsPage;
