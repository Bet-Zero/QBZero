// src/firebase/personalRankingHelpers.js
//
// The personal ranking board and its history.
//
// Both live in `personalRankingArchives`. One document carries `isCurrent: true`
// and is the live board every page reads; the rest are archives, written when
// the live board is replaced. That is the only thing telling the two apart, so
// every query here filters on it explicitly.
//
// Saving is a transaction: the outgoing board is archived and the live document
// replaced in one commit. It used to be a read, then a write, then another
// write, so two tabs -- or one slow save -- produced two archives of the same
// state and silently lost one of the two boards.
import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  where,
  deleteDoc,
  runTransaction,
} from 'firebase/firestore';

const COLLECTION = 'personalRankingArchives';
const personalRankingArchivesRef = collection(db, COLLECTION);

/** How many archives the history views ask for at once. */
export const ARCHIVE_PAGE_SIZE = 50;

/**
 * Thrown when the live board changed since the caller last read it. The save is
 * abandoned rather than overwriting whatever the other writer put there.
 */
export class PersonalRankingConflictError extends Error {
  constructor(currentVersion) {
    super(
      'These rankings were changed somewhere else since you loaded them. Reload before saving.'
    );
    this.name = 'PersonalRankingConflictError';
    this.currentVersion = currentVersion;
  }
}

const withId = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

/**
 * Every change to a quarterback's note, one document each, under the live
 * board: `personalRankingArchives/<live>/noteHistory`. Archives only keep the
 * note a quarterback had when the board was replaced, and notes save on their
 * own between those saves -- so a note rewritten twice in a week kept only the
 * last version. The existing rule on `personalRankingArchives/{document=**}`
 * already covers this subcollection.
 */
const NOTE_HISTORY = 'noteHistory';

/** Log each entry whose note differs from the one it had on `before`. */
const logNoteChanges = (transaction, currentRef, before = [], after = []) => {
  const previous = new Map(
    before.map((entry) => [entry.id, entry.notes || ''])
  );
  after.forEach((entry) => {
    const text = entry.notes || '';
    const had = previous.has(entry.id) ? previous.get(entry.id) : '';
    if (text === had) return;
    transaction.set(doc(collection(currentRef, NOTE_HISTORY)), {
      qbId: entry.id,
      name: entry.name || '',
      notes: text,
      at: serverTimestamp(),
    });
  });
};

/** The quarterbacks in order -- what a ranking actually is. */
const sameOrder = (a = [], b = []) =>
  a.length === b.length &&
  a.every((entry, index) => entry?.id === b[index]?.id);

/** The live board's document reference, or null if it has never been saved. */
const findCurrentRankingRef = async () => {
  const snapshot = await getDocs(
    query(personalRankingArchivesRef, where('isCurrent', '==', true), limit(1))
  );
  return snapshot.empty ? null : snapshot.docs[0].ref;
};

/** The live board. */
export const getCurrentPersonalRanking = async () => {
  const snapshot = await getDocs(
    query(personalRankingArchivesRef, where('isCurrent', '==', true), limit(1))
  );
  return snapshot.empty ? null : withId(snapshot.docs[0]);
};

/**
 * Save the board, archiving the version it replaces, in one commit.
 *
 * Pass `expectedVersion` -- the `version` that came back with the board you
 * loaded -- to have a concurrent save rejected instead of silently overwritten.
 */
