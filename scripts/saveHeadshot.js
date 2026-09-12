// scripts/saveHeadshot.js — save one headshot by hand.
//
//   node scripts/saveHeadshot.js <id> <url-or-file>
//
// refreshHeadshots.js covers everyone ESPN has a photo for. This is for the
// ones it cannot: undrafted rookies, practice-squad arms and the long retired,
// who have a profile but no published headshot. Point it at any image -- a URL
// or a file you saved -- and it applies the same treatment as the bulk script,
// so the result matches the other files instead of being a stray shape.
//
// The id must already be in quarterbacks.js. A headshot whose id is not on the
// list is an orphan, and tests/quarterbackRoster.test.js fails the build on
// one, so refusing here turns a typo into an error message rather than a red
// suite ten minutes later.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { quarterbacks } from '../src/features/ranker/quarterbacks.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const headshotDir = path.join(here, '..', 'public', 'assets', 'headshots');

async function readSource(source) {
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
    return Buffer.from(await res.arrayBuffer());
  }
  if (!fs.existsSync(source)) throw new Error(`no such file: ${source}`);
  return fs.readFileSync(source);
}

// Same two-pass treatment as refreshHeadshots.js: pad to a transparent square,
// then resize, each pass starting a fresh Sharp instance.
async function squareAndSave(buffer, destPath) {
  const { width, height } = await sharp(buffer).metadata();
  if (!width || !height) throw new Error('not a readable image');
  const side = Math.max(width, height);

  const squared = await sharp(buffer)
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

  fs.writeFileSync(destPath, await sharp(squared).resize(400, 400).png().toBuffer());
  return { width, height };
}

async function saveHeadshot(id, source) {
  const qb = quarterbacks.find((entry) => entry.id === id);
  if (!qb) {
    throw new Error(
      `"${id}" is not in quarterbacks.js. Add the quarterback to the list ` +
        'first -- a headshot with no list entry fails the test suite.'
    );
  }

  const destPath = path.join(headshotDir, `${id}.png`);
  const buffer = await readSource(source);
  const { width, height } = await squareAndSave(buffer, destPath);

  console.log(
    `Saved ${qb.name} (${qb.team}) -> public/assets/headshots/${id}.png ` +
      `[${width}x${height} source, 400x400 written]`
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [id, source] = process.argv.slice(2);
  if (!id || !source) {
    console.error('Usage: node scripts/saveHeadshot.js <id> <url-or-file>');
    process.exit(1);
  }
  saveHeadshot(id, source).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

export { saveHeadshot };
