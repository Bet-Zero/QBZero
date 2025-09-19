// Cleanup script to delete all personal ranking archives
// This will keep your current ranking but delete all test archives
// One time script, keeping just in case I need it again

import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  deleteDoc,
} from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const personalRankingArchivesRef = collection(db, 'personalRankingArchives');

// Get archived rankings (excluding current)
const getArchivedPersonalRankings = async () => {
  const q = query(personalRankingArchivesRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((archive) => !archive.isCurrent);
};

// Delete a single archive
const deletePersonalRankingArchive = async (archiveId) => {
  const archiveRef = doc(db, 'personalRankingArchives', archiveId);
  await deleteDoc(archiveRef);
  return true;
};

// Delete all archives
const deleteAllPersonalRankingArchives = async () => {
  const archives = await getArchivedPersonalRankings();

  for (const archive of archives) {
    await deletePersonalRankingArchive(archive.id);
  }

  return archives.length;
};

const cleanup = async () => {
  try {
    console.log('🔍 Checking existing archives...');

    // First, let's see what we have
    const archives = await getArchivedPersonalRankings();
    console.log(`Found ${archives.length} archive(s) to delete:`);

    archives.forEach((archive, index) => {
      const date = new Date(archive.timestamp).toLocaleString();
      console.log(
        `  ${index + 1}. Archive #${archive.snapshotNumber || 'Unknown'} - ${date} (${archive.rankings?.length || 0} QBs)`
      );
    });

    if (archives.length === 0) {
      console.log("✅ No archives found to delete. You're all clean!");
      return;
    }

    console.log('\n🗑️  Deleting archives...');
    const deletedCount = await deleteAllPersonalRankingArchives();

    console.log(`✅ Successfully deleted ${deletedCount} archive(s)!`);
    console.log('📝 Your current ranking was preserved.');
    console.log('\nYou can now start fresh with your official rankings! 🎉');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

// Run the cleanup
cleanup();
