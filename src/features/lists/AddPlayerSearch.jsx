// AddPlayerSearch.jsx
// Type-ahead for adding a QB to the list being edited, so a list can be built
// without leaving the page.
import React, { useMemo, useState } from 'react';

const MAX_RESULTS = 8;

const nameOf = (player) => player.display_name || player.name || player.id;

const AddPlayerSearch = ({ players = [], excludeIds = [], onAdd }) => {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const exclude = new Set(excludeIds);
    return players
      .filter((p) => !exclude.has(p.id))
      .filter((p) => nameOf(p).toLowerCase().includes(q))
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
      .slice(0, MAX_RESULTS);
  }, [players, excludeIds, query]);

  const add = (player) => {
    onAdd(player.id);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-[320px]">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches[0]) add(matches[0]);
          if (e.key === 'Escape') setQuery('');
        }}
        placeholder="Add a QB..."
        aria-label="Add a QB to this list"
        className="w-full bg-neutral-800 text-white text-sm px-3 py-1.5 rounded border border-white/20 placeholder:text-white/40"
      />
      {query.trim() && (
        <ul className="absolute z-30 mt-1 w-full bg-neutral-900 border border-white/10 rounded shadow-lg overflow-hidden">
          {matches.length ? (
            matches.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => add(p)}
                  className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-white/10 flex justify-between"
                >
                  <span>{nameOf(p)}</span>
                  <span className="text-white/40">{p.bio?.Team || ''}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-1.5 text-sm text-white/40">
              No QB by that name, or already on the list
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default AddPlayerSearch;
