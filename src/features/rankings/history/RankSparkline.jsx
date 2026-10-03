import React, { useState } from 'react';
import PropTypes from 'prop-types';

const WIDTH = 320;
const HEIGHT = 96;
// Room for the rank labels on the left and the dates underneath.
const LEFT = 30;
const RIGHT = 8;
const TOP = 8;
const BOTTOM = 22;

const SHORT = { month: 'short', day: 'numeric' };
const WITH_YEAR = { month: 'short', year: 'numeric' };

/**
 * Dates for the bottom edge: first and last, plus the middle once there are
 * enough versions for it to fit. Shown as "Sep 14", or "Sep 2025" when the
 * history crosses a year, so the span is readable at a glance.
 */
const axisDates = (points) => {
  const dated = points
    .map((point, index) => ({ index, date: point.date }))
    .filter((point) => point.date);
  if (!dated.length) return [];

  const first = dated[0];
  const last = dated[dated.length - 1];
  const crossesYear = first.date.getFullYear() !== last.date.getFullYear();
  const format = (date) =>
    date.toLocaleDateString('en-US', crossesYear ? WITH_YEAR : SHORT);

  const ticks = [first];
  if (dated.length >= 5) ticks.push(dated[Math.floor(dated.length / 2)]);
  if (last !== first) ticks.push(last);
  return ticks.map((tick) => ({ ...tick, label: format(tick.date) }));
};

/**
 * One quarterback's rank across the saved versions, oldest on the left, with
 * dates along the bottom. Rank 1 is drawn at the top. A version he was not on
 * breaks the line. Hovering a point says which version it is.
 */
const RankSparkline = ({ points, highlightId }) => {
  const [hovered, setHovered] = useState(null);
  const ranked = points.filter((point) => point.rank);
  if (ranked.length < 2) return null;

  const worst = Math.max(...ranked.map((point) => point.rank));
  const best = Math.min(...ranked.map((point) => point.rank));
  const span = Math.max(worst - best, 1);
  const plotWidth = WIDTH - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;

  const x = (index) => LEFT + index * step;
  const y = (rank) => TOP + ((rank - best) / span) * plotHeight;

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

  const ticks = axisDates(points);
  const active = hovered != null ? points[hovered] : null;

  return (
    <div className="relative pt-6">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width={WIDTH}
        height={HEIGHT}
        role="img"
        aria-label={`Rank over ${ranked.length} versions${
          ticks.length > 1
            ? `, ${ticks[0].label} to ${ticks[ticks.length - 1].label}`
            : ''
        }, between ${best} and ${worst}`}
        className="max-w-full overflow-visible"
        onMouseLeave={() => setHovered(null)}
      >
        {/* Recessive frame: best and worst rank, and the baseline. */}
        <line
          x1={LEFT}
          x2={WIDTH - RIGHT}
          y1={TOP + plotHeight}
          y2={TOP + plotHeight}
          className="stroke-white/10"
        />
        <text
          x={LEFT - 6}
          y={y(best) + 4}
          textAnchor="end"
          className="fill-white/45 text-[10px]"
        >
          #{best}
        </text>
        {worst !== best && (
          <text
            x={LEFT - 6}
            y={y(worst) + 4}
            textAnchor="end"
            className="fill-white/45 text-[10px]"
          >
            #{worst}
          </text>
        )}
        {ticks.map((tick) => (
          <text
            key={tick.index}
            x={x(tick.index)}
            y={HEIGHT - 6}
            textAnchor={
              tick.index === 0
                ? 'start'
                : tick.index === points.length - 1
                  ? 'end'
                  : 'middle'
            }
            className="fill-white/45 text-[10px]"
          >
            {tick.label}
          </text>
        ))}

        {runs.map((coords, index) => (
          <polyline
            key={index}
            points={coords.join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            className="text-blue-400"
          />
        ))}
        {points.map((point, index) =>
          point.rank ? (
            <g key={point.id}>
              <circle
                cx={x(index)}
                cy={y(point.rank)}
                r={point.id === highlightId || index === hovered ? 4.5 : 3}
                className={`stroke-neutral-800 ${
                  point.id === highlightId ? 'fill-white' : 'fill-blue-300'
                }`}
                strokeWidth="2"
              />
              {/* A hit target wider than the dot. */}
              <circle
                cx={x(index)}
                cy={y(point.rank)}
                r={12}
                fill="transparent"
                onMouseEnter={() => setHovered(index)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                aria-label={`#${point.rank}${
                  point.date ? ` on ${point.date.toLocaleDateString()}` : ''
                }`}
              />
            </g>
          ) : null
        )}
      </svg>

      {active && (
        <div
          role="status"
          className="absolute top-0 px-2 py-0.5 rounded bg-neutral-950 border border-white/15 text-[11px] text-white whitespace-nowrap pointer-events-none -translate-x-1/2"
          style={{ left: Math.min(Math.max(x(hovered), 40), WIDTH - 40) }}
        >
          #{active.rank}
          {active.date &&
            ` · ${active.date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}`}
        </div>
      )}
    </div>
  );
};

RankSparkline.propTypes = {
  points: PropTypes.array.isRequired,
  highlightId: PropTypes.string,
};

export default RankSparkline;
