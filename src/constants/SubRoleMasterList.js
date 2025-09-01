export const SubRoleMasterList = [
  // ===== STRENGTHS =====
  // -- Arm Talent --
  {
    name: 'Elite Arm Strength',
    type: 'offense',
    isPositive: true,
    group: 'Arm Talent',
  },
  {
    name: 'Precision Passer',
    type: 'offense',
    isPositive: true,
    group: 'Arm Talent',
  },
  {
    name: 'Touch Thrower',
    type: 'offense',
    isPositive: true,
    group: 'Arm Talent',
  },
  {
    name: 'Ball Placement',
    type: 'offense',
    isPositive: true,
    group: 'Arm Talent',
  },

  // -- Processing --
  {
    name: 'Quick Processor',
    type: 'offense',
    isPositive: true,
    group: 'Processing',
  },
  {
    name: 'Reads Full Field',
    type: 'offense',
    isPositive: true,
    group: 'Processing',
  },
  {
    name: 'Defensive Recognition',
    type: 'offense',
    isPositive: true,
    group: 'Processing',
  },
  {
    name: 'Anticipatory Thrower',
    type: 'offense',
    isPositive: true,
    group: 'Processing',
  },

  // -- Mobility --
  {
    name: 'Escape Artist',
    type: 'offense',
    isPositive: true,
    group: 'Mobility',
  },
  {
    name: 'Extends Plays',
    type: 'offense',
    isPositive: true,
    group: 'Mobility',
  },
  {
    name: 'Running Threat',
    type: 'offense',
    isPositive: true,
    group: 'Mobility',
  },
  {
    name: 'Creative Off-Script',
    type: 'offense',
    isPositive: true,
    group: 'Mobility',
  },

  // -- Pocket --
  {
    name: 'Pocket Presence',
    type: 'offense',
    isPositive: true,
    group: 'Pocket',
  },
  {
    name: 'Steps Up Clean',
    type: 'offense',
    isPositive: true,
    group: 'Pocket',
  },
  {
    name: 'Navigates Traffic',
    type: 'offense',
    isPositive: true,
    group: 'Pocket',
  },
  {
    name: 'Throws Under Pressure',
    type: 'offense',
    isPositive: true,
    group: 'Pocket',
  },

  // -- Intangibles --
  {
    name: 'Leader',
    type: 'offense',
    isPositive: true,
    group: 'Intangibles',
  },
  {
    name: 'Clutch Performer',
    type: 'offense',
    isPositive: true,
    group: 'Intangibles',
  },
  {
    name: 'High Football IQ',
    type: 'offense',
    isPositive: true,
    group: 'Intangibles',
  },
  {
    name: 'Competitive Toughness',
    type: 'offense',
    isPositive: true,
    group: 'Intangibles',
  },

  // ===== WEAKNESSES =====
  // -- Arm Talent --
  {
    name: 'Limited Arm Strength',
    type: 'offense',
    isPositive: false,
    group: 'Arm Talent',
  },
  {
    name: 'Inconsistent Accuracy',
    type: 'offense',
    isPositive: false,
    group: 'Arm Talent',
  },
  {
    name: 'Erratic Ball Placement',
    type: 'offense',
    isPositive: false,
    group: 'Arm Talent',
  },
  {
    name: 'Long Wind-Up',
    type: 'offense',
    isPositive: false,
    group: 'Arm Talent',
  },

  // -- Processing --
  {
    name: 'Slow Processor',
    type: 'offense',
    isPositive: false,
    group: 'Processing',
  },
  {
    name: 'One-Read QB',
    type: 'offense',
    isPositive: false,
    group: 'Processing',
  },
  {
    name: 'Misses Open Receivers',
    type: 'offense',
    isPositive: false,
    group: 'Processing',
  },
  {
    name: 'Forces Into Coverage',
    type: 'offense',
    isPositive: false,
    group: 'Processing',
  },

  // -- Mobility --
  {
    name: 'Limited Athlete',
    type: 'offense',
    isPositive: false,
    group: 'Mobility',
  },
  {
    name: 'Struggles Off-Platform',
    type: 'offense',
    isPositive: false,
    group: 'Mobility',
  },
  {
    name: 'Mechanical Runner',
    type: 'offense',
    isPositive: false,
    group: 'Mobility',
  },
  {
    name: 'Ball Security Issues',
    type: 'offense',
    isPositive: false,
    group: 'Mobility',
  },

  // -- Pocket --
  {
    name: 'Poor Pocket Feel',
    type: 'offense',
    isPositive: false,
    group: 'Pocket',
  },
  {
    name: 'Leaves Clean Pockets',
    type: 'offense',
    isPositive: false,
    group: 'Pocket',
  },
  {
    name: 'Panics Under Pressure',
    type: 'offense',
    isPositive: false,
    group: 'Pocket',
  },
  {
    name: 'Takes Bad Sacks',
    type: 'offense',
    isPositive: false,
    group: 'Pocket',
  },

  // -- Intangibles --
  {
    name: 'Inconsistent Mechanics',
    type: 'offense',
    isPositive: false,
    group: 'Intangibles',
  },
  {
    name: 'Decision Making',
    type: 'offense',
    isPositive: false,
    group: 'Intangibles',
  },
  {
    name: 'Low Football IQ',
    type: 'offense',
    isPositive: false,
    group: 'Intangibles',
  },
  {
    name: 'Injury History',
    type: 'offense',
    isPositive: false,
    group: 'Intangibles',
  },
];

// Helper exports
export const offensiveSubRoles = SubRoleMasterList.filter(
  (r) => r.type === 'offense'
).map((r) => r.name);
export const defensiveSubRoles = SubRoleMasterList.filter(
  (r) => r.type === 'defense'
).map((r) => r.name);
export const positiveSubRoles = SubRoleMasterList.filter(
  (r) => r.isPositive
).map((r) => r.name);
export const negativeSubRoles = SubRoleMasterList.filter(
  (r) => !r.isPositive
).map((r) => r.name);
