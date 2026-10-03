import { POSITION_MAP } from './positionMap.js';

export function getPlayerPositionLabel(fullPosition) {
  return POSITION_MAP[fullPosition] || fullPosition || '—';
}
