import React, { useId, useState } from 'react';
import {
  X,
  User,
  Camera,
  FileText,
  Search,
  Users,
  UserPlus,
} from 'lucide-react';
import useQBRoster from '@/hooks/useQBRoster';
import { TEAM_LOGO_MAP as teamLogoMap } from '@/utils/formatting/teamLogos';
import { isActive } from '@/constants/playerStatus';
import useModalBehavior from '@/hooks/useModalBehavior';
import { toRosterEntry } from '@/utils/rankings/personalRankingEntries';

// `onAdd` takes an array, always. It used to take one quarterback and be called
// in a loop for "Add All", which meant every call in that loop read the same
// stale board length and gave every quarterback the same rank.
const AddQBModal = ({ onClose, onAdd, existingIds = new Set() }) => {
  const { roster, loading } = useQBRoster();
  const fieldId = useId();
  // Off for the backdrop: this dialog holds a part-typed manual entry often
  // enough that a stray click discarding it would be its own bug report.
  const { panelRef } = useModalBehavior(onClose, { closeOnBackdrop: false });
  const [showQBPool, setShowQBPool] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    team: '',
    imageUrl: '',
    notes: '',
  });
  const [addedCount, setAddedCount] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) return;

    // A typed name may well be someone already on the roster -- match it before
    // falling back to guessing a headshot path from the name, which is how a
    // manual entry used to end up with a broken image and no link to a record.
    const match = roster.find(
      (qb) => qb.name.toLowerCase() === name.toLowerCase()
    );

    onAdd([
      match
        ? { ...toRosterEntry(match), notes: formData.notes }
        : {
            ...formData,
            name,
            imageUrl: formData.imageUrl || '/assets/headshots/default.png',
          },
    ]);

    // Reset form but keep modal open
    setFormData({
      name: '',
      team: '',
      imageUrl: '',
      notes: '',
    });
    setAddedCount((prev) => prev + 1);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleQBSelect = (qb) => {
    onAdd([toRosterEntry(qb)]);
    setAddedCount((prev) => prev + 1);
  };

  // Retired quarterbacks stay addable -- a past-season board needs them -- but
  // they are not what "add everyone" means, so Add All takes the active ones.
  const handleAddAll = () => {
    onAdd(addAllQBs.map(toRosterEntry));
    setAddedCount((prev) => prev + addAllQBs.length);
  };

  // Matched by id, so a manual entry with the same name no longer hides a
  // roster quarterback from the pool.
  const availableQBs = roster.filter((qb) => !existingIds.has(qb.id));
  const addAllQBs = availableQBs.filter((qb) => isActive(qb.status));

  const filteredQBs = availableQBs.filter((qb) =>
    qb.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${fieldId}-title`}
        tabIndex={-1}
        className="bg-[#1a1a1a] rounded-xl border border-white/20 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <User className="text-blue-500" size={24} />
            <div>
              <h2
                id={`${fieldId}-title`}
                className="text-xl font-bold text-white"
              >
                Add New QB
              </h2>
              {addedCount > 0 && (
                <div className="text-sm text-green-400">
                  {addedCount} QB{addedCount > 1 ? 's' : ''} added this session
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="text-white/60" size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setShowQBPool(true)}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
              showQBPool
                ? 'bg-blue-600 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={16} className="inline mr-2" />
            QB Pool ({loading ? '…' : availableQBs.length})
          </button>
          <button
            onClick={() => setShowQBPool(false)}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
              !showQBPool
                ? 'bg-blue-600 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <User size={16} className="inline mr-2" />
            Manual Entry
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {!showQBPool ? (
            /* Manual Entry Tab */
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* QB Name */}
              <div>
                <label
                  htmlFor={`${fieldId}-name`}
                  className="block text-white/80 font-medium mb-2"
                >
                  QB Name *
                </label>
                <input
                  id={`${fieldId}-name`}
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter quarterback name..."
                  className="w-full p-3 bg-neutral-700 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
                <div className="text-xs text-white/50 mt-1">
                  A name already on the roster is matched automatically, keeping
                  its headshot and record.
                </div>
              </div>

              {/* Team */}
              <div>
                <label
                  htmlFor={`${fieldId}-team`}
                  className="block text-white/80 font-medium mb-2"
                >
                  Team (Optional)
                </label>
                <input
                  id={`${fieldId}-team`}
                  type="text"
                  value={formData.team}
                  onChange={(e) =>
                    handleInputChange('team', e.target.value.toUpperCase())
                  }
                  placeholder="e.g., BUF, KC, CIN..."
                  maxLength={3}
                  className="w-full p-3 bg-neutral-700 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              {/* Image URL */}
              <div>
                <label
                  htmlFor={`${fieldId}-image`}
                  className="flex items-center gap-2 text-white/80 font-medium mb-2"
                >
                  <Camera size={16} />
                  Image URL (Optional)
                </label>
                <input
                  id={`${fieldId}-image`}
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    handleInputChange('imageUrl', e.target.value)
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full p-3 bg-neutral-700 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none transition-all"
                />
                <div className="text-xs text-white/50 mt-1">
                  Leave blank to auto-generate from headshots folder
                </div>
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor={`${fieldId}-notes`}
                  className="flex items-center gap-2 text-white/80 font-medium mb-2"
                >
                  <FileText size={16} />
                  Notes (Optional)
                </label>
                <textarea
                  id={`${fieldId}-notes`}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add your thoughts about this QB..."
                  rows={3}
                  className="w-full p-3 bg-neutral-700 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none resize-none transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-white font-medium transition-all"
                >
                  Done
                </button>
                <button
                  type="submit"
                  disabled={!formData.name.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all"
                >
                  Add QB
                </button>
              </div>
            </form>
          ) : (
            /* QB Pool Tab */
            <div className="p-6 space-y-4">
              {/* Search and Add All */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                    size={16}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search QBs by name..."
                    className="w-full pl-10 pr-4 py-3 bg-[#121212] border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
                <button
                  onClick={handleAddAll}
                  disabled={addAllQBs.length === 0}
                  title="Add every active quarterback not already on the board"
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-neutral-600 to-neutral-700 hover:from-neutral-700 hover:to-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all whitespace-nowrap"
                >
                  <UserPlus size={16} />
                  Add All ({addAllQBs.length})
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-white/60 text-sm">
                  Loading the quarterback pool…
                </div>
              ) : availableQBs.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <div className="text-lg mb-2">🎉 All QBs Added!</div>
                  <div className="text-sm">
                    You&apos;ve added all available quarterbacks to your
                    rankings.
                  </div>
                </div>
              ) : (
                <>
                  {/* QB Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {filteredQBs.map((qb) => (
                      <button
                        key={qb.id}
                        onClick={() => handleQBSelect(qb)}
                        className="flex items-center gap-3 p-3 bg-[#121212] hover:bg-[#1f1f1f] border border-white/10 hover:border-blue-500/50 rounded-lg transition-all text-left group"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#0a0a0a] flex-shrink-0">
                          <img
                            src={`/assets/headshots/${qb.id}.png`}
                            alt={qb.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/assets/headshots/default.png';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white group-hover:text-blue-300 transition-colors truncate">
                            {qb.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {!isActive(qb.status) && (
                              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/10 text-white/50 flex-shrink-0">
                                Retired
                              </span>
                            )}
                            {qb.team && qb.team !== 'N/A' ? (
                              <>
                                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                  <img
                                    src={`/assets/logos/${teamLogoMap[qb.team] || qb.team.toLowerCase()}.svg`}
                                    alt={qb.team}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display =
                                        'inline';
                                    }}
                                  />
                                  <span className="text-xs text-white/60 font-medium hidden">
                                    {qb.team}
                                  </span>
                                </div>
                                <span className="text-xs text-white/60">
                                  {qb.team}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-white/40 italic">
                                {qb.team === 'N/A'
                                  ? 'Free Agent'
                                  : 'Click to add'}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {filteredQBs.length === 0 && searchTerm && (
                    <div className="text-center py-8 text-white/40">
                      No available QBs found matching &quot;{searchTerm}&quot;
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddQBModal;
