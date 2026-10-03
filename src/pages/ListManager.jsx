// ListManager.jsx
// Full-page route for building and editing player lists (flat, ranked, or tiered)

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import usePlayerData from '@/hooks/usePlayerData.js';
import { toast } from 'react-hot-toast';

import RankedListTier, { TierBreakGap } from '@/features/lists/ListTierHeader';
import RankedListControls from '@/features/lists/ListControls';
import ListRankToggle from '@/features/lists/ListRankToggle';
import ListExportWrapper from '@/features/lists/ListPreviewModal/ListExportWrapper';
import ListPlayerRow from '@/features/lists/ListTierHeader/ListPlayerRow';
import ExportOptionsModal from '@/features/lists/ExportOptionsModal';
import ListRowStyleToggle from '@/features/lists/ListRowStyleToggle';
import ListColumnToggle from '@/features/lists/ListColumnToggle';
import ListPreviewModal from '@/features/lists/ListPreviewModal';
import ListSearchBar from '@/features/lists/ListSearchBar';
import { useConfirm } from '@/components/shared/ui/ConfirmModal';
import AddPlayerSearch from '@/features/lists/AddPlayerSearch';
import { fetchAllLists, fetchList, saveList } from '@/firebase/listHelpers';
import { createTierBoardFromList } from '@/firebase/listTierLink';
import {
  buildFlatPlayers,
  buildTiers,
  insertDivider,
  makeDivider,
  isDivider,
  mergeListOrder,
  movePlayerFlat,
  movePlayerToRank,
  moveItem,
  playerIdsOf,
  removeItem,
} from '@/utils/lists/listOrder';

const UNSAVED_PROMPT = {
  title: 'Leave without saving?',
  message: 'You have unsaved changes to this list. They will be lost.',
  confirmLabel: 'Leave',
  cancelLabel: 'Stay',
  danger: true,
};

