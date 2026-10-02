// @vitest-environment node
//
// Every headshot frame on the site (ranker, rankings board, table, profile)
// is a square with object-cover, which trusts the file to be framed already.
// The September 2026 refresh padded ESPN's landscape photos out to a square
// instead of cropping them, and nothing failed: every headshot just came out
// small, floating in empty space, cut off well above the bottom of its frame.
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { describe, it, expect } from 'vitest';
import { frameHeadshot, HEADSHOT_SIZE } from '../scripts/headshotFraming.js';

const headshotDir = path.resolve(__dirname, '../public/assets/headshots');

// Rows, top to bottom, that hold no visible pixel at all.
async function emptyRows(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const empty = [];
  for (let y = 0; y < info.height; y++) {
    let visible = false;
    for (let x = 0; x < info.width && !visible; x++) {
      visible = data[(y * info.width + x) * 4 + 3] > 0;
    }
    if (!visible) empty.push(y);
  }
  return { empty, width: info.width, height: info.height };
}

// ESPN's own shape: 600x436, opaque edge to edge.
const landscapePhoto = () =>
  sharp({
    create: {
      width: 600,
      height: 436,
      channels: 4,
      background: { r: 0, g: 80, b: 160, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

describe('frameHeadshot', () => {
  it('crops a landscape photo to a square it fills, not one it floats in', async () => {
    const framed = await frameHeadshot(await landscapePhoto());
    const { empty, width, height } = await emptyRows(framed);

    expect([width, height]).toEqual([HEADSHOT_SIZE, HEADSHOT_SIZE]);
    expect(empty).toEqual([]);
  });
});

describe('the headshots on disk', () => {
  // The shoulders run off the bottom edge in a properly framed photo, so the
  // last row always has something in it. A padded one ends in empty rows.
  it('all reach the bottom of their frame', async () => {
    const floating = [];
    for (const file of fs.readdirSync(headshotDir)) {
      if (!file.endsWith('.png')) continue;
      const { empty, height } = await emptyRows(
        fs.readFileSync(path.join(headshotDir, file))
      );
      if (empty.includes(height - 1)) floating.push(file);
    }
    expect(floating).toEqual([]);
  });
});
