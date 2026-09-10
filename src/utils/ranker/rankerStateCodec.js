// 📁 src/utils/ranker/rankerStateCodec.js
//
// Compact, URL-safe encoding of a ranker session for shareable links.
//
// The naive encoding (base64 of the raw state object) produced ~14.8 KB of
// query string for a finished 42-QB session, which exceeds the ~8 KB request
// line most servers and CDNs accept. This encodes the player pool once as
// [id, name, team] tuples and refers to players by index everywhere else,
// which brings a full session under ~4 KB.

const VERSION = 1;

// Rough ceiling for the encoded payload. Well under the ~8 KB request-line
// limit once the origin and path are added.
export const MAX_ENCODED_LENGTH = 6000;

const toBase64Url = (str) => {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const fromBase64Url = (encoded) => {
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

/**
 * Encode ranker state for a URL. Returns '' if the state cannot be encoded.
 */
export const encodeRankerState = ({
  playerPool = [],
  setupData = null,
  comparisonResults = [],
  finalRanking = [],
} = {}) => {
  try {
    const indexById = new Map(playerPool.map((p, i) => [p.id, i]));
    const idx = (id) => (indexById.has(id) ? indexById.get(id) : -1);

    const payload = {
      v: VERSION,
      p: playerPool.map((p) => [
        p.id,
        p.display_name || p.name || '',
        p.team || '',
      ]),
      // Flat [winnerIdx, loserIdx, ...] pairs.
      c: comparisonResults.flatMap((c) => [idx(c.winner), idx(c.loser)]),
      r: finalRanking.map((p) => idx(p.id)),
      s: setupData
        ? {
            t: (setupData.topTier || []).map(idx),
            b: (setupData.bottomTier || []).map(idx),
            a: idx(setupData.anchor),
            f: idx(setupData.firstPlace),
            l: idx(setupData.lastPlace),
          }
        : null,
    };

    return toBase64Url(JSON.stringify(payload));
  } catch {
    return '';
  }
};

/**
 * Decode ranker state from a URL parameter. Returns null when the parameter is
 * missing, corrupted, or from an unrecognised version. Players referenced by an
 * index outside the encoded pool are dropped rather than surfaced as undefined.
 */
export const decodeRankerState = (encoded) => {
  if (!encoded) return null;

  let payload;
  try {
    payload = JSON.parse(fromBase64Url(encoded));
  } catch {
    return null;
  }

  if (!payload || payload.v !== VERSION || !Array.isArray(payload.p)) {
    return null;
  }

  const playerPool = payload.p
    .filter((entry) => Array.isArray(entry) && entry[0])
    .map(([id, name, team]) => ({ id, name, team }));

  const at = (i) =>
    Number.isInteger(i) && i >= 0 && i < playerPool.length
      ? playerPool[i]
      : null;

  const comparisonResults = [];
  const flat = Array.isArray(payload.c) ? payload.c : [];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    const winner = at(flat[i]);
    const loser = at(flat[i + 1]);
    if (winner && loser) {
      comparisonResults.push({ winner: winner.id, loser: loser.id });
    }
  }

  const finalRanking = (Array.isArray(payload.r) ? payload.r : [])
    .map(at)
    .filter(Boolean);

  const ids = (list) =>
    (Array.isArray(list) ? list : [])
      .map(at)
      .filter(Boolean)
      .map((p) => p.id);
  const id = (i) => at(i)?.id ?? null;

  const setupData = payload.s
    ? {
        topTier: ids(payload.s.t),
        bottomTier: ids(payload.s.b),
        anchor: id(payload.s.a),
        firstPlace: id(payload.s.f),
        lastPlace: id(payload.s.l),
      }
    : null;

  return { playerPool, setupData, comparisonResults, finalRanking };
};
