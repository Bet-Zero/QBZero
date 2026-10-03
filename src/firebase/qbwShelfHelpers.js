import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const shelvesDoc = doc(db, 'qbwShelves', 'main');

// The saved shelves, or null when none have been saved yet.
export const fetchShelves = async () => {
  const snap = await getDoc(shelvesDoc);
  return snap.exists() ? snap.data().shelves || null : null;
};

// Replaces every shelf at once. firestore.rules limits this to admins.
export const saveShelves = async (shelves) => {
  await setDoc(shelvesDoc, { shelves, updatedAt: serverTimestamp() });
};
