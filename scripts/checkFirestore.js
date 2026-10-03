// Read-only check that the credentials work and the data is shaped as expected.
//
//   npm run check-firestore
//
// Writes nothing. Run it first after setting up a new key: a clear report here
// means the maintenance scripts will connect, and a clear error means the
// credential is the problem rather than the script.
//
// It also looks for two things the personal-rankings rewrite left questions
// about:
//
//   - a stray `isPublished` document, from a publish path that was deleted.
//     Queries ordered by createdAt cannot see it (Firestore skips documents
//     missing the ordering field), so the app can neither show nor delete one.
//   - board entries carrying a generated id rather than a roster id, which is
//     what made movement indicators treat a re-added quarterback as new
//
// And it reports what is actually filled in on the player documents, which
// settles a question the repository cannot answer about itself: populateQBs
// writes bio, stats and contract empty, and nothing tracked here fills them,
// but `.gitignore` excludes `updateStats.js` and friends by name. If stats
// come back populated, that local tooling works and is being run; if they are
// empty across the board, there is no ingestion path and the stat filters have
// nothing to filter on..
import { fileURLToPath } from 'url';
import { getAdminDb, projectId } from './firebaseAdmin.js';
import { quarterbacks } from '../src/features/ranker/quarterbacks.js';
import { QB_STATS } from '../src/constants/stats.js';
import { QB_TRAITS } from '../src/constants/traits.js';
import { RETIRED } from '../src/constants/playerStatus.js';

const COLLECTIONS = [
  'players',
  'qbRankings',
  'personalRankingArchives',
  'lists',
  'tierLists',
  'rosterProjects',
  'takes',
  'takeAuthors',
  'qbwShelves',
  'admins',
];

const filled = (value) =>
  value !== null && value !== undefined && value !== '' && !Number.isNaN(value);

/**
 * What is actually filled in across the player documents.
 *
 * Pure so it can be tested without a credential -- the rest of this script
 * cannot be, and a miscount here would be reported as fact about the live
 * data.
 */
export const summarizePlayerDocs = (docs = []) => {
  const countWhere = (predicate) => docs.filter(predicate).length;
  const statFields = QB_STATS.map((stat) => stat.field);

  return {
    total: docs.length,
    retired: countWhere((doc) => doc.status === RETIRED),
    withStats: countWhere((doc) =>
      statFields.some((field) => filled(doc.system?.stats?.[field]))
    ),
    withBio: countWhere((doc) =>
      ['AGE', 'HT', 'WT', 'Years Pro'].some((field) => filled(doc.bio?.[field]))
    ),
    withContract: countWhere(
      (doc) => Object.keys(doc.contract || {}).length > 0
    ),
    graded: countWhere((doc) =>
      QB_TRAITS.some((trait) => filled(doc.traits?.[trait]))
    ),
    withOverall: countWhere((doc) => filled(doc.overall_grade)),
  };
};

const run = async () => {
  let db;
  try {
    db = getAdminDb();
    console.log(`Connected to Firebase project: ${projectId()}\n`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log('Collections');
  console.log('-----------');
  for (const name of COLLECTIONS) {
    try {
      const snapshot = await db.collection(name).count().get();
      console.log(`  ${name.padEnd(26)} ${snapshot.data().count} documents`);
    } catch (error) {
      console.log(
        `  ${name.padEnd(26)} could not read (${error.code || error.message})`
      );
    }
  }

  console.log('\nPlayer data');
  console.log('-----------');
  const players = await db.collection('players').get();
  const summary = summarizePlayerDocs(players.docs.map((doc) => doc.data()));

  console.log(`  documents           ${summary.total}`);
  console.log(`  curated list        ${quarterbacks.length}`);
  console.log(`  marked retired      ${summary.retired}`);
  console.log(`  box-score stats     ${summary.withStats}`);
  console.log(`  bio filled          ${summary.withBio}`);
  console.log(`  contract filled     ${summary.withContract}`);
  console.log(`  any trait graded    ${summary.graded}`);
  console.log(`  overall grade set   ${summary.withOverall}`);

  if (summary.total > 0 && summary.withStats === 0) {
    console.log(
      '\n  ! No player has box-score stats. Nothing in this repository fills\n' +
        '    them -- populateQBs writes system.stats empty -- so the stat\n' +
        '    filters and the profile stats table have nothing to show. If\n' +
        '    updateStats.js exists and works, it has not been run against this\n' +
        '    project.'
    );
  }

  console.log('\nPersonal rankings');
  console.log('-----------------');
  const archives = await db.collection('personalRankingArchives').get();
  const docs = archives.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const live = docs.filter((doc) => doc.isCurrent);
  const published = docs.filter((doc) => doc.isPublished);
  const snapshots = docs.filter((doc) => !doc.isCurrent && !doc.isPublished);
  const missingCreatedAt = docs.filter((doc) => !doc.createdAt);

  console.log(`  live board          ${live.length} (expected exactly 1)`);
  console.log(`  snapshots           ${snapshots.length}`);
  console.log(
    `  version             ${live[0]?.version ?? '— not set until the next save'}`
  );
  console.log(`  quarterbacks on it  ${live[0]?.rankings?.length ?? 0}`);

  if (published.length) {
    console.log(
      `\n  ! ${published.length} stray isPublished document(s) from the removed publish path:`
    );
    published.forEach((doc) => console.log(`      ${doc.id}`));
    console.log(
      '    Nothing reads these. Safe to delete from the Firebase console.'
    );
  } else {
    console.log('  stray published     none');
  }

  if (missingCreatedAt.length) {
    console.log(
      `\n  ! ${missingCreatedAt.length} document(s) with no createdAt -- ordered queries skip these:`
    );
    missingCreatedAt.forEach((doc) => console.log(`      ${doc.id}`));
  }

  const rosterIds = new Set(quarterbacks.map((qb) => qb.id));
  const entries = live[0]?.rankings || [];
  const unlinked = entries.filter(
    (entry) =>
      !rosterIds.has(entry.id) && !String(entry.id).startsWith('manual-')
  );

  if (unlinked.length) {
    console.log(
      `\n  ! ${unlinked.length} entr${unlinked.length === 1 ? 'y' : 'ies'} on the live board carry a generated id:`
    );
    unlinked.forEach((entry) =>
      console.log(`      ${entry.name} (${entry.id})`)
    );
    console.log(
      '    These predate the id fix. Movement treats them as new arrivals and\n' +
        '    their team will not follow a trade. Removing and re-adding each one\n' +
        '    from the QB pool relinks them.'
    );
  } else if (entries.length) {
    console.log('  entry ids           all linked to the roster');
  }

  console.log('\nDone. Nothing was written.');
};

// Guarded like the other scripts so the module can be imported for testing
// without connecting to anything.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error('\nCheck failed:', error.message);
    process.exit(1);
  });
}
