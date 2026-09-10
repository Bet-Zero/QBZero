// populateQBs.js - Script to populate Firestore with QB data
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { quarterbacks } from './src/features/ranker/quarterbacks.js';
import { emptyTraits } from './src/constants/traits.js';

// Firebase config (using environment variables)
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

async function populateQBs() {
  console.log(`Starting to populate ${quarterbacks.length} quarterbacks...`);

  for (const qb of quarterbacks) {
    try {
      const docRef = doc(db, 'players', qb.id);

      // Check if document already exists
      const docSnap = await getDoc(docRef);

      const existing = docSnap.exists() ? docSnap.data() : {};

      // Basic QB data structure matching what the components expect
      const qbData = {
        traits: emptyTraits(),
        roles: {
          offense1: '',
          offense2: '',
          style1: '',
          style2: '',
        },
        subRoles: {
          offense: [],
        },
        badges: [],
        blurbs: {
          traits: {},
          roles: {},
          subroles: {},
          throwingProfile: '',
          playStyle: '',
          overall: '',
        },
        throwingProfile: '',
        system: {
          stats: {},
        },
        contract: {},
        contract_summary: {},
        overall_grade: null,
        status: 'active',
        // Anything already saved wins over the defaults above.
        ...existing,
        // Always refreshed from the curated list. bio is merged by hand: these
        // were written as 'bio.Team' and 'bio.Position', but setDoc does not
        // read dotted keys as paths the way updateDoc does, so they landed as
        // top-level fields with dots in their names and the real bio was never
        // updated -- leaving a moved quarterback on last year's team forever.
        player_id: qb.id,
        display_name: qb.name,
        bio: {
          AGE: null,
          HT: null,
          WT: null,
          'Years Pro': null,
          ...(existing.bio || {}),
          Team: qb.team,
          Position: 'QB',
        },
      };

      await setDoc(docRef, qbData, { merge: true });
      console.log(
        `✓ ${qb.name} (${qb.team}) ${docSnap.exists() ? 'updated' : 'created'}`
      );
    } catch (error) {
      console.error(`✗ Error processing ${qb.name}:`, error);
    }
  }

  console.log('Finished populating quarterbacks!');
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateQBs().catch(console.error);
}

export { populateQBs };
