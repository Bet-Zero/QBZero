// src/firebase/personalRankingHelpers.js
//
// The personal ranking board and its history.
//
// Both live in `personalRankingArchives`. One document carries `isCurrent: true`
// and is the live board every page reads; the rest are snapshots, written when
// the live board is replaced. That is the only thing telling the two apart, so
// every query here filters on it explicitly.
//
// Saving is a transaction: the outgoing board is archived and the live document
// replaced in one commit. It used to be a read, then a write, then another
// write, so two tabs -- or one slow save -- produced two snapshots of the same
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

/** How many snapshots the history views ask for at once. */
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { currentId: created.id, archiveId: null, version: 1 };
  }

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(currentRef);
    const data = snapshot.exists() ? snapshot.data() : null;
    const version = data?.version || 0;

    if (expectedVersion != null && version !== expectedVersion) {
      throw new PersonalRankingConflictError(version);
    }

    // Archive what is being replaced, keeping whatever note that version
    // carried. This used to overwrite it with an "Auto-archived on ..." string
    // that both history views then detected and hid again.
    let archiveId = null;
    if (data?.rankings?.length) {
      const archiveRef = doc(personalRankingArchivesRef);
      transaction.set(archiveRef, {
        rankings: data.rankings,
        notes: data.notes || '',
        createdAt: serverTimestamp(),
      });
      archiveId = archiveRef.id;
    }

    transaction.update(currentRef, {
      rankings: entries,
      notes,
      isCurrent: true,
      version: version + 1,
      updatedAt: serverTimestamp(),
    });

    return { currentId: currentRef.id, archiveId, version: version + 1 };
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
    if (!entries.some((entry) => entry.id === qbId)) return 'not-found';

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
 * Snapshots, newest first.
 *
 * The live board sits in the same collection, so one extra document is
 * requested and the filter drops it if it lands in the window. Its `createdAt`
 * is from when the board was first created, so in practice it sorts last.
 */
export const getPersonalRankingArchives = async (max = ARCHIVE_PAGE_SIZE) => {
  const snapshot = await getDocs(
    query(
      personalRankingArchivesRef,
      orderBy('createdAt', 'desc'),
      limit(max + 1)
    )
  );
  return snapshot.docs
    .map(withId)
    .filter((archive) => !archive.isCurrent)
    .slice(0, max);
};

/**
 * The snapshot the live board replaced -- what movement indicators compare
 * against. Reads three documents rather than the whole collection, which the
 * public rankings page was doing on every visit to use one of them.
 */
export const getPreviousPersonalRanking = async () => {
  const [previous] = await getPersonalRankingArchives(2);
  return previous || null;
};

/** One snapshot by id. */
export const fetchPersonalRankingArchive = async (archiveId) => {
  const snapshot = await getDoc(doc(db, COLLECTION, archiveId));
  return snapshot.exists() ? withId(snapshot) : null;
};

/** Delete one snapshot. The live board is never a valid target. */
export const deletePersonalRankingArchive = async (archiveId) => {
  const archive = await fetchPersonalRankingArchive(archiveId);
  if (archive?.isCurrent) {
    throw new Error('That is the live ranking, not a snapshot.');
  }
  await deleteDoc(doc(db, COLLECTION, archiveId));
  return true;
};
