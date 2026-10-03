import React from 'react';
import PropTypes from 'prop-types';

const WIDTH = 220;
const HEIGHT = 48;
const PAD = 5;

/**
 * One quarterback's rank across the saved versions, oldest on the left.
 * Rank 1 is drawn at the top. A version he was not on breaks the line.
 */
const RankSparkline = ({ points, highlightId }) => {
  const ranked = points.filter((point) => point.rank);
  if (ranked.length < 2) return null;

  const worst = Math.max(...ranked.map((point) => point.rank));
  const best = Math.min(...ranked.map((point) => point.rank));
  const span = Math.max(worst - best, 1);
  const step = points.length > 1 ? (WIDTH - PAD * 2) / (points.length - 1) : 0;

  const x = (index) => PAD + index * step;
  const y = (rank) => PAD + ((rank - best) / span) * (HEIGHT - PAD * 2);

  // Split into runs so an absence is a gap, not a line drawn across it.
  const runs = [];
  let run = [];
  points.forEach((point, index) => {
    if (point.rank) {
      run.push(`${x(index)},${y(point.rank)}`);
    } else if (run.length) {
      runs.push(run);
      run = [];
    }
  });
  if (run.length) runs.push(run);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      role="img"
      aria-label={`Rank over ${ranked.length} versions, between ${best} and ${worst}`}
      className="overflow-visible"
    >
      {runs.map((points_, index) => (
        <polyline
          key={index}
          points={points_.join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-blue-400"
        />
      ))}
      {points.map((point, index) =>
        point.rank ? (
          <circle
            key={point.id}
            cx={x(index)}
            cy={y(point.rank)}
            r={point.id === highlightId ? 3.5 : 2}
            className={
              point.id === highlightId ? 'fill-white' : 'fill-blue-300'
            }
          >
            <title>
              #{point.rank}
              {point.date ? ` · ${point.date.toLocaleDateString()}` : ''}
            </title>
          </circle>
        ) : null
      )}
    </svg>
  );
};

RankSparkline.propTypes = {
  points: PropTypes.array.isRequired,
  highlightId: PropTypes.string,
};

export default RankSparkline;
