import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { NotebookPen } from 'lucide-react';
import { getNoteHistory } from '@/firebase/personalRankingHelpers';
import { noteHistoryFor } from '@/utils/rankings/rankHistory';

const DATE = { month: 'short', day: 'numeric', year: 'numeric' };

/**
 * A quarterback's notes over time, newest at the top: every edit logged since
 * edits started being logged, and before that whatever each saved version of
 * the board carried.
 */
const NoteHistory = ({ qb, history }) => {
  const [logged, setLogged] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getNoteHistory(qb.id)
      .then((items) => {
        if (!cancelled) setLogged(items);
      })
      .catch((error) => {
        // The boards still give a history; the log only sharpens it.
        console.error('Could not load the note history:', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [qb.id]);

  const notes = noteHistoryFor(history, qb, logged);

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-2">
        <NotebookPen size={13} className="text-amber-300/80" />
        Notes history
      </div>
      {notes.length ? (
        <ol className="space-y-2 border-l border-amber-300/20 pl-3 max-h-56 overflow-y-auto archive-scrollbar">
          {notes.map((item, index) => (
            <li key={`${item.source}-${index}`}>
              <div className="text-[10px] uppercase tracking-wide text-white/40">
                {item.date
                  ? item.date.toLocaleDateString('en-US', DATE)
                  : 'Date unknown'}
                {index === 0 && ' · latest'}
              </div>
              <div
                className={`text-sm whitespace-pre-wrap ${
                  item.notes ? 'text-white/85' : 'text-white/40 italic'
                }`}
              >
                {item.notes || 'Note cleared'}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="text-xs text-white/45">
          {loading ? 'Loading notes…' : 'No notes on him yet.'}
        </div>
      )}
    </div>
  );
};

NoteHistory.propTypes = {
  qb: PropTypes.object.isRequired,
  history: PropTypes.array.isRequired,
};

export default NoteHistory;
