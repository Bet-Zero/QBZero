// src/utils/lists/listOrder.js
// Pure helpers for a list document's ordering.
//
// A list stores two arrays: `playerOrder`, the display order, where a tier
// header is a string `divider::<label>`; and `playerIds`, the membership set
// that "Add to List" appends to. A player can be in `playerIds` without yet
// being in `playerOrder` (added from the table, never saved from the editor),
// so loading merges the two and saving writes both back.

export const DIVIDER_PREFIX = 'divider::';

export const isDivider = (item) =>
  typeof item === 'string' && item.startsWith(DIVIDER_PREFIX);

export const dividerLabel = (item) => item.slice(DIVIDER_PREFIX.length);

export const makeDivider = (label) => `${DIVIDER_PREFIX}${label}`;

// Insert an unnamed tier break before position `index` (order.length for the
// end). Unnamed breaks display as "Tier N" by position, so the numbering
// stays right however many are added.
export const insertDivider = (order, index) => {
  const at = Math.max(0, Math.min(index, order.length));
  return [...order.slice(0, at), makeDivider(''), ...order.slice(at)];
};

// Display order for a stored list: saved order first, then any member the
// order doesn't mention yet, each at most once.
export const mergeListOrder = (data = {}) => {
  const merged = [];
  const seen = new Set();
  const push = (id) => {
    if (typeof id !== 'string' || !id) return;
    if (!isDivider(id)) {
      if (seen.has(id)) return;
      seen.add(id);
    }
    merged.push(id);
  };
  (data.playerOrder || []).forEach(push);
  (data.playerIds || []).forEach(push);
  return merged;
};

export const playerIdsOf = (order) => order.filter((id) => !isDivider(id));

// Swap the item at `index` with its neighbour. `direction` is -1 or 1.
export const moveItem = (order, index, direction) => {
  const target = index + direction;
  if (index < 0 || index >= order.length) return order;
  if (target < 0 || target >= order.length) return order;
  const next = [...order];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export const removeItem = (order, index) => {
  if (index < 0 || index >= order.length) return order;
  return order.filter((_, i) => i !== index);
};

// Group the order into tiers. Each player keeps `index`, its position in the
// full order (what move/remove take), and `rankIndex`, its 0-based rank among
// players that still exist in `playersMap`. A player missing from the roster
// is kept, flagged `missing`, so it can be seen and removed, but takes no
// rank, so the numbers on screen match the numbers in an export.
export const buildTiers = (order, playersMap = {}) => {
  const result = [];
  let current = { label: '', headerIndex: null, players: [] };
  let rankIndex = 0;
  order.forEach((item, idx) => {
    if (isDivider(item)) {
      if (current.headerIndex !== null || current.players.length > 0) {
        result.push(current);
      }
      current = { label: dividerLabel(item), headerIndex: idx, players: [] };
    } else if (playersMap[item]) {
      current.players.push({ id: item, index: idx, rankIndex });
      rankIndex += 1;
    } else {
      current.players.push({
        id: item,
        index: idx,
        rankIndex: null,
        missing: true,
      });
    }
  });
  result.push(current);
  return result.filter((t) => t.headerIndex !== null || t.players.length > 0);
};

// Players in display order, ignoring tiers, each with its index in the full
// order so move/remove act on the right item even when dividers exist.
export const buildFlatPlayers = (order, playersMap = {}) =>
  order
    .map((id, index) => ({ id, index }))
    .filter(({ id }) => !isDivider(id))
    .map((p) => (playersMap[p.id] ? p : { ...p, missing: true }));

// Move within the flat (untiered) view: swap with the previous or next
// player, skipping over any dividers in between, so a tier header never
// changes position because of a player move it can't see.
export const movePlayerFlat = (order, index, direction) => {
  let target = index + direction;
  while (target >= 0 && target < order.length && isDivider(order[target])) {
    target += direction;
  }
  if (target < 0 || target >= order.length) return order;
  const next = [...order];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

// Move the player at `index` so it becomes rank `rank` (1-based) among
// players on the roster, landing in the tier of the player who holds that
// rank now: just before them when moving up, just after them when moving
// down. A rank past the end puts it right after the last player.
export const movePlayerToRank = (order, index, rank, playersMap = {}) => {
  const item = order[index];
  if (item === undefined || isDivider(item)) return order;
  const ranked = order
    .map((id, i) => ({ id, i }))
    .filter(({ id }) => !isDivider(id) && playersMap[id]);
  if (ranked.length < 2) return order;
  const current = ranked.findIndex(({ i }) => i === index);
  const target = Math.min(
    Math.max(1, Math.floor(rank) || 1) - 1,
    ranked.length - 1
  );
  if (current === target) return order;
  // A missing player has no rank; treat it as moving up.
  const movingDown = current !== -1 && target > current;
  const anchor = ranked[target].i;
  const rest = removeItem(order, index);
  const anchorInRest = anchor > index ? anchor - 1 : anchor;
  const insertAt = movingDown ? anchorInRest + 1 : anchorInRest;
  return [...rest.slice(0, insertAt), item, ...rest.slice(insertAt)];
};
