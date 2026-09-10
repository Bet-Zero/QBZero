import { QB_STATS } from '@/constants/stats';

export const statOptions = QB_STATS.map(({ label, key }) => ({ label, key }));

const defaultMaxValues = Object.fromEntries(
  QB_STATS.map((stat) => [stat.key, stat.max])
);

export const getDefaultMaxValue = (statKey) => defaultMaxValues[statKey] ?? 100;

export function getActiveStatFilters(filters) {
  const activeFilters = [];
  const validStatKeys = statOptions.map((s) => s.key);

  Object.keys(filters).forEach((key) => {
    if (key.startsWith('min_') || key.startsWith('max_')) {
      const statKey = key.replace('min_', '').replace('max_', '');
      if (validStatKeys.includes(statKey)) {
        const statLabel = statOptions.find((s) => s.key === statKey)?.label;
        const operator = key.startsWith('min_') ? '>=' : '<=';
        const value = filters[key];
        if (typeof value === 'number' && !isNaN(value)) {
          const isMinFilter = key.startsWith('min_');
          const isMaxFilter = key.startsWith('max_');

          if (
            (isMinFilter && value > 0) ||
            (isMaxFilter && value < getDefaultMaxValue(statKey))
          ) {
            activeFilters.push({
              key,
              stat: statLabel,
              operator,
              value,
              fullKey: key,
            });
          }
        }
      }
    }
  });

  return activeFilters;
}
