// The Crystal Ball shelves on the QB Weekly page. Saved as one document
// (qbwShelves/main); until that exists, the page shows DEFAULT_SHELVES.

export const GENERIC_CRYSTAL_BALL = '/assets/crystal-balls/QBWCrystalBall.png';

// Artwork already in public/. A QB without his own ball gets the generic one
// with his name under it.
export const CRYSTAL_BALL_IMAGES = [
  { label: 'Baker Mayfield', url: '/assets/crystal-balls/good/Baker.png' },
  { label: 'Sam Darnold', url: '/assets/crystal-balls/good/Darnold.png' },
  { label: 'Geno Smith', url: '/assets/crystal-balls/good/Geno.png' },
  { label: 'Jared Goff', url: '/assets/crystal-balls/good/Goff.png' },
  { label: 'Matthew Stafford', url: '/assets/crystal-balls/good/Stafford.png' },
  { label: 'Kirk Cousins', url: '/assets/crystal-balls/bad/Cousins.png' },
  { label: 'Russell Wilson', url: '/assets/crystal-balls/bad/Russ.png' },
];

export const DEFAULT_SHELVES = [
  {
    id: 'whisperer',
    title: 'The Whisperer',
    qbs: [
      {
        id: '1',
        name: 'Baker Mayfield',
        imageUrl: '/assets/crystal-balls/good/Baker.png',
        predictionText: 'Comeback Player of the Year',
      },
      {
        id: '2',
        name: 'Sam Darnold',
        imageUrl: '/assets/crystal-balls/good/Darnold.png',
        predictionText: 'Breakout season in Minnesota',
      },
      {
        id: '3',
        name: 'Geno Smith',
        imageUrl: '/assets/crystal-balls/good/Geno.png',
        predictionText: 'Veteran resurgence',
      },
      {
        id: '4',
        name: 'Jared Goff',
        imageUrl: '/assets/crystal-balls/good/Goff.png',
        predictionText: 'Elite',
      },
      {
        id: '5',
        name: 'Matthew Stafford',
        imageUrl: '/assets/crystal-balls/good/Stafford.png',
        predictionText: 'Super Bowl champion',
      },
    ],
  },
  {
    id: 'garbage',
    title: "Told You He's Garbage",
    qbs: [
      {
        id: '6',
        name: 'Kirk Cousins',
        imageUrl: '/assets/crystal-balls/bad/Cousins.png',
        predictionText: 'Playoff breakthrough',
      },
      {
        id: '7',
        name: 'Russell Wilson',
        imageUrl: '/assets/crystal-balls/bad/Russ.png',
        predictionText: 'MVP season in Denver',
      },
    ],
  },
];

export const newBallId = () =>
  `ball-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const cleanBall = (qb = {}) => ({
  id: String(qb.id || newBallId()),
  name: String(qb.name || '').trim(),
  imageUrl: String(qb.imageUrl || '').trim(),
  predictionText: String(qb.predictionText || '').trim(),
});

/**
 * Shapes shelves for saving or showing: trims text, drops balls with no name,
 * and falls back to the defaults when given nothing usable.
 */
export const normalizeShelves = (shelves) => {
  if (!Array.isArray(shelves) || shelves.length === 0) return DEFAULT_SHELVES;
  return shelves.map((shelf, index) => ({
    id: String(shelf?.id || `shelf-${index}`),
    title: String(shelf?.title || '').trim(),
    qbs: (Array.isArray(shelf?.qbs) ? shelf.qbs : [])
      .map(cleanBall)
      .filter((qb) => qb.name),
  }));
};

export const countBalls = (shelves) =>
  shelves.reduce((sum, shelf) => sum + shelf.qbs.length, 0);
