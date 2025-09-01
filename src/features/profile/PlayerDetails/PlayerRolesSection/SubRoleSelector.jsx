import React, { useState, useEffect, useRef } from 'react';
import { NotebookText } from 'lucide-react';
import { SubRoleMasterList } from '@/constants/SubRoleMasterList';
import { isPositiveSubRole } from '@/utils/roles';

const PLAYER_TRAIT_GROUPS = [
  'Arm Talent',
  'Processing',
  'Mobility',
  'Pocket',
  'Intangibles',
];

const RoleBadge = ({ role, onEdit }) => (
  <div className="flex items-center h-6 gap-1 pl-3">
    <span
      className={
        isPositiveSubRole(role)
          ? 'text-green-500 text-[11px]'
          : 'text-red-500 text-[11px]'
      }
    >
      {isPositiveSubRole(role) ? '✓' : '✗'}
    </span>
    <span className="text-white text-[11px] truncate">{role}</span>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onEdit(role);
      }}
      className="text-black hover:text-white"
      title={`Edit ${role} blurb`}
    >
      <NotebookText size={14} strokeWidth={1.25} />
    </button>
  </div>
);

const SelectedRoleList = ({ roles, onEdit }) => (
  <>
    {roles.length > 0 ? (
      roles.map((role) => <RoleBadge key={role} role={role} onEdit={onEdit} />)
    ) : (
      <div className="h-full flex items-center justify-center text-neutral-500 italic text-[11px]">
        Click to add traits
      </div>
    )}
  </>
);

const RoleGroup = ({ group, selected, onToggle }) => {
  const groupRoles = SubRoleMasterList.filter((r) => r.group === group);
  if (groupRoles.length === 0) return null;

  const positiveRoles = groupRoles.filter((r) => r.isPositive);
  const negativeRoles = groupRoles.filter((r) => !r.isPositive);

  return (
    <div className="mb-4">
      <div className="text-sm font-semibold mb-1 pl-3">{group}</div>
      <div className="flex gap-4">
        <div className="w-1/2">
          {positiveRoles.map((role) => (
            <div
              key={role.name}
              className={`flex items-center px-3 py-1 mb-1 rounded cursor-pointer text-[11px] ${
                selected.includes(role.name) ? 'bg-gray-700' : 'bg-neutral-800'
              }`}
              onClick={() => onToggle(role.name)}
            >
              <span className="text-green-500 mr-2">✓</span>
              {role.name}
            </div>
          ))}
        </div>
        <div className="w-1/2">
          {negativeRoles.map((role) => (
            <div
              key={role.name}
              className={`flex items-center px-3 py-1 mb-1 rounded cursor-pointer text-[11px] ${
                selected.includes(role.name) ? 'bg-gray-700' : 'bg-neutral-800'
              }`}
              onClick={() => onToggle(role.name)}
            >
              <span className="text-red-500 mr-2">✗</span>
              {role.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TraitsModal = ({ selection, onToggle, onClose, modalRef }) => (
  <div className="fixed inset-0 z-50 flex justify-center items-center">
    <div className="absolute inset-0 bg-black bg-opacity-70" />
    <div
      ref={modalRef}
      className="relative bg-[#1f1f1f] p-6 rounded-xl w-[90%] max-w-[1000px] max-h-[80vh] overflow-y-auto text-white"
    >
      <button
        className="absolute top-4 right-4 text-white text-xl font-bold"
        onClick={onClose}
      >
        ✖
      </button>
      <h2 className="text-lg font-bold mb-4 text-center">
        Traits & Tendencies
      </h2>
      <div>
        {PLAYER_TRAIT_GROUPS.map((group) => (
          <RoleGroup
            key={group}
            group={group}
            selected={selection.offense || []}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  </div>
);

const SubRoleSelector = ({ subRoles = {}, setSubRoles, setOpenModal }) => {
  const safeSubRoles = {
    offense: Array.isArray(subRoles.offense) ? subRoles.offense : [],
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSelection, setTempSelection] = useState({ ...safeSubRoles });
  const modalRef = useRef(null);

  useEffect(() => {
    setTempSelection({ ...safeSubRoles });
  }, [subRoles]);

  const handleClose = () => {
    setSubRoles(tempSelection);
    setIsModalOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen, tempSelection]);

  const handleToggle = (roleName) => {
    const roleData = SubRoleMasterList.find((r) => r.name === roleName);
    if (!roleData) return;

    setTempSelection((prev) => {
      const currentList = prev.offense || [];
      return {
        offense: currentList.includes(roleName)
          ? currentList.filter((r) => r !== roleName)
          : [...currentList, roleName],
      };
    });
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleEdit = (role) => setOpenModal?.(`trait_${role}`);

  return (
    <div className="w-full cursor-pointer" onClick={handleOpen}>
      <div className="h-20 rounded-lg -mt-1.5">
        <SelectedRoleList roles={safeSubRoles.offense} onEdit={handleEdit} />
      </div>
      {isModalOpen && (
        <TraitsModal
          selection={tempSelection}
          onToggle={handleToggle}
          onClose={handleClose}
          modalRef={modalRef}
        />
      )}
    </div>
  );
};

export default SubRoleSelector;