const ListManager = () => {
  const { listId } = useParams();
  const [listData, setListData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [playersMap, setPlayersMap] = useState({});
  const [order, setOrder] = useState([]);
  const [notes, setNotes] = useState({});
  const [description, setDescription] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const descriptionRef = useRef(null);
  useEffect(() => {
    if (editingDescription) descriptionRef.current?.focus();
  }, [editingDescription]);
  const [isSaving, setIsSaving] = useState(false);
  const [showReorder, setShowReorder] = useState(true);
  const [placingBreaks, setPlacingBreaks] = useState(false);
  const [isExport, setIsExport] = useState(false);
  const [isRanked, setIsRanked] = useState(true); // Default to ranked
  const [exportType, setExportType] = useState('list');
  const [compact, setCompact] = useState(false);
  const [twoColumn, setTwoColumn] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [allLists, setAllLists] = useState([]);
  const [isOpeningBoard, setIsOpeningBoard] = useState(false);
  const navigate = useNavigate();
  const { confirm, confirmDialog } = useConfirm();
  const listsMap = useMemo(() => {
    const map = {};
    allLists.forEach((l) => {
      map[l.id] = l;
    });
    return map;
  }, [allLists]);

  const { players, loading: playersLoading } = usePlayerData();

  useEffect(() => {
    fetchAllLists()
      .then((results) =>
        setAllLists(
          [...results].sort((a, b) =>
            (a.name || '').localeCompare(b.name || '')
          )
        )
      )
      .catch((err) => console.error('Failed to load lists:', err));
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Clear the previous list so switching never shows its rows under the
    // new list's id (where a save would write them).
    setListData(null);
    setLoadError(null);
    setIsDirty(false);
    fetchList(listId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setLoadError('This list does not exist. It may have been deleted.');
          return;
        }
        setListData(data);
        setOrder(mergeListOrder(data));
        setNotes(data.playerNotes || {});
        setDescription(data.description || '');
        setEditingDescription(false);
        setIsRanked(data.isRanked ?? true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load list:', err);
        setLoadError('Could not load this list. Try refreshing the page.');
      });
    return () => {
      cancelled = true;
    };
  }, [listId]);

  // Browser close / reload / typed URL.
  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  // In-app links (the site nav). BrowserRouter has no navigation blocker, so
  // catch the click before React Router's Link handles it.
  useEffect(() => {
    if (!isDirty) return undefined;
    const guard = (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest?.('a[href]');
      if (!link || link.target === '_blank') return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      // Hold the click, ask in-app, and follow the link only on "Leave".
      e.preventDefault();
      e.stopPropagation();
      confirm(UNSAVED_PROMPT).then((leave) => {
        if (leave) navigate(`${url.pathname}${url.search}${url.hash}`);
      });
    };
    document.addEventListener('click', guard, true);
    return () => document.removeEventListener('click', guard, true);
  }, [isDirty, confirm, navigate]);

  const updateOrder = (next) => {
    if (next === order) return;
    setOrder(next);
    setIsDirty(true);
  };

  const goToList = async (id) => {
    if (id === listId) return;
    if (isDirty && !(await confirm(UNSAVED_PROMPT))) return;
    navigate(`/lists/${id}`);
  };

  useEffect(() => {
    const map = {};
    players.forEach((p) => {
      map[p.id] = p;
    });
    setPlayersMap(map);
  }, [players]);

  const handleNoteChange = (id, text) => {
    setNotes((prev) => ({ ...prev, [id]: text }));
    setIsDirty(true);
  };

  // Every index these receive is a position in the full `order`, dividers
  // included, whichever view the row was rendered in.
  const handleMoveUp = (index) => updateOrder(moveItem(order, index, -1));
  const handleMoveDown = (index) => updateOrder(moveItem(order, index, 1));
  const handleFlatMoveUp = (index) =>
    updateOrder(movePlayerFlat(order, index, -1));
  const handleFlatMoveDown = (index) =>
    updateOrder(movePlayerFlat(order, index, 1));
  const handleMoveToRank = (index, rank) =>
    updateOrder(movePlayerToRank(order, index, rank, playersMap));

  const handleRankedChange = (value) => {
    if (value === isRanked) return;
    setIsRanked(value);
    setIsDirty(true);
  };

  const handleRemove = (index) => {
    const removedId = order[index];
    updateOrder(removeItem(order, index));
    if (removedId && notes[removedId] !== undefined) {
      const updatedNotes = { ...notes };
      delete updatedNotes[removedId];
      setNotes(updatedNotes);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveList(listId, {
        playerOrder: order,
        playerIds: playerIdsOf(order),
        playerNotes: notes,
        description: description.trim(),
        isRanked,
      });
      setListData((prev) => ({
        ...prev,
        description: description.trim(),
        isRanked,
        updatedAt: { toDate: () => new Date() },
      }));
      setDescription(description.trim());
      setEditingDescription(false);
      setIsDirty(false);
      toast.success('List saved!');
    } catch (err) {
      console.error('Failed to save list:', err);
      toast.error('Failed to save list');
    } finally {
      setIsSaving(false);
    }
  };

  const openAsTierBoard = async () => {
    if (isDirty) {
      toast.error('Save the list first, then open it as a tier board.');
      return;
    }
    try {
      setIsOpeningBoard(true);
      const boardId = await createTierBoardFromList({
        id: listId,
        name: listData.name,
        playerOrder: order,
      });
      navigate(`/tier-maker/${boardId}`);
    } catch (err) {
      console.error('Failed to create tier board:', err);
      toast.error('Failed to create tier board');
      setIsOpeningBoard(false);
    }
  };

  const handleInsertBreak = (index) => updateOrder(insertDivider(order, index));

  // Placing only makes sense in the ranked editor.
  useEffect(() => {
    if (!isRanked || !showReorder) setPlacingBreaks(false);
  }, [isRanked, showReorder]);

  useEffect(() => {
    if (!placingBreaks) return undefined;
    const onKey = (e) => e.key === 'Escape' && setPlacingBreaks(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [placingBreaks]);

  const handleLabelChange = (index, newLabel) => {
    const newOrder = [...order];
    newOrder[index] = makeDivider(newLabel);
    updateOrder(newOrder);
  };

  // Built whatever the view: the tier-style export uses tiers even when the
  // editor is showing the flat list.
  const tiers = useMemo(
    () => buildTiers(order, playersMap),
    [order, playersMap]
  );

  const flatEntries = useMemo(
    () => buildFlatPlayers(order, playersMap),
    [order, playersMap]
  );
  const flatPlayers = useMemo(
    () => flatEntries.filter((p) => !p.missing).map((p) => p.id),
    [flatEntries]
  );
  const lastFlatIndex = flatEntries.length
    ? flatEntries[flatEntries.length - 1].index
    : -1;
  const firstFlatIndex = flatEntries.length ? flatEntries[0].index : -1;

  if (loadError) {
    return (
      <div className="text-center mt-12">
        <p className="text-white/80 mb-4">{loadError}</p>
        <Link to="/lists" className="text-sm text-white/60 underline">
          Back to Lists
        </Link>
      </div>
    );
  }

  if (!listData || playersLoading) {
    return <div className="text-white text-center mt-12">Loading List...</div>;
  }

  return (
    <>
      {/* Header */}
      {!isExport && (
        <div className="w-full max-w-[1100px] mx-auto px-4 mt-10 mb-6 relative z-10">
          <div className="absolute top-0 right-0 flex flex-col items-end gap-2 z-20">
            <ListSearchBar
              listsData={listsMap}
              playersData={playersMap}
              onSelect={goToList}
            />
            <select
              value={listId}
              onChange={(e) => goToList(e.target.value)}
              className="bg-neutral-800 text-white text-xs px-2 py-1 rounded border border-white/20"
            >
              {allLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="h-[5px] w-24 bg-gradient-to-r from-neutral-500 to-neutral-900 rounded-full mb-4 shadow-lg"></div>
          <h1 className="text-5xl font-extrabold tracking-tight text-neutral-100 mb-3">
            {listData.name}
          </h1>
          {editingDescription ? (
            <div className="max-w-[800px]">
              <textarea
                ref={descriptionRef}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setIsDirty(true);
                }}
                rows={3}
                placeholder="What is this list? Criteria, timeframe, anything worth remembering."
                aria-label="List description"
                className="w-full backdrop-blur-md bg-white/5 border border-white/20 rounded-md px-4 py-3 text-white/80 text-sm leading-relaxed focus:outline-none focus:border-white/40 placeholder:text-white/30"
              />
              <button
                onClick={() => setEditingDescription(false)}
                className="text-xs text-white/40 hover:text-white mt-1"
              >
                Done (saved with the list)
              </button>
            </div>
          ) : description ? (
            <button
              type="button"
              onClick={() => setEditingDescription(true)}
              title="Edit description"
              className="block text-left backdrop-blur-md bg-white/5 border border-white/10 hover:border-white/25 rounded-md px-4 py-3 max-w-[800px]"
            >
              <p className="text-white/70 text-sm leading-relaxed italic whitespace-pre-line">
                {description}
              </p>
            </button>
          ) : (
            <button
              onClick={() => setEditingDescription(true)}
              className="text-sm text-white/30 hover:text-white/70"
            >
              + Add a description
            </button>
          )}
        </div>
      )}

      <ExportOptionsModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        onSelect={(type) => {
          setExportType(type);
          setCompact(false);
          setIsExport(true);
        }}
      />

      {/* Export Layout */}
      {isExport ? (
        <>
          <div className="w-full max-w-[1100px] mx-auto px-4 mt-10 mb-4 flex justify-end items-center gap-4 z-20">
            <div className="flex items-center gap-4">
              <ListRankToggle isRanked={isRanked} onChange={setIsRanked} />
              {exportType === 'list' && (
                <>
                  <div className="h-6 border-l border-white/20"></div>
                  <ListColumnToggle
                    twoColumn={twoColumn}
                    onChange={setTwoColumn}
                  />
                  <div className="h-6 border-l border-white/20"></div>
                  <ListRowStyleToggle compact={compact} onChange={setCompact} />
                </>
              )}
            </div>
          </div>

          <div className="w-full max-w-[1100px] mx-auto px-4">
            <ListExportWrapper
              players={flatPlayers.map((id) => playersMap[id]).filter(Boolean)}
              tiers={tiers.map((tier) => ({
                label: tier.label,
                players: tier.players
                  .map((p) => playersMap[p.id])
                  .filter(Boolean),
              }))}
              playersMap={playersMap}
              isExport={isExport}
              isRanked={isRanked}
              exportType={exportType}
              compact={compact}
              twoColumn={twoColumn}
              title={listData.name}
              subtitle={description}
            />
          </div>

          <div className="w-full max-w-[1100px] mx-auto px-4 mt-8 mb-12 flex justify-between">
            <button
              onClick={() => setIsExport(false)}
              className="px-3 py-1 text-sm rounded bg-white/10 text-white hover:bg-white/20"
            >
              Back to Edit
            </button>
            <button
              onClick={() => setPreviewOpen(true)}
              className="px-3 py-1 text-sm rounded bg-white/10 text-white hover:bg-white/20"
            >
              Preview
            </button>
          </div>

          {previewOpen && (
            <ListPreviewModal
              open={previewOpen}
              onClose={() => setPreviewOpen(false)}
              players={flatPlayers.map((id) => playersMap[id]).filter(Boolean)}
              tiers={tiers.map((tier) => ({
                label: tier.label,
                players: tier.players
                  .map((p) => playersMap[p.id])
                  .filter(Boolean),
              }))}
              playersMap={playersMap}
              isRanked={isRanked}
              exportType={exportType}
              compact={compact}
              twoColumn={twoColumn}
              title={listData.name}
              subtitle={description}
            />
          )}
        </>
      ) : (
        <>
          <div className="w-full max-w-[1100px] mx-auto px-4 mb-4">
            <AddPlayerSearch
              players={players}
              excludeIds={order}
              onAdd={(id) => updateOrder([...order, id])}
            />
            {order.length === 0 && (
              <p className="text-white/40 text-sm mt-3">
                This list is empty. Search for a QB above to add them.
              </p>
            )}
          </div>
          <div className="w-full">
            {isRanked
              ? tiers.map((tier, idx) => (
                  <RankedListTier
                    key={`tier-${idx}`}
                    label={tier.label}
                    placeholder={`Tier ${idx + 1}`}
                    headerIndex={tier.headerIndex}
                    players={tier.players}
                    playersMap={playersMap}
                    notes={notes}
                    showReorder={showReorder}
                    onLabelChange={handleLabelChange}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onRemove={handleRemove}
                    onNoteChange={handleNoteChange}
                    onMoveToRank={handleMoveToRank}
                    orderLength={order.length}
                    placingBreaks={placingBreaks}
                    onInsertBreak={handleInsertBreak}
                  />
                ))
              : flatEntries.map(({ id, index }) => (
                  <ListPlayerRow
                    key={`flat-${id}`}
                    index={index}
                    playerId={id}
                    player={playersMap[id]}
                    note={notes[id]}
                    onNoteChange={handleNoteChange}
                    onMoveUp={handleFlatMoveUp}
                    onMoveDown={handleFlatMoveDown}
                    onRemove={handleRemove}
                    showReorder={showReorder}
                    showRank={false}
                    isFirst={index === firstFlatIndex}
                    isLast={index === lastFlatIndex}
                  />
                ))}
            {isRanked &&
              placingBreaks &&
              order.length > 0 &&
              !isDivider(order[order.length - 1]) && (
                <TierBreakGap onClick={() => handleInsertBreak(order.length)} />
              )}
            {placingBreaks && (
              <p className="w-full max-w-[1100px] mx-auto px-4 text-xs text-purple-300/70 text-center">
                Click a dashed line to add a tier break there. Unnamed tiers
                number themselves; click a tier name to rename it. Press Esc
                when done.
              </p>
            )}
          </div>

          <RankedListControls
            showReorder={showReorder}
            onToggleReorder={() => setShowReorder(!showReorder)}
            placingBreaks={placingBreaks}
            onTogglePlacingBreaks={() => setPlacingBreaks((v) => !v)}
            onSave={handleSave}
            isSaving={isSaving}
            isDirty={isDirty}
            isRanked={isRanked}
          />

          <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
            <button
              onClick={openAsTierBoard}
              disabled={isOpeningBoard}
              title="Make a tier board from this list. Send it back from the board when you're done."
              className="bg-black/20 text-white px-4 py-2 rounded hover:bg-neutral-600 disabled:opacity-40"
            >
              {isOpeningBoard ? 'Opening...' : 'Open as Tier Board'}
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-black/20 text-white px-4 py-2 rounded hover:bg-neutral-600"
            >
              Export
            </button>
          </div>

          <div className="fixed top-[72px] right-[1px] z-50 scale-75">
            <ListRankToggle isRanked={isRanked} onChange={handleRankedChange} />
          </div>

          <div className="w-full max-w-[1100px] mx-auto px-4 mb-6 text-center">
            <p className="text-xs text-white/30 italic">
              Last updated{' '}
              {listData.updatedAt?.toDate?.().toLocaleDateString() || 'N/A'}
            </p>
          </div>
        </>
      )}
      {confirmDialog}
    </>
  );
};

export default ListManager;
