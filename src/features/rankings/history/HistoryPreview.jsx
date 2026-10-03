import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { formatArchiveDate } from '@/utils/formatting/rankingDates';
import { describeRankingChange } from '@/utils/rankings/rankingSummary';

const SHOWN = 4;

/**
 * The last few saved versions, each linking into the history page.
 *
 * This used to be a full archive browser -- the same one, on two pages --
 * squeezed into a sidebar. The history now has a page of its own; this is the
 * way in.
 */
const HistoryPreview = ({ archives, hasMore = false }) => (
  <div className="bg-neutral-800/50 rounded-xl p-6 border border-white/10 mb-6">
    <div className="flex items-center gap-3 mb-4">
      <Clock size={20} className="text-blue-400" />
      <h3 className="text-lg font-bold text-white">Ranking History</h3>
    </div>

    {archives.length > 0 ? (
      <ul className="space-y-1 mb-3">
        {archives.slice(0, SHOWN).map((archive) => (
          <li key={archive.id}>
            <Link
              to={`/rankings/history?v=${archive.id}`}
              className="block rounded-lg px-3 py-2 hover:bg-white/10"
            >
              <div className="text-sm text-white font-medium">
                {formatArchiveDate(archive)}
              </div>
              {describeRankingChange(archive.summary) && (
                <div className="text-[11px] text-white/55">
                  {describeRankingChange(archive.summary)}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-white/60 text-sm mb-3">
        No earlier versions yet. Every save keeps the one it replaces.
      </p>
    )}

    <Link
      to="/rankings/history"
      className="block text-center py-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-sm font-medium"
    >
      Open full history
      {archives.length > SHOWN &&
        ` (${archives.length}${hasMore ? '+' : ''} versions)`}
    </Link>
  </div>
);

HistoryPreview.propTypes = {
  archives: PropTypes.array.isRequired,
  hasMore: PropTypes.bool,
};

export default HistoryPreview;
