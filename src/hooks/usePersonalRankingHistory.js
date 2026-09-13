import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getCurrentPersonalRanking,
  getPersonalRankingArchives,
  saveCurrentPersonalRankings,
  deletePersonalRankingArchive,
  ARCHIVE_PAGE_SIZE,
} from '@/firebase/personalRankingHelpers';
import { summariseRankingChange } from '@/utils/rankings/rankingSummary';

/**
 * The live board plus its archives, and the two things you can do to a
 * archive: put it back, or throw it away.
 *
 * Restoring goes through the ordinary save, so the board being replaced is
 * archived first -- restoring the wrong version is itself undoable.
 */
const usePersonalRankingHistory = () => {
  const [current, setCurrent] = useState(null);
  const [archives, setArchives] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  // Archives are kept forever, so the list is paged rather than capped: what is
  // on screen grows on request, and what is stored is never thrown away.
  const [pageSize, setPageSize] = useState(ARCHIVE_PAGE_SIZE);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (size = ARCHIVE_PAGE_SIZE) => {
    try {
      const [liveBoard, history] = await Promise.all([
        getCurrentPersonalRanking(),
        getPersonalRankingArchives(size),
      ]);
      setCurrent(liveBoard);
      setHasMore(history.hasMore);
      // Each archive is described by what changed between it and the one
      // before it, so two updates a week apart are told apart without opening
      // both. The boards are already loaded; this is the comparison, not a read.
      setArchives(
        history.archives.map((archive, index) => ({
          ...archive,
          summary: summariseRankingChange(
            archive.rankings,
            history.archives[index + 1]?.rankings
          ),
        }))
      );
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
    load(ARCHIVE_PAGE_SIZE);
  }, [load]);

  const loadMore = useCallback(async () => {
    const next = pageSize + ARCHIVE_PAGE_SIZE;
    setLoadingMore(true);
    setPageSize(next);
    await load(next);
    setLoadingMore(false);
  }, [load, pageSize]);

  const restore = useCallback(
    async (archive) => {
      if (
        !window.confirm(
          'Make this archive your current rankings? The board you have now is archived first, so this can be undone.'
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
        toast.success('Rankings restored from that archive.');
        setSelectedArchive(null);
        await load(pageSize);
      } catch (restoreError) {
        console.error('Error restoring archive:', restoreError);
        toast.error(restoreError?.message || 'Could not restore that archive.');
      } finally {
        setBusyId(null);
      }
    },
    [current, load, pageSize]
  );

  const remove = useCallback(
    async (archive) => {
      if (
        !window.confirm(
          'Delete this archive? The rankings it holds are not recoverable afterwards.'
        )
      ) {
        return;
      }
      setBusyId(archive.id);
      try {
        await deletePersonalRankingArchive(archive.id);
        toast.success('Archive deleted.');
        setSelectedArchive((selected) =>
          selected?.id === archive.id ? null : selected
        );
        await load(pageSize);
      } catch (deleteError) {
        console.error('Error deleting archive:', deleteError);
        toast.error(deleteError?.message || 'Could not delete that archive.');
      } finally {
        setBusyId(null);
      }
    },
    [load, pageSize]
  );

  return {
    current,
    archives,
    selectedArchive,
    setSelectedArchive,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    error,
    busyId,
    restore,
    remove,
    reload: load,
  };
};

export default usePersonalRankingHistory;
