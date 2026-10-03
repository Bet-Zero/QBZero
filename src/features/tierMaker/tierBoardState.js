// src/features/tierMaker/tierBoardState.js
// Pure helpers for the tier maker board's tier layout. Kept out of the
// component so the rules (Pool is always last, names are unique) are testable.

export const POOL = 'Pool';
export const DEFAULT_TIERS = ['S', 'A', 'B', 'C', 'D'];

export const emptyBoard = (poolPlayers = []) => {
  const tiers = {};
  DEFAULT_TIERS.forEach((t) => {
    tiers[t] = [];
  });
  tiers[POOL] = [...poolPlayers];
  return { tiers, tierOrder: [...DEFAULT_TIERS, POOL] };
};

// Turns a saved tier list ({ tiers: { name: [ids] }, tierOrder }) into board
// state. Unknown player ids are dropped; every tier key ends up in the order;
// Pool always exists and comes last. A list with no tiers yet (freshly
// created) gets the default S–D layout.
export const boardFromSaved = (saved, toPlayer) => {
  const savedTiers = saved?.tiers || {};
  const tierNames = Object.keys(savedTiers);
  if (tierNames.length === 0) return emptyBoard();

  const tiers = {};
  tierNames.forEach((name) => {
    tiers[name] = (savedTiers[name] || []).map(toPlayer).filter(Boolean);
  });
  if (!tiers[POOL]) tiers[POOL] = [];

  const order = (saved.tierOrder || []).filter(
    (name, i, arr) => name !== POOL && tiers[name] && arr.indexOf(name) === i
  );
  tierNames.forEach((name) => {
    if (name !== POOL && !order.includes(name)) order.push(name);
  });
  return { tiers, tierOrder: [...order, POOL] };
};

// Returns the trimmed name if it can be used for a tier, or an error message.
export const validateTierName = (rawName, tierOrder, currentName = null) => {
  const name = (rawName || '').trim();
  if (!name) return { error: null, name: null };
  if (name === currentName) return { error: null, name: null };
  if (name.toLowerCase() === POOL.toLowerCase())
    return { error: `"${POOL}" is reserved.`, name: null };
  if (tierOrder.some((t) => t === name))
    return { error: `A tier named "${name}" already exists.`, name: null };
  return { error: null, name };
};

export const canMove = (tierOrder, tier, direction) => {
  const index = tierOrder.indexOf(tier);
  if (index === -1) return false;
  return direction === 'up' ? index > 0 : index < tierOrder.length - 1;
};
