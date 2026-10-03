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
import { formatArchiveDate } from '@/utils/formatting/rankingDates';

/**
 * Give every archive the date its board was saved.
 *
 * Archives written before `savedAt` existed only know when they were replaced.
 * Each save archives exactly one board, so the board in an archive was saved at
 * the moment the next-older archive was replaced: that archive's `createdAt`.
 * The oldest one loaded has no neighbour to read it from, so it is flagged and
 * shown by its replacement date instead of under a date it does not belong to.
 * (An archive deleted from the middle of that stretch makes the one above it
 * read as older than it is; nothing stored says otherwise.)
 */
export const withSavedDates = (archives = []) =>
  archives.map((archive, index) => {
    if (archive.savedAt) return archive;
    const older = archives[index + 1];
    if (older?.createdAt) return { ...archive, savedAt: older.createdAt };
    return { ...archive, dateIsReplacement: true };
  });

/**
 * The live board plus its archives, and the two things you can do to a
 * archive: put it back, or throw it away.
 *
 * Restoring goes through the ordinary save, so the board being replaced is
 * archived first -- restoring the wrong version is itself undoable.
 */
/** The most archives read at once, when the whole history is wanted. */
const ALL_ARCHIVES = 2000;

const usePersonalRankingHistory = () => {
  const [current, setCurrent] = useState(null);
  const [archives, setArchives] = useState([]);
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
        withSavedDates(history.archives).map((archive, index, all) => ({
          ...archive,
          summary: summariseRankingChange(
            archive.rankings,
            all[index + 1]?.rankings
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

  // Zoomed out to months or years, a page is not enough: every period has to
  // be there to file. Reads the lot in one bounded query.
  const loadAll = useCallback(async () => {
    setLoadingMore(true);
    setPageSize(ALL_ARCHIVES);
    await load(ALL_ARCHIVES);
    setLoadingMore(false);
  }, [load]);

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
        // The note describes the version it is on. A restored board with no
        // note of its own says where it came from, so the history reads
        // through rather than showing an unexplained jump back.
        await saveCurrentPersonalRankings(archive.rankings || [], {
          notes:
            archive.notes ||
            `Restored the ranking from ${formatArchiveDate(archive)}`,
          expectedVersion: current?.version ?? null,
        });
        toast.success('Rankings restored from that archive.');
        await load(pageSize);
        return true;
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
    loading,
    loadingMore,
    hasMore,
    loadMore,
    loadAll,
    error,
    busyId,
    restore,
    remove,
    reload: load,
  };
};

export default usePersonalRankingHistory;
