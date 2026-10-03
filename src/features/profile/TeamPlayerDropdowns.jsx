// src/features/profile/TeamPlayerDropdowns.jsx

import React, { useEffect } from 'react';
import { styles } from '@/constants/styles';
import { getPlayersForTeam } from '@/utils/profileHelpers';

const TeamPlayerDropdowns = ({
  teams,
  playersData,
  selectedTeam,
  setSelectedTeam,
  selectedPlayer,
  setSelectedPlayer,
  filteredKeys,
  setFilteredKeys,
}) => {
  useEffect(() => {
    if (!selectedTeam) {
      setFilteredKeys([]);
      setSelectedPlayer('');
      return;
    }

    // The same list search and the arrows use. This one also required a
    // nested bio.Position of 'QB', which some saved records lack (see
    // usePlayerData), so picking such a player from search jumped to a
    // teammate instead.
    const filtered = getPlayersForTeam(playersData, selectedTeam);

    setFilteredKeys(filtered);

    // Auto-select first QB if current selection is invalid
    if (!filtered.includes(selectedPlayer)) {
      setSelectedPlayer(filtered[0] || '');
    }
  }, [
    selectedTeam,
    playersData,
    selectedPlayer,
    setFilteredKeys,
    setSelectedPlayer,
  ]);

  return (
    <div className="flex flex-col gap-1 mt-[2px]">
      <select
        value={selectedTeam}
        onChange={(e) => setSelectedTeam(e.target.value)}
        className={styles.select}
      >
        <option value="">Select Team</option>
        {teams.map((team) => (
          <option key={team} value={team}>
            {team}
          </option>
        ))}
      </select>

      <select
        value={selectedPlayer}
        onChange={(e) => setSelectedPlayer(e.target.value)}
        className={styles.select}
        disabled={!selectedTeam}
      >
        <option value="">Select Player</option>
        {filteredKeys.map((key) => (
          <option key={key} value={key}>
            {playersData[key]?.display_name || playersData[key]?.name || key}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TeamPlayerDropdowns;
