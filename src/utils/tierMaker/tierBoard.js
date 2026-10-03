// Pure state helpers for the tier maker board.
//
// A saved tier list is `{ tiers: { [tierName]: playerId[] }, tierOrder }`.
// Firestore does not keep map key order, so `tierOrder` is the only record of
// which tier sits where; `tiers` and `tierOrder` must therefore always name the
// same set of tiers, with the pool last.

export const POOL = 'Pool';
export const DEFAULT_TIERS = ['S', 'A', 'B', 'C', 'D'];

const idOf = (player) => player?.player_id || player?.id;

// Drawer rows are a filtered/lowercased view of the player with the full
// record kept under `original`; tiles need the full record (bio, display name).
export const toBoardPlayer = (player) => {
  const base = player?.original || player;
  return { ...base, player_id: idOf(base) };
};

export const createEmptyBoard = (poolPlayers = []) => ({
  tiers: [...DEFAULT_TIERS, POOL].reduce((acc, tier) => {
    acc[tier] = tier === POOL ? poolPlayers.map(toBoardPlayer) : [];
    return acc;
  }, {}),
  tierOrder: [...DEFAULT_TIERS, POOL],
  unresolved: {},
});

/**
 * Turn a saved tier list document into board state.
 *
 * - A brand-new list (`tiers: {}`) gets the default tiers and an empty pool.
 * - Every tier in `tiers` appears in the order and vice versa; the pool is
 *   always present and always last.
 * - A player listed twice keeps only their first (highest) placement.
 * - Ids with no matching player are kept aside in `unresolved` so saving the
 *   board does not silently erase them.
 */
export const boardFromSaved = (data, playersMap = {}) => {
  const savedTiers = data?.tiers || {};
  const savedOrder = Array.isArray(data?.tierOrder) ? data.tierOrder : [];

  if (!Object.keys(savedTiers).length && !savedOrder.length) {
    return createEmptyBoard();
  }

  const order = [];
  [...savedOrder, ...Object.keys(savedTiers)].forEach((tier) => {
    if (tier !== POOL && !order.includes(tier)) order.push(tier);
  });
  order.push(POOL);

  const seen = new Set();
  const tiers = {};
  const unresolved = {};
  order.forEach((tier) => {
    tiers[tier] = [];
    const ids = Array.isArray(savedTiers[tier]) ? savedTiers[tier] : [];
    ids.forEach((id) => {
      if (!id || seen.has(id)) return;
      seen.add(id);
      const player = playersMap[id];
      if (player) {
        tiers[tier].push(toBoardPlayer(player));
      } else {
        (unresolved[tier] ||= []).push(id);
      }
    });
  });

  return { tiers, tierOrder: order, unresolved };
};

/** Board state → the shape written to Firestore. */
export const boardToSaved = ({ tiers, tierOrder, unresolved = {} }) => {
  const order = tierOrder.filter((t) => t !== POOL);
  order.push(POOL);

  const saved = {};
  order.forEach((tier) => {
    saved[tier] = (tiers[tier] || []).map(idOf).filter(Boolean);
  });
  // Unknown ids go back where they were, or to the pool if that tier is gone.
  Object.entries(unresolved).forEach(([tier, ids]) => {
    const target = saved[tier] ? tier : POOL;
    ids.forEach((id) => {
      if (!saved[target].includes(id)) saved[target].push(id);
    });
  });

  return { tiers: saved, tierOrder: order };
};

/**
 * Check a proposed tier name. Returns `{ name }` (trimmed) or `{ error }`.
 * `current` is the tier being renamed, if any.
 */
export const validateTierName = (raw, tierOrder, current = null) => {
  const name = (raw || '').trim();
  if (!name) return { error: 'Tier name cannot be empty.' };
  if (name === current) return { name };
  if (name.toLowerCase() === POOL.toLowerCase())
    return { error: `"${POOL}" is reserved.` };
  if (tierOrder.some((t) => t !== current && t === name))
    return { error: `There is already a tier called "${name}".` };
  return { name };
};

export const addTier = (board, rawName) => {
  const { name, error } = validateTierName(rawName, board.tierOrder);
  if (error) return { error };
  const order = board.tierOrder.filter((t) => t !== POOL);
  return {
    board: {
      ...board,
      tiers: { ...board.tiers, [name]: [] },
      tierOrder: [...order, name, POOL],
    },
  };
};

export const renameTier = (board, tier, rawName) => {
  if (tier === POOL) return { error: `"${POOL}" cannot be renamed.` };
  const { name, error } = validateTierName(rawName, board.tierOrder, tier);
  if (error) return { error };
  if (name === tier) return { board };
  const { [tier]: players = [], ...rest } = board.tiers;
  const unresolved = { ...board.unresolved };
  if (unresolved[tier]) {
    unresolved[name] = unresolved[tier];
    delete unresolved[tier];
  }
  return {
    board: {
      tiers: { ...rest, [name]: players },
      tierOrder: board.tierOrder.map((t) => (t === tier ? name : t)),
      unresolved,
    },
  };
};

export const deleteTier = (board, tier) => {
  if (tier === POOL || !board.tierOrder.includes(tier)) return board;
  const { [tier]: removed = [], ...rest } = board.tiers;
  const unresolved = { ...board.unresolved };
  if (unresolved[tier]) {
    unresolved[POOL] = [...(unresolved[POOL] || []), ...unresolved[tier]];
    delete unresolved[tier];
  }
  return {
    tiers: { ...rest, [POOL]: [...(rest[POOL] || []), ...removed] },
    tierOrder: board.tierOrder.filter((t) => t !== tier),
    unresolved,
  };
};

/** Ids of every player placed anywhere on the board. */
export const boardPlayerIds = (tiers) => {
  const ids = new Set();
  Object.values(tiers).forEach((list) =>
    list.forEach((p) => ids.add(idOf(p)))
  );
  return ids;
};

/** Add players to the pool, skipping anyone already on the board. */
export const addToPool = (board, players) => {
  const onBoard = boardPlayerIds(board.tiers);
  const additions = [];
  players.forEach((p) => {
    const boardPlayer = toBoardPlayer(p);
    if (!boardPlayer.player_id || onBoard.has(boardPlayer.player_id)) return;
    onBoard.add(boardPlayer.player_id);
    additions.push(boardPlayer);
  });
  if (!additions.length) return board;
  return {
    ...board,
    tiers: {
      ...board.tiers,
      [POOL]: [...(board.tiers[POOL] || []), ...additions],
    },
  };
};

/** Stable fingerprint of what would be saved, for unsaved-change checks. */
export const boardSignature = (board) => JSON.stringify(boardToSaved(board));

/** Whether a player in `tier` can step one tier up or down. */
export const canMove = (tierOrder, tier, direction) => {
  const index = tierOrder.indexOf(tier);
  if (index === -1) return false;
  return direction === 'up' ? index > 0 : index < tierOrder.length - 1;
};
