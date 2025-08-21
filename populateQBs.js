// populateQBs.js - Script to populate Firestore with QB data
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { quarterbacks } from './src/features/ranker/quarterbacks.js';

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
      
      // Basic QB data structure matching what the components expect
      const qbData = {
        player_id: qb.id,
        display_name: qb.name,
        bio: {
          Team: qb.team,
          Position: 'QB',
          AGE: null,
          HT: null,
          WT: null,
          'Years Pro': null,
        },
        traits: {
          Throwing: 0,
          Accuracy: 0,
          Decision: 0,
          Mobility: 0,
          Pocket: 0,
          IQ: 0,
          Leadership: 0,
          Durability: 0,
        },
        roles: {
          offense1: '',
          offense2: '',
          style1: '',
          style2: '',
          twoWay: 50,
        },
        subRoles: {
          offense: [],
          defense: [],
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
          stats: {}
        },
        contract: {},
        contract_summary: {},
        overall_grade: null,
        status: 'active',
        // Keep existing data if document exists
        ...(docSnap.exists() ? docSnap.data() : {}),
        // Always update these core fields
        player_id: qb.id,
        display_name: qb.name,
        'bio.Team': qb.team,
        'bio.Position': 'QB',
      };
      
      await setDoc(docRef, qbData, { merge: true });
      console.log(`✓ ${qb.name} (${qb.team}) ${docSnap.exists() ? 'updated' : 'created'}`);
      
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