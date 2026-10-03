// scripts/headshotFraming.js
//
// How a source photo becomes a file in public/assets/headshots/: a 400x400
// PNG the player fills, edge to edge, with his shoulders running off the
// bottom of the frame. Shared by refreshHeadshots.js and saveHeadshot.js so
// the two cannot drift apart.
//
// The square is cropped out of the photo, never padded around it. ESPN's
// headshots are landscape (600x436), and padding one to a square leaves the
// player a band of empty space above and below -- inside a square frame he
// comes out small, floating, and cut off mid-chest well above the bottom
// edge. That is what the September 2026 refresh did to every file. The
// original files were a centered square crop, and so is this.
import sharp from 'sharp';

export const HEADSHOT_SIZE = 400;

// `position: 'top'` centres a landscape photo horizontally (the only axis
// cropped), and keeps the head of a portrait one instead of cutting it off.
//
// Saved as an 8-bit palette PNG, as the 2025 originals were. Full 32-bit
// RGBA averages ~200KB a file and is why headshots visibly "load in"; the
// palette version is ~50KB and indistinguishable at the sizes the site shows.
export async function frameHeadshot(buffer) {
  return sharp(buffer)
    .ensureAlpha()
    .resize(HEADSHOT_SIZE, HEADSHOT_SIZE, { fit: 'cover', position: 'top' })
    .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })
    .toBuffer();
}
