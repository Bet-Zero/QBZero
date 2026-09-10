import React from 'react';
import { SubRoleMasterList } from '@/constants/SubRoleMasterList';

const MiniSubRoleLine = ({ roles = [] }) => {
  const getRoleData = (roleName) =>
    SubRoleMasterList.find((r) => r.name === roleName);

  return (
    <div className="flex flex-wrap gap-1 text-[10px] w-full justify-center">
      {roles.length > 0 ? (
        roles.map((role) => {
          const roleData = getRoleData(role);
          if (!roleData) return null;

          return (
            <div
              key={role}
              className="flex items-center gap-1 px-2 py-[1px] rounded-md bg-[#2a2a2a]"
            >
              <span
                className={
                  roleData.isPositive ? 'text-green-500' : 'text-red-500'
                }
              >
                {roleData.isPositive ? '✓' : '✗'}
              </span>
              <span className="text-white truncate">{role}</span>
            </div>
          );
        })
      ) : (
        <span className="text-neutral-600 italic">None</span>
      )}
    </div>
  );
};

const PlayerSubRolesMini = ({ subRoles }) => (
  <div className="w-[180px] rounded-md p-2 mt-1 shadow-sm">
    <div className="text-[11px] font-semibold mb-2 text-purple-400">
      Subroles
    </div>
    <MiniSubRoleLine roles={subRoles?.offense || []} />
  </div>
);

export default PlayerSubRolesMini;
