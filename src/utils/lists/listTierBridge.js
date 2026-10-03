// src/utils/lists/listTierBridge.js
// Converts between the two ways the site stores tiers.
//
// A list (`lists` collection) keeps one flat `playerOrder` array where a tier
// break is an inline string `divider::<label>`; anything before the first
// divider is an unlabelled tier the list page shows as "Tier 1".
//
// A tier board (`tierLists` collection) keeps `tiers`, a map of label to an
// ordered array of player ids, plus `tierOrder`, with `Pool` last for players
// not yet placed.
//
// Both keep order within a tier, so the conversion is lossless apart from
// normalising labels: Firestore rejects empty map keys and keys shaped like
// `__name__`, and a board cannot hold two tiers with the same label (the list
// page names every new divider "New Tier").

import {
  isDivider,
  dividerLabel,
  makeDivider,
  mergeListOrder,
  playerIdsOf,
} from '@/utils/lists/listOrder';

export const POOL = 'Pool';
export const UNPLACED_LABEL = 'Unplaced';
export const DEFAULT_BOARD_TIERS = ['S', 'A', 'B', 'C', 'D'];

const isUsableLabel = (label) =>
  label.length > 0 && label !== POOL && !/^__.*__$/.test(label);

/** Makes each label a valid, unique tier key, keeping the original order. */
export const uniqueTierLabels = (labels) => {
  const used = new Set();
  return labels.map((raw, idx) => {
    const trimmed = (raw || '').trim();
    const base = isUsableLabel(trimmed) ? trimmed : `Tier ${idx + 1}`;
    let label = base;
    let n = 2;
    while (used.has(label)) {
      label = `${base} ${n}`;
      n += 1;
    }
    used.add(label);
    return label;
  });
};

/**
 * Turns a list into tier board data.
 *
 * A list with dividers keeps its tiers. A list without them has nothing to
 * map, so its players start in the Pool under the default S–D tiers, in list
 * order, ready to be sorted.
 */
export const listToTierBoard = (list) => {
  const order = mergeListOrder(list);
  const groups = [];
  let current = null;

  order.forEach((item) => {
    if (isDivider(item)) {
      current = { label: dividerLabel(item), ids: [] };
      groups.push(current);
    } else {
      if (!current) {
        current = { label: '', ids: [] };
        groups.push(current);
      }
      current.ids.push(item);
    }
  });

  const hasDividers = order.some(isDivider);
  if (!hasDividers) {
    const tiers = Object.fromEntries(DEFAULT_BOARD_TIERS.map((t) => [t, []]));
    tiers[POOL] = groups[0]?.ids || [];
    return { tiers, tierOrder: [...DEFAULT_BOARD_TIERS, POOL] };
  }

  const labels = uniqueTierLabels(groups.map((g) => g.label));
  const tiers = {};
  groups.forEach((g, idx) => {
    tiers[labels[idx]] = g.ids;
  });
  tiers[POOL] = [];
  return { tiers, tierOrder: [...labels, POOL] };
};

/**
 * Turns tier board data into a list's `playerOrder` and `playerIds`.
 *
 * Every tier becomes a divider, empty ones included, so the list shows the
 * same tiers. Players still in the Pool go last under an "Unplaced" divider
 * rather than being dropped, so sending a board back never removes anyone
 * from the list. A player that somehow sits in two tiers keeps the first.
 */
export const tierBoardToList = ({ tiers = {}, tierOrder = [] } = {}) => {
  const order = [
    ...tierOrder.filter((t) => t !== POOL && tiers[t]),
    ...Object.keys(tiers).filter((t) => t !== POOL && !tierOrder.includes(t)),
  ];
  const labels = uniqueTierLabels(order);
  const seen = new Set();
  const take = (ids = []) =>
    ids.filter((id) => {
      if (typeof id !== 'string' || !id || isDivider(id) || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });

  const playerOrder = [];
  order.forEach((tier, idx) => {
    playerOrder.push(makeDivider(labels[idx]));
    playerOrder.push(...take(tiers[tier]));
  });

  const pool = take(tiers[POOL]);
  if (pool.length) {
    const label = labels.includes(UNPLACED_LABEL)
      ? uniqueTierLabels([...labels, UNPLACED_LABEL]).at(-1)
      : UNPLACED_LABEL;
    playerOrder.push(makeDivider(label), ...pool);
  }

  return {
    playerOrder,
    playerIds: playerIdsOf(playerOrder),
  };
};

/** Keeps the notes of players still on the list, dropping the rest. */
export const keepNotesFor = (notes = {}, playerIds = []) => {
  const keep = new Set(playerIds);
  return Object.fromEntries(
    Object.entries(notes).filter(([id]) => keep.has(id))
  );
};
