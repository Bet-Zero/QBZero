// @vitest-environment node
//
// Everything under public/assets is served as-is: nothing in the build
// resizes or compresses it. The ranker landing page drew five 1080x1350
// photos, 2.3MB together, as faint 192px decorations, and they visibly loaded
// in. Size an image for the box it is drawn in (2x for retina) before adding
// it. Headshots have their own, tighter budget in headshotFraming.test.js.
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const assetsDir = path.resolve(__dirname, '../public/assets');
const MAX_BYTES = 200 * 1024;

const listFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });

describe('the static images in public/assets', () => {
  it('are each under 200KB', () => {
    const heavy = listFiles(assetsDir)
      .filter((file) => fs.statSync(file).size > MAX_BYTES)
      .map((file) => path.relative(assetsDir, file));
    expect(heavy).toEqual([]);
  });
});
