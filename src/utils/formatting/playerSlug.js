// The id convention for quarterbacks: lowercase the name, drop periods and
// apostrophes, and join the rest with hyphens. "Aidan O'Connell" becomes
// "aidan-oconnell".
//
// Ids are Firestore document ids, so a few predate this rule and must never be
// changed ('c-j-stroud', 'cameron-ward', 'j-j-mccarthy'). Anything deriving an
// id from a name has to allow for those exceptions rather than assume the slug
// is authoritative — which is why this lives in one place instead of being
// retyped wherever it is needed.
export const slugifyPlayerName = (name = '') =>
  name
    .toLowerCase()
    .replace(/[.']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
