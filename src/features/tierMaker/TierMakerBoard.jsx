// src/features/tierMaker/TierMakerBoard.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import TierRow, { tierDragId } from '@/features/tierMaker/TierRow';
import TierPlayerTile from '@/features/lists/TierPlayerTile';
import usePlayerData from '@/hooks/usePlayerData.js';
import useFirebaseQuery from '@/hooks/useFirebaseQuery';
import useUnsavedDraft from '@/hooks/useUnsavedDraft';
import { POSITION_MAP } from '@/utils/roles';
import { TeamListFull, teamAbbrFor } from '@/constants/teamList';
import DrawerShell from '@/components/shared/ui/drawers/DrawerShell';
import OpenDrawerButton from '@/components/shared/ui/drawers/OpenDrawerButton';
import AddPlayerDrawer from '@/features/roster/AddPlayerDrawer';
import CreateTierListModal from '@/features/tierMaker/CreateTierListModal';
import NamePromptModal from '@/components/shared/ui/NamePromptModal';
import { useConfirm } from '@/components/shared/ui/ConfirmModal';
import TierMakerExport from '@/features/tierMaker/TierMakerExport';
import {
  fetchAllTierLists,
  fetchTierList,
  fetchTierListVersions,
  saveNamedTierListVersion,
  saveTierList,
} from '@/firebase/listHelpers';
import {
  addToPool,
  addTier as addTierToBoard,
  boardFromSaved,
  boardPlayerIds,
  boardSignature,
  boardToSaved,
  canMove,
  createEmptyBoard,
  deleteTier as deleteTierFromBoard,
  versionTitle,
  movePlayerTo,
  POOL,
  renameTier as renameTierOnBoard,
  reorderTiers,
} from '@/utils/tierMaker/tierBoard';
import { sendTierBoardToList } from '@/firebase/listTierLink';
import { mergeListOrder, playerIdsOf } from '@/utils/lists/listOrder';
import { toast } from 'react-hot-toast';

// How long the board sits unchanged before it saves itself.
export const AUTOSAVE_DELAY_MS = 1500;

// Player drags only land on players or rows, tier drags only on tiers.
// Within a row, a tile under the pointer wins over the row itself.
const collisionDetection = (args) => {
  const type = args.active.data.current?.type;
  const only = (types) => ({
    ...args,
    droppableContainers: args.droppableContainers.filter((c) =>
      types.includes(c.data.current?.type)
    ),
  });
  if (type === 'tier') return closestCenter(only(['tier']));
  const players = pointerWithin(only(['player']));
  if (players.length) return players;
  const rows = pointerWithin(only(['row']));
  return rows.length ? rows : rectIntersection(only(['player', 'row']));
};

