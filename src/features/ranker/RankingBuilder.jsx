import React, { useState, useMemo } from 'react';
import usePlayerData from '@/hooks/usePlayerData.js';
import useFirebaseQuery from '@/hooks/useFirebaseQuery';
import { POSITION_MAP } from '@/utils/roles';
import { TeamListFull } from '@/constants/teamList';
import DrawerShell from '@/components/shared/ui/drawers/DrawerShell';
import OpenDrawerButton from '@/components/shared/ui/drawers/OpenDrawerButton';
import AddPlayerDrawer from '@/features/roster/AddPlayerDrawer';
import RankingSession from './RankingSession';
import TierPlayerTile from '@/features/lists/TierPlayerTile';

const RankingBuilder = ({ onStartRanking }) => {
  const { players: allPlayers, loading } = usePlayerData();
  const { data: listsData } = useFirebaseQuery('lists');

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
        defenseRoles: [
          player.roles?.defense1?.toLowerCase() || '',
          player.roles?.defense2?.toLowerCase() || '',
        ],
        offenseSubroles: player.subRoles?.offense || [],
        defenseSubroles: player.subRoles?.defense || [],
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
    processedPlayers.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [processedPlayers]);

  const [pool, setPool] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedList, setSelectedList] = useState('');

  const lists = useMemo(() => {
    if (!listsData) return [];
    return Object.entries(listsData).map(([id, data]) => ({
      id,
      name: data.name,
      playerIds: data.order || [],
    }));
  }, [listsData]);

  const addPlayerToPool = (player) => {
    setPool((prev) => {
      if (prev.some((p) => p.id === player.id)) return prev;
      return [...prev, player];
    });
  };

  const addPlayersToPool = (players) => {
    setPool((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newPlayers = players.filter((p) => !existingIds.has(p.id));
      return [...prev, ...newPlayers];
    });
  };

  const handleAddTeam = () => {
    if (!selectedTeam) return;
    const teamPlayers = processedPlayers.filter(
      (p) => p.team === selectedTeam.teamName.toLowerCase()
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

  const removePlayer = (id) => {
    setPool((prev) => prev.filter((p) => p.id !== id));
  };

  const handleStartRanking = () => {
    if (pool.length < 2) return;
    onStartRanking?.(pool);
  };

  if (loading) {
    return <div className="p-4 text-white">Loading players...</div>;
  }

  return (
    <div className="flex relative">
      {!drawerOpen && <OpenDrawerButton onClick={() => setDrawerOpen(true)} />}

      <DrawerShell isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <AddPlayerDrawer
          onClose={() => setDrawerOpen(false)}
          allPlayers={processedPlayers}
          onSelect={(player) => {
            addPlayerToPool(player);
          }}
        />
      </DrawerShell>

      <div
        className={`flex-1 transition-[margin] duration-300 ease-in-out ${
          drawerOpen ? 'ml-[300px]' : 'ml-0'
        }`}
      >
        <div className="p-4 text-white max-w-[900px] mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center sm:text-left">
            QB Pool Builder
          </h1>
          <p className="text-white/70 mb-6 text-center sm:text-left">
            Select the quarterbacks you want to rank. Add from NFL teams or
            saved lists, then click Start Ranking to begin the QB ranking
            process.
          </p>
          <h2 className="text-lg sm:text-xl font-semibold mb-3">Player Pool</h2>
          <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
            {pool.map((p) => (
              <div key={p.id} className="relative">
                <TierPlayerTile player={{ ...p, player_id: p.id }} />
                <button
                  onClick={() => removePlayer(p.id)}
                  className="absolute top-1 right-1 text-xs text-red-300 bg-black/40 px-[4px] rounded hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2 flex-wrap mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedTeam?.id || ''}
                onChange={(e) =>
                  setSelectedTeam(
                    TeamListFull.find((t) => t.id === e.target.value) || null
                  )
                }
                className="w-full sm:w-auto bg-[#1a1a1a] text-white text-sm px-2 py-1 rounded border border-white/10"
              >
                <option value="">Add Team...</option>
                {TeamListFull.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.teamName}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddTeam}
                className="w-full sm:w-auto px-3 py-1 text-sm rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Add Team
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedList}
                onChange={(e) => setSelectedList(e.target.value)}
                className="w-full sm:w-auto bg-[#1a1a1a] text-white text-sm px-2 py-1 rounded border border-white/10"
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
                className="w-full sm:w-auto px-3 py-1 text-sm rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Add List
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 justify-center sm:justify-start">
            <button
              onClick={() => setPool([])}
              className="w-full sm:w-auto px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Clear Pool
            </button>
            <button
              onClick={handleStartRanking}
              disabled={pool.length < 2}
              className="w-full sm:w-auto px-4 py-2 rounded bg-black/20 hover:bg-white/20 text-white disabled:opacity-50 transition-colors font-semibold"
            >
              Start Ranking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingBuilder;
