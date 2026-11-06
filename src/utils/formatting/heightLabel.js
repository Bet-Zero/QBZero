// Stored heights are feet-inches with the inches zero-padded ("6-01"). Shown
// without the pad ("6-1"); two-digit inches ("5-10", "6-11") are unchanged.
export const formatHeightLabel = (height) => {
  if (height === null || height === undefined || height === '') return height;
  return String(height).replace(/^(\d+)-0(\d)$/, '$1-$2');
};
