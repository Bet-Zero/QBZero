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
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';

const takesRef = collection(db, 'takes');

export const fetchAllTakes = async () => {
  try {
    const q = query(takesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching takes:', error);
    throw error;
  }
};

// Get takes for a specific author
export const fetchAuthorTakes = async (authorId) => {
  try {
    const q = query(
      takesRef,
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching takes:', error);
    throw error;
  }
};

// Create a new take with author info
export const createTake = async (takeData, authorId, authorName) => {
  try {
    const take = {
      ...takeData,
      authorId,
      authorName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(takesRef, take);
    return { id: docRef.id, ...take };
  } catch (error) {
    console.error('Error creating take:', error);
    throw error;
  }
};

// Update a take (only if user is the author)
export const updateTake = async (takeId, takeData, authorId) => {
  try {
    const takeRef = doc(db, 'takes', takeId);
    const takeSnap = await getDoc(takeRef);

    if (!takeSnap.exists()) {
      throw new Error('Take not found');
    }

    if (takeSnap.data().authorId !== authorId) {
      throw new Error('Unauthorized: You can only edit your own takes');
    }

    await updateDoc(takeRef, {
      ...takeData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating take:', error);
    throw error;
  }
};

// Delete a take (only if user is the author)
export const deleteTake = async (takeId, authorId) => {
  try {
    const takeRef = doc(db, 'takes', takeId);
    const takeSnap = await getDoc(takeRef);

    if (!takeSnap.exists()) {
      throw new Error('Take not found');
    }

    if (takeSnap.data().authorId !== authorId) {
      throw new Error('Unauthorized: You can only delete your own takes');
    }

    await deleteDoc(takeRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting take:', error);
    throw error;
  }
};
