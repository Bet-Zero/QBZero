// src/firebase/personalRankingHelpers.js
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
} from 'firebase/firestore';

const personalRankingArchivesRef = collection(db, 'personalRankingArchives');

/**
 * Save a new personal ranking archive snapshot
 * @param {Array} rankings - The current ranking data
 * @param {string} notes - Optional notes for this snapshot
 * @returns {string} The ID of the created archive entry
 */
export const savePersonalRankingArchive = async (rankings, notes = '') => {
  try {
    // Get the latest archive to link to it
    const latestArchive = await getLatestPersonalRankingArchive();
    
    const now = new Date();
    const archiveData = {
      rankings: rankings || [],
      notes,
      createdAt: serverTimestamp(),
      timestamp: now.toISOString(),
      previousArchiveId: latestArchive?.id || null,
      snapshotNumber: (latestArchive?.snapshotNumber || 0) + 1,
    };

    const archiveRef = await addDoc(personalRankingArchivesRef, archiveData);
    return archiveRef.id;
  } catch (error) {
    console.error('Error saving personal ranking archive:', error);
    throw error;
  }
};

/**
 * Fetch all personal ranking archives, ordered by creation date (newest first)
 * @returns {Array} Array of archive documents
 */
export const fetchAllPersonalRankingArchives = async () => {
  try {
    const q = query(
      personalRankingArchivesRef,
      orderBy('createdAt', 'desc')
    );
    const archivesSnapshot = await getDocs(q);
    return archivesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching personal ranking archives:', error);
    throw error;
  }
};

/**
 * Fetch a specific personal ranking archive by ID
 * @param {string} archiveId - The ID of the archive to fetch
 * @returns {Object|null} The archive document or null if not found
 */
export const fetchPersonalRankingArchive = async (archiveId) => {
  try {
    const archiveRef = doc(db, 'personalRankingArchives', archiveId);
    const archiveSnap = await getDoc(archiveRef);

    if (archiveSnap.exists()) {
      return {
        id: archiveSnap.id,
        ...archiveSnap.data(),
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching personal ranking archive:', error);
    throw error;
  }
};

/**
 * Get the latest personal ranking archive
 * @returns {Object|null} The latest archive document or null if none exist
 */
export const getLatestPersonalRankingArchive = async () => {
  try {
    const q = query(
      personalRankingArchivesRef,
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const archivesSnapshot = await getDocs(q);
    
    if (!archivesSnapshot.empty) {
      const doc = archivesSnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching latest personal ranking archive:', error);
    throw error;
  }
};

/**
 * Get the archive history chain from a specific archive backwards
 * @param {string} archiveId - The archive ID to start from
 * @returns {Array} Array of archives in chronological order (oldest first)
 */
export const getArchiveHistoryChain = async (archiveId) => {
  try {
    const archives = [];
    let currentArchiveId = archiveId;

    // Traverse backwards through the chain
    while (currentArchiveId) {
      const archive = await fetchPersonalRankingArchive(currentArchiveId);
      if (!archive) break;
      
      archives.unshift(archive); // Add to beginning to maintain chronological order
      currentArchiveId = archive.previousArchiveId;
    }

    return archives;
  } catch (error) {
    console.error('Error fetching archive history chain:', error);
    throw error;
  }
};