export const saveCurrentPersonalRankings = async (
  rankings,
  { notes = '', expectedVersion } = {}
) => {
  const entries = rankings || [];
  const currentRef = await findCurrentRankingRef();

  if (!currentRef) {
    const created = await addDoc(personalRankingArchivesRef, {
      rankings: entries,
      notes,
      isCurrent: true,
      version: 1,
      savedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      currentId: created.id,
      archiveId: null,
      version: 1,
      reordered: true,
    };
  }

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(currentRef);
    const data = snapshot.exists() ? snapshot.data() : null;
    const version = data?.version || 0;

    if (expectedVersion != null && version !== expectedVersion) {
      throw new PersonalRankingConflictError(version);
    }

    // A save that leaves every quarterback where he was is not a new ranking.
    // Archiving it anyway filled the history with "No changes" rows and, worse,
    // made the identical board the "previous ranking" every movement arrow
    // compares against -- so one idle save wiped every arrow on the public page.
    const reordered = !sameOrder(data?.rankings, entries);

    // Archive what is being replaced, keeping whatever note that version
    // carried. This used to overwrite it with an "Auto-archived on ..." string
    // that both history views then detected and hid again.
    //
    // `createdAt` on an archive is when it was replaced, which is what the list
    // sorts on. `savedAt` is when that board was made -- the date it belongs
    // under. Archives written before this field existed only have the first.
    let archiveId = null;
    if (reordered && data?.rankings?.length) {
      const archiveRef = doc(personalRankingArchivesRef);
      transaction.set(archiveRef, {
        rankings: data.rankings,
        notes: data.notes || '',
        savedAt: data.savedAt || data.updatedAt || data.createdAt || null,
        createdAt: serverTimestamp(),
      });
      archiveId = archiveRef.id;
    }

    // Notes typed on a quarterback before he was first saved ride along with
    // this save; log them so they are not missing from his note history.
    logNoteChanges(transaction, currentRef, data?.rankings, entries);

    // `updatedAt` also moves when a note is typed; `savedAt` only moves when the
    // order does, so it is the date the ranking itself carries.
    transaction.update(currentRef, {
      rankings: entries,
      notes,
      isCurrent: true,
      version: version + 1,
      ...(reordered ? { savedAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    });

    return {
      currentId: currentRef.id,
      archiveId,
      version: version + 1,
      reordered,
    };
  });
};

/**
 * Write one quarterback's note and nothing else.
 *
 * Notes save as you type them rather than waiting for Save, which is
 * deliberate -- but this used to send the whole in-memory board to do it, so an
 * unsaved reorder went with it, permanently and without an archive, while the
 * page still showed "unsaved changes". Address the entry by id and leave the
 * order alone.
 *
 * Returns 'saved', or 'not-found' when the quarterback is not in the saved
 * board yet -- an addition that has not been saved. The caller keeps the note
 * in local state so it rides along with the next save.
 */
export const savePersonalRankingNotes = async (qbId, notes) => {
  const currentRef = await findCurrentRankingRef();
  if (!currentRef) return 'not-found';

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(currentRef);
    const entries = snapshot.data()?.rankings || [];
    const entry = entries.find((candidate) => candidate.id === qbId);
    if (!entry) return 'not-found';

    logNoteChanges(transaction, currentRef, [entry], [{ ...entry, notes }]);
    transaction.update(currentRef, {
      rankings: entries.map((entry) =>
        entry.id === qbId ? { ...entry, notes } : entry
      ),
      updatedAt: serverTimestamp(),
    });
    return 'saved';
  });
};

/**
 * Every logged version of one quarterback's note, oldest first. Filtered on one
 * field and sorted here, so it needs no composite index.
 */
export const getNoteHistory = async (qbId) => {
  const currentRef = await findCurrentRankingRef();
  if (!currentRef || !qbId) return [];
  const snapshot = await getDocs(
    query(collection(currentRef, NOTE_HISTORY), where('qbId', '==', qbId))
  );
  return snapshot.docs
    .map(withId)
    .sort((a, b) => (a.at?.toMillis?.() ?? 0) - (b.at?.toMillis?.() ?? 0));
};

/**
 * Archives, newest first, with whether there are older ones still to fetch.
 *
 * Nothing prunes: every save keeps the board it replaced, deliberately. So the
 * read is bounded instead -- a page asks for what it will show rather than for
 * the whole collection, and a history that has been running for years costs the
 * same to open as one that started last week.
 *
 * The live board sits in the same collection, so two extra documents are
 * requested: one to absorb the live board if it lands in the window, one to
 * answer `hasMore`. Its `createdAt` is from when the board was first created,
 * so in practice it sorts last.
 */
export const getPersonalRankingArchives = async (max = ARCHIVE_PAGE_SIZE) => {
  const snapshot = await getDocs(
    query(
      personalRankingArchivesRef,
      orderBy('createdAt', 'desc'),
      limit(max + 2)
    )
  );
  const archives = snapshot.docs
    .map(withId)
    .filter((archive) => !archive.isCurrent);

  return { archives: archives.slice(0, max), hasMore: archives.length > max };
};

/**
 * The archive the live board replaced -- what movement indicators compare
 * against. Reads a handful of documents rather than the whole collection,
 * which the public rankings page was doing on every visit to use one of them.
 */
export const getPreviousPersonalRanking = async () => {
  const { archives } = await getPersonalRankingArchives(1);
  return archives[0] || null;
};

/** One archive by id. */
export const fetchPersonalRankingArchive = async (archiveId) => {
  const snapshot = await getDoc(doc(db, COLLECTION, archiveId));
  return snapshot.exists() ? withId(snapshot) : null;
};

/** Delete one archive. The live board is never a valid target. */
export const deletePersonalRankingArchive = async (archiveId) => {
  const archive = await fetchPersonalRankingArchive(archiveId);
  if (archive?.isCurrent) {
    throw new Error('That is the live ranking, not an archive.');
  }
  await deleteDoc(doc(db, COLLECTION, archiveId));
  return true;
};
