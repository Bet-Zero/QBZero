// The quarterback trait set, in display order.
//
// This list used to be copied into every file that needed it, and the copies
// drifted: the profile pages were repurposed for quarterbacks while the player
// table and its filters kept the basketball traits they were forked with.
// filterPlayers ended up gating on `min_Throwing`, which the filter defaults
// never defined, so every comparison ran against `undefined` and the table
// filtered out every player. Import from here instead of writing it out again.
export const QB_TRAITS = [
  'Throwing',
  'Accuracy',
  'Decision',
  'Mobility',
  'Pocket',
  'IQ',
  'Leadership',
  'Durability',
];

export const QB_TRAIT_ABBREVIATIONS = {
  Throwing: 'arm',
  Accuracy: 'acc',
  Decision: 'dec',
  Mobility: 'mob',
  Pocket: 'pkt',
  IQ: 'iq',
  Leadership: 'ldr',
  Durability: 'dur',
};

// A { Throwing: 0, Accuracy: 0, ... } shape for empty player records.
export const emptyTraits = () =>
  Object.fromEntries(QB_TRAITS.map((trait) => [trait, 0]));
