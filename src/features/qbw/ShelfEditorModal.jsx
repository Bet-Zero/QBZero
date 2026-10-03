import React, { useId, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { useConfirm } from '@/components/shared/ui/ConfirmModal';
import { CRYSTAL_BALL_IMAGES, newBallId } from '@/utils/qbw/shelves';

const inputClass =
  'w-full px-3 py-2 bg-neutral-700 border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:border-blue-500 focus:outline-none';

const move = (list, from, to) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/**
 * Edit one shelf's title and crystal balls; top of the list is the left end of
 * the shelf. Nothing saves until Save.
 */
const ShelfEditorModal = ({ shelf, qbNames = [], onSave, onClose }) => {
  const fieldId = useId();
  const { confirm, confirmDialog } = useConfirm();
  const [title, setTitle] = useState(shelf.title);
  const [qbs, setQbs] = useState(shelf.qbs);
  const [saving, setSaving] = useState(false);

  const dirty =
    title !== shelf.title || JSON.stringify(qbs) !== JSON.stringify(shelf.qbs);

  const updateBall = (id, changes) =>
    setQbs((prev) =>
      prev.map((qb) => (qb.id === id ? { ...qb, ...changes } : qb))
    );

  const requestClose = async () => {
    if (
      dirty &&
      !(await confirm({
        title: 'Discard shelf changes?',
        confirmLabel: 'Discard',
        danger: true,
      }))
    )
      return;
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saved = await onSave({ ...shelf, title: title.trim(), qbs });
    setSaving(false);
    if (saved) onClose();
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${fieldId}-heading`}
        onSubmit={handleSubmit}
        className="bg-[#1a1a1a] border border-white/20 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2
            id={`${fieldId}-heading`}
            className="text-lg font-bold text-white"
          >
            Edit Shelf
          </h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label
              htmlFor={`${fieldId}-title`}
              className="block text-white/80 text-sm font-medium mb-1"
            >
              Shelf Title
            </label>
            <input
              id={`${fieldId}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <datalist id={`${fieldId}-qbs`}>
            {qbNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          {qbs.length === 0 && (
            <p className="text-white/40 text-sm">No crystal balls yet.</p>
          )}

          {qbs.map((qb, index) => (
            <div
              key={qb.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center p-3 rounded-lg bg-white/5"
            >
              <input
                aria-label={`QB ${index + 1} name`}
                list={`${fieldId}-qbs`}
                value={qb.name}
                onChange={(e) => updateBall(qb.id, { name: e.target.value })}
                placeholder="QB name"
                className={inputClass}
              />
              <input
                aria-label={`QB ${index + 1} prediction`}
                value={qb.predictionText}
                onChange={(e) =>
                  updateBall(qb.id, { predictionText: e.target.value })
                }
                placeholder="The call"
                className={inputClass}
              />
              <select
                aria-label={`QB ${index + 1} image`}
                value={qb.imageUrl}
                onChange={(e) =>
                  updateBall(qb.id, { imageUrl: e.target.value })
                }
                className={inputClass}
              >
                <option value="">Generic ball</option>
                {CRYSTAL_BALL_IMAGES.map((image) => (
                  <option key={image.url} value={image.url}>
                    {image.label}
                  </option>
                ))}
                {qb.imageUrl &&
                  !CRYSTAL_BALL_IMAGES.some((i) => i.url === qb.imageUrl) && (
                    <option value={qb.imageUrl}>{qb.imageUrl}</option>
                  )}
              </select>
              <div className="flex items-center gap-1 justify-end">
                <button
                  type="button"
                  onClick={() => setQbs((prev) => move(prev, index, index - 1))}
                  disabled={index === 0}
                  aria-label={`Move ${qb.name || 'QB'} earlier`}
                  className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setQbs((prev) => move(prev, index, index + 1))}
                  disabled={index === qbs.length - 1}
                  aria-label={`Move ${qb.name || 'QB'} later`}
                  className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setQbs((prev) => prev.filter((b) => b.id !== qb.id))
                  }
                  aria-label={`Remove ${qb.name || 'QB'}`}
                  className="p-1.5 rounded text-white/50 hover:text-red-400 hover:bg-white/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setQbs((prev) => [
                ...prev,
                { id: newBallId(), name: '', imageUrl: '', predictionText: '' },
              ])
            }
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
          >
            <Plus size={14} />
            Add QB
          </button>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-white/10">
          <button
            type="button"
            onClick={requestClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white text-sm font-medium"
          >
            {saving ? 'Saving...' : 'Save Shelf'}
          </button>
        </div>
      </form>
      {confirmDialog}
    </div>
  );
};

export default ShelfEditorModal;
