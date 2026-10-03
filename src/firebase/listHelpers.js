// src/firebase/listHelpers.js
import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';

const listsRef = collection(db, 'lists');
const tierListsRef = collection(db, 'tierLists');
const qbRankingsRef = collection(db, 'qbRankings');

// ✅ Get all lists
export const fetchAllLists = async () => {
  const snapshot = await getDocs(listsRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const fetchList = async (id) => {
  const snap = await getDoc(doc(db, 'lists', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// ✅ Create list (with duplicate check). Returns the new list's id.
// Lists always get a generated id: deriving one from the name let a second
// "Top 10" silently overwrite the first.
export const createList = async (name, playerIds = []) => {
  const q = query(listsRef, where('name', '==', name));
  const existing = await getDocs(q);
  if (!existing.empty) throw new Error('A list with this name already exists.');

  const docRef = await addDoc(listsRef, {
    name,
    playerIds,
    playerOrder: playerIds,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

// Membership only: the editor shows members missing from `playerOrder` at
// the bottom (see mergeListOrder), and writes the order on its next save.
export const addPlayerToList = async (id, playerId) => {
  await updateDoc(doc(db, 'lists', id), {
    playerIds: arrayUnion(playerId),
    updatedAt: serverTimestamp(),
  });
};

// `description` and `isRanked` are optional so older callers keep working;
// when given they are saved with the order.
export const saveList = async (
  id,
  { playerOrder, playerIds, playerNotes, description, isRanked }
) => {
  const update = {
    playerOrder,
    playerIds,
    playerNotes,
    updatedAt: serverTimestamp(),
  };
  if (description !== undefined) update.description = description;
  if (isRanked !== undefined) update.isRanked = isRanked;
  await updateDoc(doc(db, 'lists', id), update);
};

// ✅ Rename list
export const renameList = async (id, newName) => {
  const docRef = doc(db, 'lists', id);
  await updateDoc(docRef, { name: newName, updatedAt: serverTimestamp() });
};

// ✅ Delete list
export const deleteList = async (id) => {
  const docRef = doc(db, 'lists', id);
  await deleteDoc(docRef);
};

// ===== Tier Lists =====
export const fetchAllTierLists = async () => {
  const snapshot = await getDocs(tierListsRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const createTierList = async (name) => {
  const q = query(tierListsRef, where('name', '==', name));
  const existing = await getDocs(q);
  if (!existing.empty)
    throw new Error('A tier list with this name already exists.');

  const newList = {
    name,
    tiers: {},
    tierOrder: [],
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(tierListsRef, newList);
  return docRef.id;
};

export const renameTierList = async (id, newName) => {
  const docRef = doc(db, 'tierLists', id);
  await updateDoc(docRef, { name: newName });
};

export const deleteTierList = async (id) => {
  const docRef = doc(db, 'tierLists', id);
  await deleteDoc(docRef);
};
export const fetchTierList = async (id) => {
  const docRef = doc(db, 'tierLists', id);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const saveTierList = async (id, { tiers, tierOrder }) => {
  const docRef = doc(db, 'tierLists', id);
  await updateDoc(docRef, {
    tiers,
    tierOrder,
    updatedAt: serverTimestamp(),
  });
};

// ===== QB Rankings =====
export const fetchAllQBRankings = async () => {
  try {
    const rankingsSnapshot = await getDocs(qbRankingsRef);
    return rankingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching QB rankings:', error);
    throw error;
  }
};

export const createQBRanking = async (name, rankings = []) => {
  try {
    const rankingRef = await addDoc(qbRankingsRef, {
      name: name || 'New QB Ranking',
      rankings: rankings,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return rankingRef.id;
  } catch (error) {
    console.error('Error creating QB ranking:', error);
    throw error;
  }
};

export const fetchQBRanking = async (rankingId) => {
  try {
    const rankingRef = doc(db, 'qbRankings', rankingId);
    const rankingSnap = await getDoc(rankingRef);

    if (rankingSnap.exists()) {
      return {
        id: rankingSnap.id,
        ...rankingSnap.data(),
      };
    } else {
      throw new Error('Ranking not found');
    }
  } catch (error) {
    console.error('Error fetching QB ranking:', error);
    throw error;
  }
};

export const saveQBRanking = async (rankingId, rankingData) => {
  try {
    const rankingRef = doc(db, 'qbRankings', rankingId);

    await updateDoc(rankingRef, {
      rankings: rankingData.rankings || [],
      name: rankingData.name || 'Untitled Ranking',
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving QB ranking:', error);
    throw error;
  }
};

export const renameQBRanking = async (rankingId, newName) => {
  try {
    const rankingRef = doc(db, 'qbRankings', rankingId);
    await updateDoc(rankingRef, {
      name: newName,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error renaming QB ranking:', error);
    throw error;
  }
};

export const deleteQBRanking = async (rankingId) => {
  try {
    await deleteDoc(doc(db, 'qbRankings', rankingId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting QB ranking:', error);
    throw error;
  }
};
