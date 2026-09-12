// scripts/checkRoster.js — validate the curated quarterback list.
//
// Run before populateQBs.js. It needs no credentials and touches nothing, so
// it is safe to run any time:
//
//   npm run check-roster
//
// The annual roster update is a hand edit to src/features/ranker/quarterbacks.js,
// and the failure modes are all quiet ones: a typo'd team abbreviation shows a
// default logo, a duplicate id makes one quarterback overwrite another, and a
// missing headshot renders as a broken image. None of them announce themselves,
// so check for them here rather than finding out in production.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { quarterbacks } from '../src/features/ranker/quarterbacks.js';
import { TEAM_LOGO_MAP } from '../src/utils/formatting/teamLogos.js';
import { slugifyPlayerName } from '../src/utils/formatting/playerSlug.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const headshotDir = path.join(here, '..', 'public', 'assets', 'headshots');

const VALID_TEAMS = Object.keys(TEAM_LOGO_MAP).filter((key) =>
  /^[A-Z]{2,3}$/.test(key)
);

const problems = [];
const warnings = [];

// Duplicate ids: the id is the Firestore document id, so two entries sharing
// one means the second silently overwrites the first.
const seen = new Map();
quarterbacks.forEach((qb, index) => {
  if (seen.has(qb.id)) {
    problems.push(
      `duplicate id "${qb.id}" (entries ${seen.get(qb.id) + 1} and ${index + 1})`
    );
  }
  seen.set(qb.id, index);
});

quarterbacks.forEach((qb, index) => {
  const where = `entry ${index + 1} (${qb.name || 'unnamed'})`;

  if (!qb.id) problems.push(`${where}: no id`);
  if (!qb.name) problems.push(`${where}: no name`);

  if (!qb.team) {
    problems.push(`${where}: no team`);
  } else if (!VALID_TEAMS.includes(qb.team)) {
    problems.push(
      `${where}: "${qb.team}" is not a team abbreviation. ` +
        `Expected one of: ${VALID_TEAMS.join(', ')}`
    );
  }

  // The id is derived from the name everywhere it is used, so a mismatch means
  // the headshot path and the document id disagree with the display name.
  if (qb.id && qb.name) {
    const expected = slugifyPlayerName(qb.name);
    if (qb.id !== expected) {
      warnings.push(
        `${where}: id "${qb.id}" is not the slug of the name ("${expected}"). ` +
          'Fine if deliberate — ids must never change once graded.'
      );
    }
  }

  if (qb.id && fs.existsSync(headshotDir)) {
    if (!fs.existsSync(path.join(headshotDir, `${qb.id}.png`))) {
      warnings.push(
        `${where}: no headshot at public/assets/headshots/${qb.id}.png`
      );
    }
  }
});

// Headshots with nobody to belong to — usually a quarterback removed from the
// list, which should not happen: retire them instead so past rankings survive.
if (fs.existsSync(headshotDir)) {
  const ids = new Set(quarterbacks.map((qb) => qb.id));
  const orphans = fs
    .readdirSync(headshotDir)
    .filter((file) => file.endsWith('.png'))
    .map((file) => file.replace(/\.png$/, ''))
    .filter((id) => !ids.has(id) && id !== 'default');
  if (orphans.length > 0) {
    warnings.push(
      `headshots with no list entry: ${orphans.join(', ')}. ` +
        'If one of these retired, put them back on the list with ' +
        'status: RETIRED — removing them loses their grades.'
    );
  }
}

console.log(`Checked ${quarterbacks.length} quarterbacks.`);

const byTeam = {};
quarterbacks.forEach((qb) => {
  byTeam[qb.team] = (byTeam[qb.team] || 0) + 1;
});

const missing = VALID_TEAMS.filter((team) => !byTeam[team]);
if (missing.length > 0) {
  console.log(`\nTeams with nobody listed: ${missing.join(', ')}`);
} else {
  console.log('All 32 teams have at least one quarterback.');
}

if (warnings.length > 0) {
  console.log(`\n${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log(`  - ${w}`));
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}

console.log('\nNo problems.');
