import React, { useState } from 'react';
import {
  X,
  User,
  Camera,
  FileText,
  Search,
  Users,
  UserPlus,
} from 'lucide-react';
import { quarterbacks } from '@/features/ranker/quarterbacks';

// Mapping team abbreviations to logo file names
const teamLogoMap = {
  ARI: 'cardinals',
  ATL: 'falcons',
  BAL: 'ravens',
  BUF: 'bills',
  CAR: 'panthers',
  CHI: 'bears',
  CIN: 'bengals',
  CLE: 'browns',
  DAL: 'cowboys',
  DEN: 'broncos',
  DET: 'lions',
  GB: 'packers',
  HOU: 'texans',
  IND: 'colts',
  JAX: 'jaguars',
  KC: 'chiefs',
  LAC: 'chargers',
  LAR: 'rams',
  LV: 'raiders',
  MIA: 'dolphins',
  MIN: 'vikings',
  NE: 'patriots',
  NO: 'saints',
  NYG: 'giants',
  NYJ: 'jets',
  PHI: 'eagles',
  PIT: 'steelers',
  SF: '49ers',
  SEA: 'seahawks',
  TB: 'buccaneers',
  TEN: 'titans',
  WAS: 'commanders',
};

const AddQBModal = ({ onClose, onAdd, existingQBNames = [] }) => {
  const [showQBPool, setShowQBPool] = useState(false);
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
    if (!formData.name.trim()) return;

    onAdd({
      ...formData,
      imageUrl:
        formData.imageUrl ||
        `/assets/headshots/${formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[.']/g, '')}.png`,
    });

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
    onAdd({
      name: qb.name,
      team: qb.team || '', // Use team from quarterbacks.js
      imageUrl: `/assets/headshots/${qb.id}.png`,
      notes: '',
    });
    setAddedCount((prev) => prev + 1);
  };

  const handleAddAll = () => {
    availableQBs.forEach((qb) => {
      onAdd({
        name: qb.name,
        team: qb.team || '', // Use team from quarterbacks.js
        imageUrl: `/assets/headshots/${qb.id}.png`,
        notes: '',
      });
    });
    setAddedCount((prev) => prev + availableQBs.length);
  };

  // Filter out QBs that are already added to rankings
  const availableQBs = quarterbacks.filter(
    (qb) => !existingQBNames.includes(qb.name)
  );

  // Filter available QBs based on search
  const filteredQBs = availableQBs.filter((qb) =>
    qb.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Some popular QB suggestions for quick add
  const qbSuggestions = [
    'Joe Burrow',
    'Tua Tagovailoa',
    'Dak Prescott',
    'Jalen Hurts',
    'Justin Herbert',
    'Trevor Lawrence',
    'Kyler Murray',
    'Russell Wilson',
  ].filter((name) => !existingQBNames.includes(name));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl border border-white/20 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <User className="text-blue-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">Add New QB</h2>
              {addedCount > 0 && (
                <div className="text-sm text-green-400">
                  {addedCount} QB{addedCount > 1 ? 's' : ''} added this session
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="text-white/60" size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10">
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
          <button
            onClick={() => setShowQBPool(true)}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
              showQBPool
                ? 'bg-blue-600 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={16} className="inline mr-2" />
            QB Pool ({availableQBs.length})
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {showQBPool ? (
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
                  disabled={availableQBs.length === 0}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all whitespace-nowrap"
                >
                  <UserPlus size={16} />
                  Add All ({availableQBs.length})
                </button>
              </div>

              {availableQBs.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <div className="text-lg mb-2">🎉 All QBs Added!</div>
                  <div className="text-sm">
                    You've added all available quarterbacks to your rankings.
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
                      No available QBs found matching "{searchTerm}"
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Manual Entry Tab */
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* QB Name */}
              <div>
                <label className="block text-white/80 font-medium mb-2">
                  QB Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter quarterback name..."
                  className="w-full p-3 bg-neutral-700 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none transition-all"
                  required
                />

                {/* Quick suggestions */}
                {qbSuggestions.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-white/50 mb-2">Quick add:</div>
                    <div className="flex flex-wrap gap-1">
                      {qbSuggestions.slice(0, 6).map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handleInputChange('name', name)}
                          className="text-xs px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded transition-all"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Team */}
              <div>
                <label className="block text-white/80 font-medium mb-2">
                  Team (Optional)
                </label>
                <input
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
                <label className="flex items-center gap-2 text-white/80 font-medium mb-2">
                  <Camera size={16} />
                  Image URL (Optional)
                </label>
                <input
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
                <label className="flex items-center gap-2 text-white/80 font-medium mb-2">
                  <FileText size={16} />
                  Notes (Optional)
                </label>
                <textarea
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
          )}
        </div>
      </div>
    </div>
  );
};

export default AddQBModal;
