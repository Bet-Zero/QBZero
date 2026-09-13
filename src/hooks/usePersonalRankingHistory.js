import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getCurrentPersonalRanking,
  getPersonalRankingArchives,
  saveCurrentPersonalRankings,
  deletePersonalRankingArchive,
} from '@/firebase/personalRankingHelpers';

/**
 * The live board plus its snapshots, and the two things you can do to a
 * snapshot: put it back, or throw it away.
 *
 * Restoring goes through the ordinary save, so the board being replaced is
 * archived first -- restoring the wrong version is itself undoable.
 */
const usePersonalRankingHistory = () => {
  const [current, setCurrent] = useState(null);
  const [archives, setArchives] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [liveBoard, history] = await Promise.all([
        getCurrentPersonalRanking(),
        getPersonalRankingArchives(),
      ]);
      setCurrent(liveBoard);
      setArchives(history);
      setError(null);
    } catch (loadError) {
      // Falling through to the empty state made an outage look like an empty
      // ranking, on the owner's page and the public one alike.
      console.error('Error loading rankings:', loadError);
      setError('Could not load the rankings history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const restore = useCallback(
    async (archive) => {
      if (
        !window.confirm(
          `Make this snapshot your current rankings? The board you have now is archived first, so this can be undone.`
        )
      ) {
        return;
      }
      setBusyId(archive.id);
      try {
        await saveCurrentPersonalRankings(archive.rankings || [], {
          notes: archive.notes || '',
          expectedVersion: current?.version ?? null,
        });
        toast.success('Rankings restored from that snapshot.');
        setSelectedArchive(null);
        await load();
      } catch (restoreError) {
        console.error('Error restoring archive:', restoreError);
        toast.error(
          restoreError?.message || 'Could not restore that snapshot.'
        );
      } finally {
        setBusyId(null);
      }
    },
    [current, load]
  );

  const remove = useCallback(
    async (archive) => {
      if (
        !window.confirm(
          'Delete this snapshot? The rankings it holds are not recoverable afterwards.'
        )
      ) {
        return;
      }
      setBusyId(archive.id);
      try {
        await deletePersonalRankingArchive(archive.id);
        toast.success('Snapshot deleted.');
        setSelectedArchive((selected) =>
          selected?.id === archive.id ? null : selected
        );
        await load();
      } catch (deleteError) {
        console.error('Error deleting archive:', deleteError);
        toast.error(deleteError?.message || 'Could not delete that snapshot.');
      } finally {
        setBusyId(null);
      }
    },
    [load]
  );

  return {
    current,
    archives,
    selectedArchive,
    setSelectedArchive,
    loading,
    error,
    busyId,
    restore,
    remove,
    reload: load,
  };
};

export default usePersonalRankingHistory;