const TierMakerBoard = ({ players = [], initialTierListId = '' }) => {
  const { players: allPlayers, loading } = usePlayerData();
  const { data: listsData } = useFirebaseQuery('lists');
  const navigate = useNavigate();

  const processedPlayers = useMemo(
    () =>
      allPlayers.map((player) => ({
        id: player.id,
        player_id: player.id,
        name: (player.display_name || player.name || '').toLowerCase(),
        team: (player.bio?.Team || '').toLowerCase(),
        position:
          POSITION_MAP[player.bio?.Position] || player.bio?.Position || '',
        offenseRoles: [
          player.roles?.offense1?.toLowerCase() || '',
          player.roles?.offense2?.toLowerCase() || '',
        ],
        offenseSubroles: player.subRoles?.offense || [],
        runningProfile: (player.runningProfile || '').toLowerCase(),
        badges: player.badges || [],
        salary: player.contract?.annual_salaries?.find((s) => s.year === 2025)
          ?.salary,
        freeAgentYear: player.free_agency_year?.toString(),
        freeAgentType: player.free_agent_type?.toLowerCase(),
        contractType: player.contract?.type?.toLowerCase(),
        extension: player.contract?.extension,
        options: player.contract?.options || [],
        original: player,
      })),
    [allPlayers]
  );

  const playersMap = useMemo(() => {
    const map = {};
    allPlayers.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [allPlayers]);

  const lists = useMemo(
    () =>
      (listsData || []).map((l) => ({
        id: l.id,
        name: l.name,
        playerIds: playerIdsOf(mergeListOrder(l)),
      })),
    [listsData]
  );

  const [tierListsData, setTierListsData] = useState([]);
  const refreshTierLists = useCallback(async () => {
    try {
      setTierListsData(await fetchAllTierLists());
    } catch (err) {
      console.error('Failed to fetch tier lists', err);
    }
  }, []);
  useEffect(() => {
    refreshTierLists();
  }, [refreshTierLists]);

  const tierLists = useMemo(
    () =>
      tierListsData
        .map((l) => ({ id: l.id, name: l.name || 'Untitled' }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [tierListsData]
  );

  const [board, setBoard] = useState(() => createEmptyBoard(players));
  const { tiers, tierOrder } = board;
  // Signature of the board as last loaded or saved.
  const [savedSignature, setSavedSignature] = useState(() =>
    boardSignature(createEmptyBoard(players))
  );
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedList, setSelectedList] = useState('');
  const [selectedTierList, setSelectedTierList] = useState('');
  // The list this board was made from, if any: `{ id, name }`.
  const [sourceList, setSourceList] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [activePlayerId, setActivePlayerId] = useState(null);
  const boardBeforeDrag = useRef(null);
  // Daily snapshots of the selected list, newest first.
  const [versions, setVersions] = useState([]);
  // The snapshot shown on the board instead of the current list, if any.
  // Autosave is off while one is shown.
  const [viewingVersion, setViewingVersion] = useState(null);
  const boardBeforeVersion = useRef(null);
  // A save that failed is not retried until the board changes again.
  const [failedSignature, setFailedSignature] = useState(null);
  // The open naming dialog: { kind: 'addTier' | 'renameTier' | 'version', tier? }
  const [namePrompt, setNamePrompt] = useState(null);

  const refreshVersions = useCallback(async (id) => {
    if (!id) {
      setVersions([]);
      return;
    }
    try {
      setVersions(await fetchTierListVersions(id));
    } catch (err) {
      console.error('Failed to fetch tier list versions', err);
    }
  }, []);

  const sensors = useSensors(
    // Mouse rather than Pointer: on touch, pointer events get cancelled as
    // soon as the page starts to scroll.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // A short hold on touch so a swipe still scrolls the page.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const signature = boardSignature(board);
  const isDirty = signature !== savedSignature;
  // A board that is not saved anywhere yet: a new board with no list, or
  // edits made while looking at an old version.
  const hasUnsavedWork = isDirty && (!selectedTierList || !!viewingVersion);
  const { confirm, confirmDialog } = useConfirm();
  const confirmLeave = () =>
    confirm({
      title: 'Discard unsaved changes?',
      message:
        'This board is not saved to a tier list yet, so leaving loses it.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      danger: true,
    });
  const confirmDiscard = async () => !hasUnsavedWork || confirmLeave();

  useEffect(() => {
    if (!hasUnsavedWork) return undefined;
    // Links inside the site change pages without unloading, so ask here.
    // Closing or reloading the tab keeps a draft instead (below).
    const guardLinks = (e) => {
      const link = e.target.closest?.('a[href]');
      if (!link || link.target === '_blank' || e.defaultPrevented) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      // Hold the navigation until the in-app dialog is answered.
      e.preventDefault();
      e.stopPropagation();
      confirmLeave().then((leave) => {
        if (leave) navigate(url.pathname + url.search + url.hash);
      });
    };
    document.addEventListener('click', guardLinks, true);
    return () => {
      document.removeEventListener('click', guardLinks, true);
    };
    // confirmLeave only wraps the stable confirm().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsavedWork, navigate]);

  // A new board saved nowhere yet lives in this browser until it is, so a
  // closed or reloaded tab picks up where it left off. Boards on a tier list
  // autosave, and edits to an old version are explicitly not kept.
  useUnsavedDraft({
    key: initialTierListId ? null : 'tier-maker:new',
    ready: !loading && allPlayers.length > 0,
    dirty: isDirty && !selectedTierList,
    snapshot: boardToSaved(board),
    restore: (draft, isDraft) =>
      setBoard(
        isDraft && draft
          ? boardFromSaved(draft, playersMap)
          : createEmptyBoard(players)
      ),
    confirm,
  });

  // Calculate which players are currently used in any tier
  const usedPlayerIds = useMemo(() => boardPlayerIds(tiers), [tiers]);

  // Filter available players for the drawer (exclude already used players)
  const availablePlayersForDrawer = useMemo(() => {
    return processedPlayers.filter((player) => !usedPlayerIds.has(player.id));
  }, [processedPlayers, usedPlayerIds]);

  const addPlayerToPool = (player) => {
    setBoard((prev) => addToPool(prev, [player]));
  };

  const addPlayersToPool = (playersArray) => {
    setBoard((prev) => addToPool(prev, playersArray));
  };

  const movePlayer = (playerId, fromTier, direction) => {
    setBoard((prev) => {
      const currentIndex = prev.tierOrder.indexOf(fromTier);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (currentIndex < 0 || newIndex < 0 || newIndex >= prev.tierOrder.length)
        return prev;
      const toTier = prev.tierOrder[newIndex];
      const player = prev.tiers[fromTier].find((p) => p.player_id === playerId);
      if (!player) return prev;
      return {
        ...prev,
        tiers: {
          ...prev.tiers,
          [fromTier]: prev.tiers[fromTier].filter(
            (p) => p.player_id !== playerId
          ),
          [toTier]: [...prev.tiers[toTier], player],
        },
      };
    });
  };

  const movePlayerOnBoard = (playerId, toTier, index) =>
    setBoard((prev) => {
      const next = movePlayerTo(prev.tiers, playerId, toTier, index);
      return next === prev.tiers ? prev : { ...prev, tiers: next };
    });

  const tierOf = (playerId) =>
    Object.keys(tiers).find((t) =>
      tiers[t].some((p) => p.player_id === playerId)
    );

  // Where a player drag is pointing: the tier, and the index of the tile
  // under it (undefined = end of the row).
  const dropTarget = (over) => {
    const data = over?.data.current;
    if (!data) return null;
    if (data.type === 'row') return { tier: data.tier };
    const tier = tierOf(over.id);
    if (!tier) return null;
    return {
      tier,
      index: tiers[tier].findIndex((p) => p.player_id === over.id),
    };
  };

  const handleDragStart = ({ active }) => {
    if (active.data.current?.type !== 'player') return;
    boardBeforeDrag.current = board;
    setActivePlayerId(active.id);
  };

  // Crossing into another tier moves the tile right away so the row opens
  // a gap for it; reordering inside a tier is settled on drop.
  const handleDragOver = ({ active, over }) => {
    if (active.data.current?.type !== 'player') return;
    const target = dropTarget(over);
    if (!target || tierOf(active.id) === target.tier) return;
    movePlayerOnBoard(active.id, target.tier, target.index);
  };

  const handleDragEnd = ({ active, over }) => {
    const type = active.data.current?.type;
    setActivePlayerId(null);
    boardBeforeDrag.current = null;
    if (!over) return;
    if (type === 'tier') {
      setBoard((prev) => {
        const order = reorderTiers(
          prev.tierOrder,
          active.data.current.tier,
          over.data.current?.tier
        );
        return order === prev.tierOrder ? prev : { ...prev, tierOrder: order };
      });
      return;
    }
    const target = dropTarget(over);
    if (!target || active.id === over.id) return;
    movePlayerOnBoard(active.id, target.tier, target.index);
  };

  const handleDragCancel = () => {
    if (boardBeforeDrag.current) setBoard(boardBeforeDrag.current);
    boardBeforeDrag.current = null;
    setActivePlayerId(null);
  };

  const activePlayer = activePlayerId
    ? Object.values(tiers)
        .flat()
        .find((p) => p.player_id === activePlayerId)
    : null;

  const removePlayer = (playerId, fromTier) => {
    setBoard((prev) => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [fromTier]: prev.tiers[fromTier].filter(
          (p) => p.player_id !== playerId
        ),
      },
    }));
    // Player will automatically become available in drawer due to usedPlayerIds recalculation
  };

  const addTier = () => setNamePrompt({ kind: 'addTier' });

  // Returns an error message to show in the dialog, if any.
  const submitAddTier = (name) => {
    const result = addTierToBoard(latest.current.board, name);
    if (result.error) return result.error;
    setBoard(result.board);
    return null;
  };

  const deleteTier = (tier) => {
    setBoard((prev) => deleteTierFromBoard(prev, tier));
  };

  const renameTier = (tier) => setNamePrompt({ kind: 'renameTier', tier });

  const submitRenameTier = (tier, name) => {
    const result = renameTierOnBoard(latest.current.board, tier, name);
    if (result.error) return result.error;
    setBoard(result.board);
    return null;
  };

  const resetBoard = async () => {
    if (
      !(await confirm({
        title: 'Clear the board?',
        message: 'Every tier and the pool are emptied.',
        confirmLabel: 'Clear',
        danger: true,
      }))
    )
      return;
    setBoard(createEmptyBoard(players));
  };

  const handleAddTeamRoster = () => {
    if (!selectedTeam) return;
    const teamPlayers = allPlayers.filter(
      (p) => (p.bio?.Team || '').toUpperCase() === teamAbbrFor(selectedTeam.id)
    );
    addPlayersToPool(teamPlayers);
    setSelectedTeam(null);
  };

  const handleAddList = () => {
    if (!selectedList) return;
    const list = lists.find((l) => l.id === selectedList);
    if (!list) return;
    const listPlayers = list.playerIds
      .map((id) => playersMap[id])
      .filter(Boolean);
    addPlayersToPool(listPlayers);
    setSelectedList('');
  };

  const showTierListInUrl = useCallback(
    (id) => {
      // The board now owns this id; don't let the URL change re-trigger
      // the initial load below.
      setInitialLoaded(true);
      if (id && id !== initialTierListId) {
        navigate(`/tier-maker/${id}`, { replace: true });
      }
    },
    [navigate, initialTierListId]
  );

  const handleLoadTierList = useCallback(
    async (id) => {
      if (!id) return;
      try {
        const data = await fetchTierList(id);
        if (!data) {
          toast.error('That tier list no longer exists');
          return;
        }
        const loaded = boardFromSaved(data, playersMap);
        boardBeforeVersion.current = null;
        setViewingVersion(null);
        refreshVersions(id);
        setBoard(loaded);
        setSavedSignature(boardSignature(loaded));
        setSelectedTierList(id);
        setSourceList(data.sourceList?.id ? data.sourceList : null);
        showTierListInUrl(id);
        const missing = Object.values(loaded.unresolved).flat().length;
        if (missing) {
          toast(
            `${missing} saved player${missing === 1 ? '' : 's'} could not be found and ${missing === 1 ? 'is' : 'are'} hidden; saving keeps them.`
          );
        } else {
          toast.success('Tier list loaded!');
        }
      } catch (err) {
        console.error('Failed to load tier list', err);
        toast.error('Failed to load tier list');
      }
    },
    [playersMap, showTierListInUrl, refreshVersions]
  );

  const latest = useRef({});
  latest.current = {
    board,
    signature,
    selectedTierList,
    isDirty,
    viewingVersion,
  };

  const saveBoard = async (listId, { silent = false } = {}) => {
    const { board: snapshot, signature: snapshotSignature } = latest.current;
    try {
      setIsSaving(true);
      await saveTierList(listId, boardToSaved(snapshot));
      setSavedSignature(snapshotSignature);
      setFailedSignature(null);
      if (!silent) toast.success('Tier list saved!');
      refreshVersions(listId);
      return true;
    } catch (err) {
      console.error('Failed to save tier list', err);
      setFailedSignature(snapshotSignature);
      toast.error('Failed to save tier list');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTierList = async (idOverride) => {
    const listId = idOverride || selectedTierList;
    if (!listId) {
      setShowCreateModal(true);
      return;
    }
    if (viewingVersion) {
      restoreVersion();
    }
    await saveBoard(listId);
  };

  // Autosave: once a list is selected, a change saves itself after a short
  // pause. Not while a drag is in progress or an old version is shown.
  useEffect(() => {
    if (
      !selectedTierList ||
      !isDirty ||
      isSaving ||
      viewingVersion ||
      activePlayerId ||
      signature === failedSignature
    )
      return undefined;
    const timer = setTimeout(
      () => saveBoard(selectedTierList, { silent: true }),
      AUTOSAVE_DELAY_MS
    );
    return () => clearTimeout(timer);
    // saveBoard reads the latest board from a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedTierList,
    isDirty,
    isSaving,
    viewingVersion,
    activePlayerId,
    signature,
    failedSignature,
  ]);

  // Leaving the page inside the pause still saves the last change.
  useEffect(
    () => () => {
      const {
        board: last,
        selectedTierList: listId,
        isDirty: dirty,
        viewingVersion: viewing,
      } = latest.current;
      if (listId && dirty && !viewing) {
        saveTierList(listId, boardToSaved(last)).catch((err) =>
          console.error('Failed to save tier list on leave', err)
        );
      }
    },
    []
  );

  const viewVersion = async (versionId) => {
    if (!versionId) return;
    const version = versions.find((v) => v.id === versionId);
    if (!version) return;
    // Save pending edits first so "Back to current" really is current.
    if (!viewingVersion && isDirty && selectedTierList) {
      if (!(await saveBoard(selectedTierList, { silent: true }))) return;
    }
    if (!viewingVersion) boardBeforeVersion.current = latest.current.board;
    setBoard(boardFromSaved(version, playersMap));
    setViewingVersion(version);
  };

  const saveNamedVersion = () => {
    if (!selectedTierList || viewingVersion) return;
    setNamePrompt({ kind: 'version' });
  };

  const submitNamedVersion = async (label) => {
    // Name what is saved, so the version matches the list.
    if (
      latest.current.isDirty &&
      !(await saveBoard(selectedTierList, { silent: true }))
    )
      return 'Could not save the board first. Try again.';
    try {
      await saveNamedTierListVersion(
        selectedTierList,
        boardToSaved(latest.current.board),
        label
      );
      toast.success(`Saved version "${label}"`);
      refreshVersions(selectedTierList);
      return null;
    } catch (err) {
      console.error('Failed to save named version', err);
      return 'Could not save this version. Try again.';
    }
  };

  const backToCurrent = () => {
    if (boardBeforeVersion.current) setBoard(boardBeforeVersion.current);
    boardBeforeVersion.current = null;
    setViewingVersion(null);
  };

  // Keep the board as shown; autosave then writes it as the current list.
  const restoreVersion = () => {
    boardBeforeVersion.current = null;
    setViewingVersion(null);
  };

  const handleCreateAndSave = async (newId) => {
    if (!newId) return;
    setSelectedTierList(newId);
    setSourceList(null);
    setShowCreateModal(false);
    setViewingVersion(null);
    boardBeforeVersion.current = null;
    showTierListInUrl(newId);
    await saveBoard(newId);
    refreshTierLists();
  };

  const handleSendToList = async () => {
    if (!sourceList) return;
    const listName = sourceList.name || 'the list';
    if (
      !(await confirm({
        title: `Send this board to "${listName}"?`,
        message:
          'It replaces the order and tiers of the list. Players in the Pool go under "Unplaced", and notes stay for players still on the list.',
        confirmLabel: 'Send',
      }))
    )
      return;
    try {
      setIsSending(true);
      await sendTierBoardToList(sourceList.id, boardToSaved(board));
      toast.success(`Sent to "${listName}"`);
    } catch (err) {
      console.error('Failed to send board to list', err);
      toast.error(err.message || 'Failed to send board to list');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!initialLoaded && initialTierListId && allPlayers.length) {
      handleLoadTierList(initialTierListId);
      setInitialLoaded(true);
    }
  }, [initialLoaded, initialTierListId, allPlayers.length, handleLoadTierList]);

  // Get current tier list name for export
  const getCurrentTierListName = () => {
    if (selectedTierList) {
      const currentList = tierLists.find(
        (list) => list.id === selectedTierList
      );
      return currentList?.name || 'Tier List';
    }
    return 'Tier List';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10 text-white">
        Loading players...
      </div>
    );
  }

  return (
    <div className="flex relative">
      {!drawerOpen && !screenshotMode && (
        <OpenDrawerButton onClick={() => setDrawerOpen(true)} />
      )}

      <DrawerShell isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <AddPlayerDrawer
          onClose={() => setDrawerOpen(false)}
          allPlayers={availablePlayersForDrawer}
          onSelect={(player) => {
            addPlayerToPool(player);
          }}
        />
      </DrawerShell>

      <div
        className={`flex-1 transition-[margin] duration-300 ease-in-out ${
          drawerOpen ? 'md:ml-[300px]' : 'ml-0'
        }`}
      >
        <div className="flex flex-col gap-2 w-full max-w-[1000px] mx-auto px-2 pt-6 pb-28">
          {viewingVersion && !screenshotMode && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
            >
              <span>
                Viewing this board as saved on{' '}
                <strong>{versionTitle(viewingVersion)}</strong>.
                Changes here are not saved unless you restore it.
              </span>
              <span className="flex gap-2">
                <button
                  onClick={restoreVersion}
                  className="px-2 py-1 rounded bg-amber-500/80 hover:bg-amber-500 text-black"
                >
                  Restore this version
                </button>
                <button
                  onClick={backToCurrent}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white"
                >
                  Back to current
                </button>
              </span>
            </div>
          )}
          {!screenshotMode && (
            <div className="flex justify-between items-center mb-1">
              <button
                onClick={addTier}
                className="px-3 py-1 text-sm rounded bg-white/10 hover:bg-white/20 transition-all text-white"
              >
                Add Tier
              </button>
              <button
                onClick={resetBoard}
                className="px-3 py-1 text-sm rounded bg-white/10 hover:bg-red-500 transition-all text-white"
              >
                Reset
              </button>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={tierOrder.filter((t) => t !== POOL).map(tierDragId)}
              strategy={verticalListSortingStrategy}
            >
              {tierOrder.map((tier) => (
                <TierRow
                  key={tier}
                  tier={tier}
                  players={tiers[tier]}
                  canMoveUp={canMove(tierOrder, tier, 'up')}
                  canMoveDown={canMove(tierOrder, tier, 'down')}
                  screenshotMode={screenshotMode}
                  movePlayer={movePlayer}
                  removePlayer={removePlayer}
                  renameTier={renameTier}
                  deleteTier={deleteTier}
                />
              ))}
            </SortableContext>
            <DragOverlay>
              {activePlayer ? (
                <div className="cursor-grabbing shadow-2xl">
                  <TierPlayerTile player={activePlayer} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {!screenshotMode && (
            <div className="flex items-center gap-2 flex-wrap mt-4 justify-center">
              <div className="flex items-center gap-1">
                <select
                  value={selectedTeam?.id || ''}
                  onChange={(e) =>
                    setSelectedTeam(
                      TeamListFull.find((t) => t.id === e.target.value) || null
                    )
                  }
                  className="bg-[#1a1a1a] text-white text-sm px-2 py-1 rounded border border-white/10"
                >
                  <option value="">Add Team...</option>
                  {TeamListFull.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.teamName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddTeamRoster}
                  className="px-2 py-1 text-sm rounded bg-white/10 hover:bg-white/20 text-white"
                >
                  Add Team
                </button>
              </div>

              <div className="flex items-center gap-1">
                <select
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                  className="bg-[#1a1a1a] text-white text-sm px-2 py-1 rounded border border-white/10"
                >
                  <option value="">Add List...</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddList}
                  className="px-2 py-1 text-sm rounded bg-white/10 hover:bg-white/20 text-white"
                >
                  Add List
                </button>
              </div>

              <div className="flex items-center gap-1">
                <select
                  value={selectedTierList}
                  onChange={async (e) => {
                    const id = e.target.value;
                    if (!(await confirmDiscard())) return;
                    // Save a change still waiting on autosave before leaving.
                    if (isDirty && selectedTierList && !viewingVersion) {
                      await saveBoard(selectedTierList, { silent: true });
                    }
                    handleLoadTierList(id);
                  }}
                  className="bg-[#1a1a1a] text-white text-sm px-2 py-1 rounded border border-white/10"
                >
                  <option value="">Load Tier List...</option>
                  {tierLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-2 py-1 text-sm rounded bg-white/10 hover:bg-white/20 text-white"
                >
                  New
                </button>
              </div>

              {selectedTierList && (
                <button
                  onClick={saveNamedVersion}
                  disabled={!!viewingVersion || isSaving}
                  className="px-2 py-1 text-sm rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-40"
                >
                  Save as version
                </button>
              )}
              {selectedTierList && versions.length > 0 && (
                <select
                  aria-label="History"
                  value={viewingVersion?.id || ''}
                  onChange={(e) =>
                    e.target.value
                      ? viewVersion(e.target.value)
                      : backToCurrent()
                  }
                  className="bg-[#1a1a1a] text-white text-sm px-2 py-1 rounded border border-white/10"
                >
                  <option value="">History...</option>
                  {versions.some((v) => v.label) && (
                    <optgroup label="Named">
                      {versions
                        .filter((v) => v.label)
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {versionTitle(v)}
                          </option>
                        ))}
                    </optgroup>
                  )}
                  <optgroup label="By day">
                    {versions
                      .filter((v) => !v.label)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {versionTitle(v)}
                        </option>
                      ))}
                  </optgroup>
                </select>
              )}
            </div>
          )}
        </div>
      </div>
      {!drawerOpen && (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
          <button
            onClick={() => setScreenshotMode(!screenshotMode)}
            className={`px-4 py-2 rounded transition-all duration-300 ${
              screenshotMode
                ? 'opacity-0 hover:opacity-80 bg-red-700 text-white'
                : 'bg-black/20 text-white hover:bg-white/20'
            }`}
          >
            {screenshotMode ? 'Exit Screenshot View' : 'Screenshot View'}
          </button>

          {!screenshotMode && (
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 rounded bg-neutral-600 hover:bg-neutral-700 text-white transition-all duration-300"
            >
              Export
            </button>
          )}
        </div>
      )}

      {!screenshotMode && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {sourceList && (
            <button
              onClick={handleSendToList}
              disabled={isSending}
              title={`Made from the list "${sourceList.name}"`}
              className="bg-black/20 text-white px-4 py-2 rounded hover:bg-white/20 disabled:opacity-40"
            >
              {isSending ? 'Sending...' : `Send to "${sourceList.name}"`}
            </button>
          )}
          <button
            onClick={() => handleSaveTierList()}
            disabled={isSaving}
            className="bg-black/20 text-white px-4 py-2 rounded hover:bg-white/20"
          >
            {isSaving
              ? 'Saving...'
              : selectedTierList && !isDirty && !viewingVersion
                ? 'Saved'
                : 'Save'}
          </button>
        </div>
      )}

      {confirmDialog}

      <NamePromptModal
        isOpen={!!namePrompt}
        onClose={() => setNamePrompt(null)}
        {...(namePrompt?.kind === 'version'
          ? {
              title: 'Save as version',
              description:
                'Keeps the board as it is now under this name. Later saves never replace it.',
              placeholder: 'e.g. Preseason or After Week 4',
              onSubmit: submitNamedVersion,
            }
          : namePrompt?.kind === 'renameTier'
            ? {
                title: 'Rename tier',
                initialValue: namePrompt.tier,
                onSubmit: (name) => submitRenameTier(namePrompt.tier, name),
              }
            : {
                title: 'Add tier',
                placeholder: 'e.g. Elite',
                confirmLabel: 'Add',
                onSubmit: submitAddTier,
              })}
      />

      <CreateTierListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreateAndSave}
      />

      {showExportModal && (
        <TierMakerExport
          tiers={tiers}
          tierOrder={tierOrder}
          tierListName={getCurrentTierListName()}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};

export default TierMakerBoard;
