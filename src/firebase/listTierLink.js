// src/firebase/listTierLink.js
// Moves a list onto a tier board and back. The board is a copy that
// remembers its list in `sourceList: { id, name }`; nothing syncs on its own,
// the board's "Send to list" writes it back when asked.
import { db } from '../firebaseConfig';
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { fetchList, saveList } from '@/firebase/listHelpers';
import {
  keepNotesFor,
  listToTierBoard,
  tierBoardToList,
} from '@/utils/lists/listTierBridge';

const tierListsRef = collection(db, 'tierLists');

const nameTaken = async (name) =>
  !(await getDocs(query(tierListsRef, where('name', '==', name)))).empty;

// Tier list names are unique; a second board from the same list gets "2".
const freeBoardName = async (base) => {
  let name = base;
  for (let n = 2; await nameTaken(name); n += 1) name = `${base} ${n}`;
  return name;
};

/** Creates a tier board from a list and returns the new board's id. */
export const createTierBoardFromList = async (list) => {
  const { tiers, tierOrder } = listToTierBoard(list);
  const docRef = await addDoc(tierListsRef, {
    name: await freeBoardName(list.name || 'Untitled list'),
    tiers,
    tierOrder,
    sourceList: { id: list.id, name: list.name || '' },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Replaces a list's order and tiers with a board's (`{ tiers, tierOrder }`
 * as saved, so unresolved ids are included). Notes stay for players still on
 * the list. Throws if the list no longer exists.
 */
export const sendTierBoardToList = async (listId, savedBoard) => {
  const list = await fetchList(listId);
  if (!list) throw new Error('That list no longer exists.');
  const { playerOrder, playerIds } = tierBoardToList(savedBoard);
  await saveList(listId, {
    playerOrder,
    playerIds,
    playerNotes: keepNotesFor(list.playerNotes, playerIds),
  });
  return list;
};
