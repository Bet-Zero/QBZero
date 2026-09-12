import React from 'react';
import PlayerHeader from './PlayerHeader';
import PlayerStatsTable from './PlayerStatsTable';
import PlayerTraitsGrid from './PlayerTraitsGrid';
import PlayerRolesSection from './PlayerRolesSection';
import BadgeSelector from './BadgeSelector';
import OverallBlurbBox from './OverallBlurbBox';
import PlayerStatusToggle from './PlayerStatusToggle';

const PlayerDetails = ({
  player,
  selectedPlayer,
  traits,
  onTraitChange,
  onTraitSet,
  roles,
  onRoleChange,
  subRoles,
  setSubRoles,
  runningProfile,
  setRunningProfile,
  badges,
  setBadges,
  editedBlurbs,
  onBlurbChange,
  overallGrade,
  setOverallGrade,
  status,
  setStatus,
  setOpenModal,
}) => (
  <>
    <div className="relative w-full max-w-[750px]">
      <PlayerHeader player={player} selectedPlayer={selectedPlayer} />
      <PlayerStatusToggle
        status={status}
        onChange={setStatus}
        className="absolute top-0 right-0"
      />
    </div>
    <PlayerStatsTable player={player} />
    <div className="flex gap-[1.25rem] w-full max-w-[750px]">
      <PlayerTraitsGrid
        traits={traits}
        onTraitClick={onTraitChange}
        onTraitSet={onTraitSet}
        setOpenModal={setOpenModal}
      />
      <PlayerRolesSection
        roles={roles}
        onRoleChange={onRoleChange}
        subRoles={subRoles}
        setSubRoles={setSubRoles}
        runningProfile={runningProfile}
        setRunningProfile={setRunningProfile}
        onArmTalentChange={(value) => onRoleChange('armTalent', value)}
        setOpenModal={setOpenModal}
      />
    </div>
    <BadgeSelector badges={badges} setBadges={setBadges} />
    <OverallBlurbBox
      overallBlurb={editedBlurbs.overall || ''}
      setOverallBlurb={(val) => onBlurbChange('overall', val)}
      overallGrade={overallGrade}
      setOverallGrade={(val) => setOverallGrade(val)}
    />
  </>
);

export default PlayerDetails;
