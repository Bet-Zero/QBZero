// src/features/tierMaker/TierMakerBoard.jsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TierRow from '@/features/tierMaker/TierRow';
import usePlayerData from '@/hooks/usePlayerData.js';
import useFirebaseQuery from '@/hooks/useFirebaseQuery';
import { POSITION_MAP } from '@/utils/roles';
import { TeamListFull, teamAbbrFor } from '@/constants/teamList';
import DrawerShell from '@/components/shared/ui/drawers/DrawerShell';
import OpenDrawerButton from '@/components/shared/ui/drawers/OpenDrawerButton';
import AddPlayerDrawer from '@/features/roster/AddPlayerDrawer';
import CreateTierListModal from '@/features/tierMaker/CreateTierListModal';
import TierMakerExport from '@/features/tierMaker/TierMakerExport';
import {
  fetchAllTierLists,
  fetchTierList,
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
  renameTier as renameTierOnBoard,
} from '@/utils/tierMaker/tierBoard';
import { toast } from 'react-hot-toast';

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
      (listsData || []).map((l) => {
        const orderIds = l.playerOrder || [];
        const allIds = l.playerIds || [];
        const merged = [...orderIds];
        allIds.forEach((id) => {
          if (!merged.includes(id)) merged.push(id);
        });
        return {
          id: l.id,
          name: l.name,
          playerIds: merged,
        };
      }),
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const isDirty = boardSignature(board) !== savedSignature;
  const confirmDiscard = () =>
    !isDirty || window.confirm('You have unsaved changes. Discard them?');

  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

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
      const newIndex =
        direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (
        currentIndex < 0 ||
        newIndex < 0 ||
        newIndex >= prev.tierOrder.length
      )
        return prev;
      const toTier = prev.tierOrder[newIndex];
      const player = prev.tiers[fromTier].find(
        (p) => p.player_id === playerId
      );
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

  const addTier = () => {
    const name = prompt('New tier name?');
    if (name === null) return;
    const result = addTierToBoard(board, name);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setBoard(result.board);
  };

  const deleteTier = (tier) => {
    setBoard((prev) => deleteTierFromBoard(prev, tier));
  };

  const renameTier = (tier) => {
    const name = prompt('Rename tier', tier);
    if (name === null) return;
    const result = renameTierOnBoard(board, tier, name);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setBoard(result.board);
  };

  const resetBoard = () => {
    if (!window.confirm('Clear every tier and the pool?')) return;
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
        setBoard(loaded);
        setSavedSignature(boardSignature(loaded));
        setSelectedTierList(id);
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
    [playersMap, showTierListInUrl]
  );

  const handleSaveTierList = async (idOverride) => {
    const listId = idOverride || selectedTierList;
    if (!listId) {
      setShowCreateModal(true);
      return;
    }
    const snapshot = board;
    try {
      setIsSaving(true);
      await saveTierList(listId, boardToSaved(snapshot));
      setSavedSignature(boardSignature(snapshot));
      toast.success('Tier list saved!');
    } catch (err) {
      console.error('Failed to save tier list', err);
      toast.error('Failed to save tier list');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAndSave = async (newId) => {
    if (!newId) return;
    setSelectedTierList(newId);
    setShowCreateModal(false);
    showTierListInUrl(newId);
    await handleSaveTierList(newId);
    refreshTierLists();
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
                  onChange={(e) => {
                    if (confirmDiscard()) handleLoadTierList(e.target.value);
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
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => handleSaveTierList()}
            disabled={isSaving}
            className="bg-black/20 text-white px-4 py-2 rounded hover:bg-white/20"
          >
            {isSaving
              ? 'Saving...'
              : selectedTierList && !isDirty
                ? 'Saved'
                : 'Save'}
          </button>
        </div>
      )}

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
