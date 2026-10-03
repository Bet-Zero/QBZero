// PlayerProfileView.jsx

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import usePlayerData from '@/hooks/usePlayerData.js';
import useAutoSavePlayer from '@/hooks/useAutoSavePlayer';

import TeamPlayerDropdowns from '@/features/profile/TeamPlayerDropdowns';
import PlayerNavigation from '@/features/profile/PlayerNavigation';
import PlayerDetails from '@/features/profile/PlayerDetails';
import BreakdownModal from '@/features/profile/BreakdownModal';
import { getPlayersForTeam } from '@/utils/profileHelpers';
import PlayerSearchBar from '@/features/profile/PlayerSearchBar';
import { emptyTraits } from '@/constants/traits';
import { normalizePlayerData } from '@/utils/roster';

const defaultTraits = emptyTraits();

const defaultRoles = {
  offense1: '',
  offense2: '',
  armTalent: 50,
};

const defaultBlurbs = {
  traits: {},
  roles: {},
  subroles: {},
  runningProfile: '',
  playStyle: '',
  overall: '',
};

const PlayerProfileView = () => {
  const { players: fetchedPlayers, loading: isLoading } = usePlayerData();
  const [playersData, setPlayersData] = useState({});
  const [filteredKeys, setFilteredKeys] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [player, setPlayer] = useState(null);
  const [traits, setTraits] = useState(defaultTraits);
  const [roles, setRoles] = useState(defaultRoles);
  const [runningProfile, setRunningProfile] = useState('');
  const [subRoles, setSubRoles] = useState({ offense: [] });
  const [badges, setBadges] = useState([]);
  const [openModal, setOpenModal] = useState(null);
  const [editedBlurbs, setEditedBlurbs] = useState(defaultBlurbs);
  const [overallGrade, setOverallGrade] = useState(null);
  const [status, setStatus] = useState('active');
  const [team, setTeam] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const data = {};
    fetchedPlayers.forEach((p) => {
      data[p.id] = p;
    });
    setPlayersData(data);
  }, [fetchedPlayers]);

  // Derived from the working copy, so a team changed on a profile shows up in
  // the team dropdown without a reload.
  const teams = useMemo(() => {
    const teamSet = new Set();
    Object.values(playersData).forEach((p) => {
      const t = p.bio?.Team || p.team;
      if (t) teamSet.add(t);
    });
    return Array.from(teamSet).sort((a, b) => a.localeCompare(b));
  }, [playersData]);

  // Load the editor from the record when the selection changes -- and only
  // then. A save updates playersData below, and reloading the editor from it
  // would roll back whatever was typed while that save was in flight.
  const loadedPlayerRef = useRef(null);
  useEffect(() => {
    if (!selectedPlayer || !playersData[selectedPlayer]) {
      loadedPlayerRef.current = null;
      setPlayer(null);
      return;
    }
    if (loadedPlayerRef.current === selectedPlayer) return;
    loadedPlayerRef.current = selectedPlayer;

    const data = playersData[selectedPlayer];
    setPlayer(data);
    setTraits(data.traits || { ...defaultTraits });
    setRoles({ ...defaultRoles, ...(data.roles || {}) });
    setSubRoles(data.subRoles || { offense: [] });
    setBadges(data.badges || []);
    // normalizePlayerData fills an empty running profile with '—' for the
    // table's benefit. Loaded as-is, the next save stored the dash.
    setRunningProfile(
      data.runningProfile && data.runningProfile !== '—'
        ? data.runningProfile
        : ''
    );
    setEditedBlurbs(data.blurbs || { ...defaultBlurbs });
    setOverallGrade(data.overall_grade || null);
    setStatus(data.status || 'active');
    setTeam(data.bio?.Team || '');
    setHasChanges(false);
  }, [selectedPlayer, playersData]);

  // Keep the working copy in step with what was written, so coming back to a
  // player shows their saved values rather than the ones from page load.
  const handleSaved = useCallback(
    (id, update) => {
      setPlayersData((prev) =>
        prev[id]
          ? { ...prev, [id]: normalizePlayerData({ ...prev[id], ...update }) }
          : prev
      );
      // Follow a player whose team just changed into their new team's list,
      // rather than letting the dropdown jump to someone else.
      if (id === selectedPlayer && update.bio?.Team) {
        setSelectedTeam(update.bio.Team);
      }
    },
    [selectedPlayer]
  );

  useAutoSavePlayer({
    playerId: selectedPlayer,
    player,
    team,
    traits,
    roles,
    subRoles,
    badges,
    runningProfile,
    overallGrade,
    status,
    blurbs: editedBlurbs,
    hasChanges,
    setHasChanges,
    onSaved: handleSaved,
  });

  const handlePrevPlayer = useCallback(() => {
    if (!selectedTeam || !selectedPlayer) return;
    const currentIndex = filteredKeys.indexOf(selectedPlayer);
    if (currentIndex > 0) setSelectedPlayer(filteredKeys[currentIndex - 1]);
  }, [selectedTeam, selectedPlayer, filteredKeys]);

  const handleNextPlayer = useCallback(() => {
    if (!selectedTeam || !selectedPlayer) return;
    const currentIndex = filteredKeys.indexOf(selectedPlayer);
    if (currentIndex < filteredKeys.length - 1)
      setSelectedPlayer(filteredKeys[currentIndex + 1]);
  }, [selectedTeam, selectedPlayer, filteredKeys]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevPlayer();
      else if (e.key === 'ArrowRight') handleNextPlayer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevPlayer, handleNextPlayer]);

  const handleTraitChange = (e, trait) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.round((clickX / rect.width) * 100);
    setTraits((prev) => ({ ...prev, [trait]: percentage }));
    setHasChanges(true);
  };

  const handleTraitSet = (trait, value) => {
    setTraits((prev) => ({ ...prev, [trait]: value }));
    setHasChanges(true);
  };

  const handleRoleChange = (key, value) => {
    setRoles((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleBlurbChange = (key, value) => {
    setEditedBlurbs((prev) => {
      const updated = { ...prev };
      if (key.startsWith('trait_'))
        updated.traits = { ...prev.traits, [key.slice(6)]: value };
      else if (key.startsWith('role_'))
        updated.roles = { ...prev.roles, [key.slice(5)]: value };
      else if (key.startsWith('subrole_'))
        updated.subroles = { ...prev.subroles, [key.slice(8)]: value };
      else if (key === 'running_profile') updated.runningProfile = value;
      else if (key === 'arm_talent_meter') updated.armTalentMeter = value;
      else if (key === 'play_style') updated.playStyle = value;
      else if (key === 'overall') updated.overall = value;
      return updated;
    });
    setHasChanges(true);
  };

  const handleSearchSelect = (id, team) => {
    if (!id) return;
    setSelectedTeam(team);
    setSelectedPlayer(id);
    const filtered = getPlayersForTeam(playersData, team);
    setFilteredKeys(filtered);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading QBZero...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center gap-6 py-20 relative">
        <div className="absolute top-2 left-4 flex flex-col gap-1 mt-1">
          <PlayerSearchBar
            playersData={playersData}
            onSelect={handleSearchSelect}
          />

          <TeamPlayerDropdowns
            teams={teams}
            playersData={playersData}
            selectedTeam={selectedTeam}
            setSelectedTeam={setSelectedTeam}
            selectedPlayer={selectedPlayer}
            setSelectedPlayer={setSelectedPlayer}
            filteredKeys={filteredKeys}
            setFilteredKeys={setFilteredKeys}
          />
        </div>

        {!player && (
          <div className="text-white/40 mt-10">
            Select a player to view their profile.
          </div>
        )}

        <PlayerNavigation onPrev={handlePrevPlayer} onNext={handleNextPlayer} />

        {player && (
          <PlayerDetails
            player={player}
            selectedPlayer={selectedPlayer}
            traits={traits}
            onTraitChange={handleTraitChange}
            onTraitSet={handleTraitSet}
            roles={roles}
            onRoleChange={handleRoleChange}
            subRoles={subRoles}
            setSubRoles={(val) => {
              setSubRoles(val);
              setHasChanges(true);
            }}
            runningProfile={runningProfile}
            setRunningProfile={(val) => {
              setRunningProfile(val);
              setHasChanges(true);
            }}
            badges={badges}
            setBadges={(val) => {
              setBadges(val);
              setHasChanges(true);
            }}
            editedBlurbs={editedBlurbs}
            onBlurbChange={handleBlurbChange}
            overallGrade={overallGrade}
            setOverallGrade={(val) => {
              setOverallGrade(val);
              setHasChanges(true);
            }}
            status={status}
            setStatus={(val) => {
              setStatus(val);
              setHasChanges(true);
            }}
            team={team}
            setTeam={(val) => {
              setTeam(val);
              setHasChanges(true);
            }}
            setOpenModal={setOpenModal}
          />
        )}

        {openModal && (
          <BreakdownModal
            modalKey={openModal}
            blurbs={editedBlurbs}
            onChange={handleBlurbChange}
            onClose={() => setOpenModal(null)}
          />
        )}
      </div>
    </>
  );
};

export default PlayerProfileView;
