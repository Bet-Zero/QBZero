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
//     what made movement indicators treat a re-added quarterback as new.
import { getAdminDb, projectId } from './firebaseAdmin.js';
import { quarterbacks } from '../src/features/ranker/quarterbacks.js';

const COLLECTIONS = [
  'players',
  'qbRankings',
  'personalRankingArchives',
  'lists',
  'tierLists',
  'rosterProjects',
  'takes',
  'takeAuthors',
  'admins',
];

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

run().catch((error) => {
  console.error('\nCheck failed:', error.message);
  process.exit(1);
});
