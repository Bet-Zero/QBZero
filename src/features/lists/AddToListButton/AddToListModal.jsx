// AddToListModal.jsx
import React, { useEffect, useId, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  fetchAllLists,
  createList,
  addPlayerToList,
} from '@/firebase/listHelpers';

const toastStyle = {
  style: {
    background: '#111111',
    color: '#ffffff',
    border: '1px solid #333',
  },
};

const AddToListModal = ({ player, onClose }) => {
  const fieldId = useId();
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState('');
  const [newListName, setNewListName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAllLists()
      .then((result) =>
        setLists(
          [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        )
      )
      .catch((err) => {
        console.error('Failed to load lists:', err);
        toast.error('Could not load your lists', toastStyle);
      });
  }, []);

  const handleAdd = async () => {
    const trimmedNewName = newListName.trim();
    if (!selectedList && !trimmedNewName) {
      toast.error('Please select or create a list name', toastStyle);
      return;
    }

    setIsSaving(true);
    try {
      if (selectedList) {
        const list = lists.find((l) => l.id === selectedList);
        if (list?.playerIds?.includes(player.id)) {
          toast(`Already in "${list.name}"`, toastStyle);
        } else {
          await addPlayerToList(selectedList, player.id);
          toast.success('Player added to list!', toastStyle);
        }
      } else {
        await createList(trimmedNewName, [player.id]);
        toast.success(
          `List "${trimmedNewName}" created and player added!`,
          toastStyle
        );
      }
      onClose();
    } catch (err) {
      console.error('Failed to save to list:', err);
      toast.error(err.message || 'Failed to save list', toastStyle);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-neutral-900 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-white text-lg font-bold mb-4">Add to List</h2>

        {lists.length > 0 && (
          <div className="mb-4">
            <label
              htmlFor={`${fieldId}-existing`}
              className="text-white/60 text-sm mb-1 block"
            >
              Select Existing List
            </label>
            <select
              id={`${fieldId}-existing`}
              value={selectedList}
              onChange={(e) => setSelectedList(e.target.value)}
              className="w-full bg-neutral-800 text-white p-2 rounded border border-white/10"
            >
              <option value="">-- Choose a list --</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-4">
          <label
            htmlFor={`${fieldId}-new`}
            className="text-white/60 text-sm mb-1 block"
          >
            Or Create New List
          </label>
          <input
            id={`${fieldId}-new`}
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="e.g. Free Agent Rankings"
            className="w-full bg-neutral-800 text-white p-2 rounded border border-white/10"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 bg-white/10 text-white rounded hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={isSaving}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToListModal;
