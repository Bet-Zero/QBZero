import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

const takeAuthorsRef = collection(db, 'takeAuthors');

// Generate a random 6-character code
const generateAuthorCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed similar looking chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create a new take author
export const createTakeAuthor = async (name) => {
  try {
    // Check if name is already taken
    const q = query(takeAuthorsRef, where('name', '==', name));
    const existing = await getDocs(q);
    if (!existing.empty) {
      throw new Error(
        'This name is already taken. Please choose another name or login with your code.'
      );
    }

    const code = generateAuthorCode();
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    await setDoc(doc(db, 'takeAuthors', id), {
      name,
      code,
      createdAt: new Date().toISOString(),
    });

    return {
      id,
      name,
      code, // Only returned once during creation
    };
  } catch (error) {
    console.error('Error creating take author:', error);
    throw error;
  }
};

// Verify a take author's code
export const verifyTakeAuthor = async (name, code) => {
  try {
    const q = query(takeAuthorsRef, where('name', '==', name));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('Author not found');
    }

    const author = snapshot.docs[0];
    if (author.data().code !== code.toUpperCase()) {
      throw new Error('Incorrect code');
    }

    return {
      id: author.id,
      name: author.data().name,
    };
  } catch (error) {
    console.error('Error verifying take author:', error);
    throw error;
  }
};
