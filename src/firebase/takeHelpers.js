import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { pickTakeFields } from '@/utils/qbw/takes';

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

// Create a new take with author info
export const createTake = async (takeData, authorId, authorName) => {
  try {
    const take = {
      ...pickTakeFields(takeData),
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

// Edit a take's content or status. firestore.rules limits this to admins;
// the author and creation time are left as they were.
export const updateTake = async (takeId, takeData) => {
  try {
    await updateDoc(doc(db, 'takes', takeId), {
      ...pickTakeFields(takeData),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating take:', error);
    throw error;
  }
};

// Delete a take. firestore.rules limits this to admins.
export const deleteTake = async (takeId) => {
  try {
    await deleteDoc(doc(db, 'takes', takeId));
  } catch (error) {
    console.error('Error deleting take:', error);
    throw error;
  }
};
