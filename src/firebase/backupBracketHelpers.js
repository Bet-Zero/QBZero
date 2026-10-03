import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// The owner's Backup QB bracket picks (one document, backupBrackets/main).
const bracketDoc = doc(db, 'backupBrackets', 'main');

// Firestore cannot store an array of arrays, so each round's picks are kept
// under its index: { 0: [...], 1: [...] }.
const toStored = (winners) =>
  Object.fromEntries(winners.map((round, index) => [String(index), round]));

const fromStored = (rounds) => {
  if (!rounds || typeof rounds !== 'object') return null;
  return Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b)
    .map((index) => rounds[index]);
};

// The saved picks, or null when none have been saved yet.
export const fetchBracketPicks = async () => {
  const snap = await getDoc(bracketDoc);
  return snap.exists() ? fromStored(snap.data().rounds) : null;
};

// Replaces the saved picks. firestore.rules limits this to admins.
export const saveBracketPicks = async (winners) => {
  await setDoc(bracketDoc, {
    rounds: toStored(winners),
    updatedAt: serverTimestamp(),
  });
};
