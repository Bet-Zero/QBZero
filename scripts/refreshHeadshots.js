// scripts/refreshHeadshots.js
//
// Pulls a current headshot for every quarterback in quarterbacks.js from
// ESPN's public roster data, crops it to a transparent square, resizes it to
// 400x400 to match the existing files, and saves it to
// public/assets/headshots/{id}.png. Needs no credentials -- just network
// access to ESPN's public site API.
//
//   node scripts/refreshHeadshots.js            refresh every quarterback
//   node scripts/refreshHeadshots.js --dry-run  report matches, write nothing
//
// Run this whenever quarterbacks.js changes. A new entry has no photo yet,
// and anyone who changed teams still shows their old team's jersey until
// this runs -- an id existing in public/assets/headshots/ does not mean the
// photo behind it is current.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { quarterbacks } from '../src/features/ranker/quarterbacks.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const headshotDir = path.join(here, '..', 'public', 'assets', 'headshots');

const DRY_RUN = process.argv.includes('--dry-run');

// ESPN's roster endpoint takes its own team slugs, not our abbreviations --
// mostly the same string lowercased, except Washington.
const ESPN_TEAM_SLUGS = {
  ARI: 'ari',
  ATL: 'atl',
  BAL: 'bal',
  BUF: 'buf',
  CAR: 'car',
  CHI: 'chi',
  CIN: 'cin',
  CLE: 'cle',
  DAL: 'dal',
  DEN: 'den',
  DET: 'det',
  GB: 'gb',
  HOU: 'hou',
  IND: 'ind',
  JAX: 'jax',
  KC: 'kc',
  LAC: 'lac',
  LAR: 'lar',
  LV: 'lv',
  MIA: 'mia',
  MIN: 'min',
  NE: 'ne',
  NO: 'no',
  NYG: 'nyg',
  NYJ: 'nyj',
  PHI: 'phi',
  PIT: 'pit',
  SEA: 'sea',
  SF: 'sf',
  TB: 'tb',
  TEN: 'ten',
  WAS: 'wsh',
};

const HEADERS = { 'User-Agent': 'Mozilla/5.0' };

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[.']/g, '')
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

// name -> [{ team, url }], since two quarterbacks can share a normalized
// name and the same quarterback's own team should win the match.
async function fetchRosterHeadshots() {
  const byName = new Map();

  for (const [team, slug] of Object.entries(ESPN_TEAM_SLUGS)) {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${slug}/roster`
    );
    if (!res.ok) {
      console.warn(`  could not fetch ${team} roster: ${res.status}`);
      continue;
    }
    const data = await res.json();
    for (const group of data.athletes || []) {
      for (const athlete of group.items || []) {
        if (athlete.position?.abbreviation !== 'QB') continue;
        const url = athlete.headshot?.href;
        if (!url) continue;
        const key = normalizeName(athlete.fullName || '');
        if (!byName.has(key)) byName.set(key, []);
        byName.get(key).push({ team, url });
      }
    }
  }

  return byName;
}

// Fallback for anyone not on a current 32-team roster -- retired, released,
// or otherwise off a depth chart, but still worth a real photo.
async function searchHeadshot(name) {
  const res = await fetch(
    `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(name)}&limit=5`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const players = data.results?.find((r) => r.type === 'player');
  const match = players?.contents?.find(
    (c) => c.defaultLeagueSlug === 'nfl' && c.image?.default
  );
  return match?.image?.default || null;
}

async function squareAndSave(url, destPath) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const { width, height } = await sharp(buffer).metadata();
  const side = Math.max(width, height);

  // Extend and resize in separate passes, each starting a fresh Sharp
  // instance from the previous step's buffer -- chaining .extend() then
  // .resize() straight off the same instance used for .metadata() silently
  // resizes to the wrong aspect ratio (a sharp quirk, not intentional).
  const squareBuffer = await sharp(buffer)
    .ensureAlpha()
    .extend({
      top: Math.floor((side - height) / 2),
      bottom: Math.ceil((side - height) / 2),
      left: Math.floor((side - width) / 2),
      right: Math.ceil((side - width) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const resized = await sharp(squareBuffer).resize(400, 400).png().toBuffer();

  fs.writeFileSync(destPath, resized);
}

async function refreshHeadshots() {
  console.log(
    `${DRY_RUN ? '[dry run] ' : ''}Fetching current rosters from ESPN...`
  );
  const rosterHeadshots = await fetchRosterHeadshots();

  const updated = [];
  const noPhoto = [];
  const failed = [];

  for (const qb of quarterbacks) {
    const key = normalizeName(qb.name);
    const matches = rosterHeadshots.get(key);
    const sameTeamMatch = matches?.find((m) => m.team === qb.team);
    let url = (sameTeamMatch || matches?.[0])?.url;

    if (!url) {
      url = await searchHeadshot(qb.name);
    }

    if (!url) {
      noPhoto.push(qb.name);
      continue;
    }

    if (DRY_RUN) {
      updated.push(qb.name);
      continue;
    }

    try {
      await squareAndSave(url, path.join(headshotDir, `${qb.id}.png`));
      updated.push(qb.name);
    } catch (error) {
      failed.push(`${qb.name}: ${error.message}`);
    }
  }

  console.log(`\n${DRY_RUN ? 'Would update' : 'Updated'} (${updated.length}):`);
  updated.forEach((name) => console.log(`  ${name}`));

  if (noPhoto.length > 0) {
    console.log(`\nNo photo found anywhere on ESPN (${noPhoto.length}):`);
    noPhoto.forEach((name) => console.log(`  ${name}`));
    console.log('  Falls back to default.png until one is added by hand.');
  }

  if (failed.length > 0) {
    console.log(`\nFailed (${failed.length}):`);
    failed.forEach((line) => console.log(`  ${line}`));
  }

  console.log(DRY_RUN ? '\n[dry run] Nothing was written.' : '\nDone.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  refreshHeadshots().catch(console.error);
}

export { refreshHeadshots };
