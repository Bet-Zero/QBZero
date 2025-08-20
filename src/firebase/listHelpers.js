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
} from 'firebase/firestore';

const listsRef = collection(db, 'lists');
const tierListsRef = collection(db, 'tierLists');
const qbRankingsRef = collection(db, 'qbRankings');

// ✅ Get all lists
export const fetchAllLists = async () => {
  const snapshot = await getDocs(listsRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ✅ Create list (with duplicate check)
export const createList = async (name) => {
  const q = query(listsRef, where('name', '==', name));
  const existing = await getDocs(q);
  if (!existing.empty) throw new Error('A list with this name already exists.');

  const newList = {
    name,
    players: [],
    createdAt: serverTimestamp(),
  };
  await addDoc(listsRef, newList);
};

// ✅ Rename list
export const renameList = async (id, newName) => {
  const docRef = doc(db, 'lists', id);
  await updateDoc(docRef, { name: newName });
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

export const createQBRanking = async (name) => {
  try {
    const rankingRef = await addDoc(qbRankingsRef, {
      name: name || 'New QB Ranking',
      rankings: [],
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
