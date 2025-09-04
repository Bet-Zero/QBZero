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
  updateDoc,
  where,
  deleteDoc,
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
    const q = query(personalRankingArchivesRef, orderBy('createdAt', 'desc'));
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

/**
 * Publish a QB ranking as the official personal ranking
 * @param {Array} rankings - The ranking data to publish
 * @param {string} sourceName - The name of the source ranking
 * @returns {string} The ID of the published ranking
 */
export const publishAsPersonalRanking = async (rankings, sourceName = '') => {
  try {
    const now = new Date();
    const publishedData = {
      rankings: rankings || [],
      sourceName: sourceName,
      publishedAt: serverTimestamp(),
      timestamp: now.toISOString(),
      isPublished: true,
    };

    // Check if there's already a published ranking
    const existingPublished = await getPublishedPersonalRanking();

    if (existingPublished) {
      // Update existing published ranking
      const publishedRef = doc(
        db,
        'personalRankingArchives',
        existingPublished.id
      );
      await updateDoc(publishedRef, publishedData);
      return existingPublished.id;
    } else {
      // Create new published ranking
      const publishedRef = await addDoc(
        personalRankingArchivesRef,
        publishedData
      );
      return publishedRef.id;
    }
  } catch (error) {
    console.error('Error publishing personal ranking:', error);
    throw error;
  }
};

/**
 * Get the currently published personal ranking
 * @returns {Object|null} The published ranking or null if none exists
 */
export const getPublishedPersonalRanking = async () => {
  try {
    const q = query(
      personalRankingArchivesRef,
      where('isPublished', '==', true),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching published personal ranking:', error);
    throw error;
  }
};

/**
 * Save current personal rankings and auto-archive the previous version
 * This is the main function for the unified personal ranking system
 * @param {Array} rankings - The current ranking data
 * @param {string} notes - Optional notes for this update
 * @returns {Object} Object with current ranking ID and archive ID
 */
export const saveCurrentPersonalRankings = async (rankings, notes = '') => {
  try {
    // Get the current rankings to archive them first
    const currentRanking = await getCurrentPersonalRanking();
    let archiveId = null;

    // If there are existing rankings, archive them
    if (currentRanking && currentRanking.rankings?.length > 0) {
      archiveId = await savePersonalRankingArchive(
        currentRanking.rankings,
        `Auto-archived on ${new Date().toLocaleString()}`
      );
    }

    // Update or create the current ranking
    const now = new Date();
    const rankingData = {
      rankings: rankings || [],
      notes,
      updatedAt: serverTimestamp(),
      timestamp: now.toISOString(),
      isCurrent: true,
    };

    let currentId;
    if (currentRanking) {
      // Update existing current ranking
      const currentRef = doc(db, 'personalRankingArchives', currentRanking.id);
      await updateDoc(currentRef, rankingData);
      currentId = currentRanking.id;
    } else {
      // Create new current ranking
      const currentRef = await addDoc(personalRankingArchivesRef, {
        ...rankingData,
        createdAt: serverTimestamp(),
      });
      currentId = currentRef.id;
    }

    return { currentId, archiveId };
  } catch (error) {
    console.error('Error saving current personal rankings:', error);
    throw error;
  }
};

/**
 * Update current personal rankings without creating an archive
 * Use this for lightweight updates like notes changes
 * @param {Array} rankings - The updated ranking data
 * @returns {string} The ID of the updated current ranking
 */
export const updateCurrentPersonalRankings = async (rankings) => {
  try {
    const currentRanking = await getCurrentPersonalRanking();

    if (!currentRanking) {
      // If no current ranking exists, create one
      return await saveCurrentPersonalRankings(rankings, '');
    }

    // Update the existing current ranking without archiving
    const now = new Date();
    const rankingData = {
      rankings: rankings || [],
      notes: currentRanking.notes || '', // Preserve existing notes
      updatedAt: serverTimestamp(),
      timestamp: now.toISOString(),
      isCurrent: true,
    };

    const currentRef = doc(db, 'personalRankingArchives', currentRanking.id);
    await updateDoc(currentRef, rankingData);

    return currentRanking.id;
  } catch (error) {
    console.error('Error updating current personal rankings:', error);
    throw error;
  }
};

/**
 * Get the current (most recent) personal ranking
 * @returns {Object|null} The current ranking or null if none exists
 */
export const getCurrentPersonalRanking = async () => {
  try {
    const q = query(
      personalRankingArchivesRef,
      where('isCurrent', '==', true),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching current personal ranking:', error);
    throw error;
  }
};

/**
 * Get all archived personal rankings (excluding the current one)
 * @returns {Array} Array of archived rankings ordered by date (newest first)
 */
export const getArchivedPersonalRankings = async () => {
  try {
    // Get all archives, then filter out the current one in JavaScript
    const q = query(personalRankingArchivesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((archive) => !archive.isCurrent); // Filter out current rankings in JavaScript
  } catch (error) {
    console.error('Error fetching archived personal rankings:', error);
    throw error;
  }
};

/**
 * Delete a personal ranking archive by ID
 * @param {string} archiveId - The ID of the archive to delete
 * @returns {boolean} Success status
 */
export const deletePersonalRankingArchive = async (archiveId) => {
  try {
    const archiveRef = doc(db, 'personalRankingArchives', archiveId);
    await deleteDoc(archiveRef);
    return true;
  } catch (error) {
    console.error('Error deleting personal ranking archive:', error);
    throw error;
  }
};

/**
 * Delete all personal ranking archives (keeping current ranking)
 * WARNING: This will delete all archive history!
 * @returns {number} Number of archives deleted
 */
export const deleteAllPersonalRankingArchives = async () => {
  try {
    const archives = await getArchivedPersonalRankings();

    for (const archive of archives) {
      await deletePersonalRankingArchive(archive.id);
    }

    return archives.length;
  } catch (error) {
    console.error('Error deleting all personal ranking archives:', error);
    throw error;
  }
};
