// populateQBs.js - Script to populate Firestore with QB data
//
//   node scripts/checkRoster.js      validate the list first (no credentials)
//   node populateQBs.js --dry-run    report what would change, write nothing
//   node populateQBs.js              apply it
//
// Existing saved data always wins over the defaults here, so re-running is
// safe: grades, roles and blurbs survive. Only the curated fields -- name,
// team, position -- are refreshed from the list.
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
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

const DRY_RUN = process.argv.includes('--dry-run');

async function populateQBs() {
  console.log(
    `${DRY_RUN ? '[dry run] ' : ''}Processing ${quarterbacks.length} quarterbacks...`
  );

  const created = [];
  const movedTeam = [];
  const renamed = [];
  const unchanged = [];

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

      // Classify before writing so a dry run can report the same thing.
      if (!docSnap.exists()) {
        created.push(`${qb.name} (${qb.team})`);
      } else {
        const wasTeam = existing.bio?.Team;
        const wasName = existing.display_name;
        if (wasTeam && wasTeam !== qb.team) {
          movedTeam.push(`${qb.name}: ${wasTeam} -> ${qb.team}`);
        }
        if (wasName && wasName !== qb.name) {
          renamed.push(`${wasName} -> ${qb.name}`);
        }
        if (
          (!wasTeam || wasTeam === qb.team) &&
          (!wasName || wasName === qb.name)
        ) {
          unchanged.push(qb.name);
        }
      }

      if (!DRY_RUN) {
        await setDoc(docRef, qbData, { merge: true });
      }
    } catch (error) {
      console.error(`✗ Error processing ${qb.name}:`, error);
    }
  }

  const report = (label, items) => {
    if (items.length === 0) return;
    console.log(`\n${label} (${items.length}):`);
    items.forEach((item) => console.log(`  ${item}`));
  };

  report('Created', created);
  report('Changed team', movedTeam);
  report('Renamed', renamed);
  console.log(`\nUnchanged: ${unchanged.length}`);

  // Anyone saved but no longer on the list. They are not deleted -- grades and
  // past rankings depend on them -- but they are worth knowing about: a
  // quarterback who left the league belongs on the list marked retired, not
  // removed from it.
  try {
    const saved = await getDocs(collection(db, 'players'));
    const listed = new Set(quarterbacks.map((qb) => qb.id));
    const orphans = saved.docs.map((d) => d.id).filter((id) => !listed.has(id));
    if (orphans.length > 0) {
      console.log(
        `\nSaved but not on the list (${orphans.length}): ${orphans.join(', ')}`
      );
      console.log(
        '  Left untouched. Put them back on the list and mark them retired on ' +
          'their profile if they should still be rankable for past seasons.'
      );
    }
  } catch (error) {
    console.warn(
      '\nCould not check for saved players not on the list:',
      error.message
    );
  }

  console.log(
    DRY_RUN
      ? '\n[dry run] Nothing was written. Re-run without --dry-run to apply.'
      : '\nDone.'
  );
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateQBs().catch(console.error);
}

export { populateQBs };
