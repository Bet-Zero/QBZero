import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Plus,
  User,
  Shield,
  Pencil,
  Trash2,
} from 'lucide-react';
import { createTake, updateTake, deleteTake } from '@/firebase/takeHelpers';
import useQBRoster from '@/hooks/useQBRoster';
import { toast } from 'react-hot-toast';
import TakeAuthorModal from './TakeAuthorModal';
import AdminGate from './AdminGate';
import useAuth from '@/hooks/useAuth';
import { useConfirm } from '@/components/shared/ui/ConfirmModal';
import {
  emptyTake,
  filterTakes,
  pickTakeFields,
  takeStats,
} from '@/utils/qbw/takes';

const readSavedAuthor = () => {
  try {
    return JSON.parse(localStorage.getItem('takeAuthor')) || null;
  } catch {
    return null;
  }
};

const writeSavedAuthor = (author) => {
  try {
    if (author) localStorage.setItem('takeAuthor', JSON.stringify(author));
    else localStorage.removeItem('takeAuthor');
  } catch {
    // Storage blocked: the author just won't be remembered.
  }
};

const TakeCard = ({ take, onEdit, onDelete }) => {
  const getStatusIcon = () => {
    switch (take.status) {
      case 'correct':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'wrong':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Eye className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (take.status) {
      case 'correct':
        return 'border-green-500/30 bg-green-500/10';
      case 'wrong':
        return 'border-red-500/30 bg-red-500/10';
      case 'pending':
        return 'border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border ${getStatusColor()} transition-all duration-200 hover:scale-[1.02] h-[180px] flex flex-col`}
    >
      <div className="flex items-start gap-3 h-full">
        <div className="flex-shrink-0 mt-1">{getStatusIcon()}</div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-white/90 font-medium line-clamp-2 flex-1">
              {take.title}
            </div>
            <div className="text-xs text-white/40 whitespace-nowrap">
              by {take.authorName}
            </div>
            {onEdit && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(take)}
                  aria-label={`Edit "${take.title}"`}
                  className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(take)}
                  aria-label={`Delete "${take.title}"`}
                  className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-white/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
          <div className="text-white/70 text-sm mb-2 flex-1 line-clamp-3">
            {take.description}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50 mt-auto">
            <span>QB: {take.qbName}</span>
            <span>•</span>
            <span>{take.date}</span>
            {take.status === 'correct' && take.proofDate && (
              <>
                <span>•</span>
                <span className="text-green-400">Proven: {take.proofDate}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TakeBoard = ({ takes = [], loading = false, onChanged = () => {} }) => {
  const { isAdmin, signOut } = useAuth();
  const { roster } = useQBRoster();
  const { confirm, confirmDialog } = useConfirm();
  const fieldId = useId();
  const formRef = useRef(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [author, setAuthor] = useState(null);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [viewingAuthorId, setViewingAuthorId] = useState(null); // null means viewing all takes
  const [formData, setFormData] = useState(emptyTake);
  const [showQbOptions, setShowQbOptions] = useState(false);

  // QB options for whatever has been typed into the QB field.
  const filteredQBs = useMemo(() => {
    const needle = formData.qbName.trim().toLowerCase();
    if (!needle) return [];
    return roster.filter(
      (qb) =>
        qb.name.toLowerCase().includes(needle) &&
        qb.name.toLowerCase() !== needle
    );
  }, [formData.qbName, roster]);

  const [adminMode, setAdminMode] = useState(false);
  const [showAdminGate, setShowAdminGate] = useState(false);

  // Admin mode follows the signed-in account; otherwise pick up a visitor
  // author remembered from an earlier visit.
  useEffect(() => {
    if (isAdmin) {
      setAdminMode(true);
      setAuthor({ id: 'admin', name: 'Admin' });
    } else {
      const savedAuthor = readSavedAuthor();
      if (savedAuthor) setAuthor(savedAuthor);
    }
  }, [isAdmin]);

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyTake());
    setShowQbOptions(false);
  };

  const openNewTake = () => {
    if (showForm && !editingId) {
      closeForm();
      return;
    }
    setEditingId(null);
    setFormData(emptyTake());
    setShowForm(true);
  };

  const openEdit = (take) => {
    setEditingId(take.id);
    setFormData(pickTakeFields(take));
    setShowForm(true);
    setShowQbOptions(false);
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    );
  };

  const handleDelete = async (take) => {
    const ok = await confirm({
      title: 'Delete this take?',
      message: `"${take.title}" will be removed from the board for good.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteTake(take.id);
      if (editingId === take.id) closeForm();
      toast.success('Take deleted');
      onChanged();
    } catch {
      toast.error('Failed to delete take');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!author) {
      setShowAuthorModal(true);
      return;
    }

    const take = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      qbName: formData.qbName.trim(),
      date: formData.date.trim(),
      proofDate: formData.proofDate.trim(),
    };
    if (!take.qbName) {
      toast.error('Pick the QB this take is about');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        await updateTake(editingId, take);
        toast.success('Take updated');
      } else {
        await createTake(take, author.id, author.name);
        toast.success('Take added successfully!');
      }
      closeForm();
      onChanged();
    } catch {
      toast.error(
        editingId ? 'Failed to update take' : 'Failed to create take'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = (authorData) => {
    setAuthor(authorData);
    setShowAuthorModal(false);
    writeSavedAuthor(authorData);
  };

  const handleLogout = () => {
    setAdminMode(false);
    setAuthor(null);
    writeSavedAuthor(null);
    closeForm();
    signOut();
    toast.success('Logged out');
  };

  const filteredTakes = filterTakes(takes, {
    status: filter,
    search,
    authorId: viewingAuthorId,
  });

  const statusCounts = takeStats(takes);

  const getFilterButtonClass = (filterType) => {
    const isActive = filter === filterType;
    const baseClass =
      'px-3 py-1.5 text-sm rounded-md transition-all duration-200';

    if (isActive) {
      switch (filterType) {
        case 'correct':
          return `${baseClass} bg-green-600 text-white`;
        case 'wrong':
          return `${baseClass} bg-red-600 text-white`;
        case 'pending':
          return `${baseClass} bg-yellow-600 text-white`;
        default:
          return `${baseClass} bg-blue-600 text-white`;
      }
    }

    return `${baseClass} bg-white/10 text-white/70 hover:bg-white/20`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative mb-6 md:mb-0">
        <div className="text-center relative">
          <h2 className="text-2xl font-bold text-white/90 mb-2">
            🎯 Take Board
          </h2>
          <p className="text-white/60 mb-4 md:mb-0">
            QB predictions and hot takes
          </p>

          {/* Mobile: Login/Add Button positioned near title */}
          <div className="md:hidden absolute top-0 right-0">
            {!author ? (
              <button
                onClick={() => setShowAuthorModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/80 hover:bg-blue-700 rounded-lg text-white text-xs font-medium transition-all whitespace-nowrap"
              >
                <Plus size={14} />
                Add Take
              </button>
            ) : (
              <button
                onClick={openNewTake}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/80 hover:bg-blue-700 rounded-lg text-white text-xs font-medium transition-all whitespace-nowrap"
              >
                <Plus size={14} />
                Add Take
              </button>
            )}
          </div>
        </div>

        {/* Desktop: Author Controls - Positioned Absolute Right */}
        <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 items-center gap-3">
          {!author ? (
            <>
              <button
                onClick={() => setShowAuthorModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-all whitespace-nowrap"
              >
                <User size={16} />
                Login to Add Takes
              </button>

              <button
                onClick={() => setShowAdminGate(true)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm font-medium transition-all whitespace-nowrap"
              >
                <Shield size={14} />
                Admin
              </button>
            </>
          ) : (
            <>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                  adminMode
                    ? 'bg-purple-600/20 border border-purple-500/30'
                    : 'bg-white/10'
                }`}
              >
                <User size={16} className="text-white/60" />
                <span className="text-white text-sm font-medium">
                  {author.name}
                </span>
                {adminMode && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                    ADMIN
                  </span>
                )}
              </div>

              {adminMode && (
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 text-xs font-medium transition-all"
                >
                  Logout
                </button>
              )}

              <button
                onClick={openNewTake}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-all whitespace-nowrap"
              >
                <Plus size={16} />
                Add Take
              </button>

              <select
                value={viewingAuthorId || ''}
                onChange={(e) => setViewingAuthorId(e.target.value || null)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 whitespace-nowrap"
              >
                <option value="">All Takes</option>
                <option value={author.id}>My Takes Only</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Mobile: Author Info and Controls */}
      <div className="md:hidden space-y-3">
        {author && (
          <div className="flex items-center justify-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                adminMode
                  ? 'bg-purple-600/20 border border-purple-500/30'
                  : 'bg-white/10'
              }`}
            >
              <User size={14} className="text-white/60" />
              <span className="text-white font-medium">{author.name}</span>
              {adminMode && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                  ADMIN
                </span>
              )}
            </div>

            <select
              value={viewingAuthorId || ''}
              onChange={(e) => setViewingAuthorId(e.target.value || null)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Takes</option>
              <option value={author.id}>My Takes Only</option>
            </select>
          </div>
        )}

        {/* Mobile: Admin Button */}
        <div className="flex justify-center">
          {!author ? (
            <button
              onClick={() => setShowAdminGate(true)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm font-medium transition-all"
            >
              <Shield size={14} />
              Admin
            </button>
          ) : adminMode ? (
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 text-sm font-medium transition-all"
            >
              Logout
            </button>
          ) : null}
        </div>
      </div>

      {/* Take Creation Form */}
      {showForm && (
        <div
          ref={formRef}
          className="bg-[#1a1a1a] rounded-xl border border-white/20 p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-white/90 font-semibold">
              {editingId ? 'Edit Take' : 'New Take'}
            </h3>
            <div>
              <label
                htmlFor={`${fieldId}-title`}
                className="block text-white/80 font-medium mb-2"
              >
                Take Title *
              </label>
              <input
                id={`${fieldId}-title`}
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Josh Allen will be a top 3 QB"
                required
                className="w-full p-3 bg-neutral-700 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor={`${fieldId}-description`}
                className="block text-white/80 font-medium mb-2"
              >
                Description *
              </label>
              <textarea
                id={`${fieldId}-description`}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Explain your prediction..."
                required
                rows={3}
                className="w-full p-3 bg-neutral-700 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${fieldId}-qb`}
                  className="block text-white/80 font-medium mb-2"
                >
                  QB Name *
                </label>
                <div className="relative">
                  <input
                    id={`${fieldId}-qb`}
                    type="text"
                    value={formData.qbName}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        qbName: e.target.value,
                      }));
                      setShowQbOptions(true);
                    }}
                    onBlur={() => setShowQbOptions(false)}
                    placeholder="Search QB..."
                    autoComplete="off"
                    required
                    className="w-full p-3 bg-neutral-700 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none"
                  />
                  {showQbOptions && filteredQBs.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-neutral-800 border border-white/20 rounded-lg max-h-48 overflow-y-auto">
                      {filteredQBs.map((qb) => (
                        <button
                          key={qb.id}
                          type="button"
                          // mousedown, so the pick lands before the input's
                          // blur closes the list
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData((prev) => ({
                              ...prev,
                              qbName: qb.name,
                            }));
                            setShowQbOptions(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-white/10 text-white text-sm"
                        >
                          {qb.name} ({qb.team})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor={`${fieldId}-status`}
                  className="block text-white/80 font-medium mb-2"
                >
                  Status *
                </label>
                <select
                  id={`${fieldId}-status`}
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value }))
                  }
                  required
                  className="w-full p-3 bg-neutral-700 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="correct">Correct</option>
                  <option value="wrong">Wrong</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${fieldId}-date`}
                  className="block text-white/80 font-medium mb-2"
                >
                  Made On
                </label>
                <input
                  id={`${fieldId}-date`}
                  type="text"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  placeholder="e.g., 2023 Draft"
                  className="w-full p-3 bg-neutral-700 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor={`${fieldId}-proof`}
                  className="block text-white/80 font-medium mb-2"
                >
                  Proof Date
                </label>
                <input
                  id={`${fieldId}-proof`}
                  type="text"
                  value={formData.proofDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      proofDate: e.target.value,
                    }))
                  }
                  placeholder="e.g., 2024 Season"
                  className="w-full p-3 bg-neutral-700 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-all"
              >
                {isSubmitting
                  ? 'Saving...'
                  : editingId
                    ? 'Save Changes'
                    : 'Add Take'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Buttons and Search */}
      <div className="space-y-4">
        {/* Mobile: Filter buttons on one line */}
        <div className="md:hidden">
          <div className="flex items-center justify-center gap-1 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`${getFilterButtonClass('all')} text-xs px-2 py-1.5 flex-shrink-0`}
            >
              All ({statusCounts.total})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`${getFilterButtonClass('correct')} text-xs px-2 py-1.5 flex-shrink-0`}
            >
              ✅ Correct ({statusCounts.correct || 0})
            </button>
            <button
              onClick={() => setFilter('wrong')}
              className={`${getFilterButtonClass('wrong')} text-xs px-2 py-1.5 flex-shrink-0`}
            >
              ❌ Wrong ({statusCounts.wrong || 0})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`${getFilterButtonClass('pending')} text-xs px-2 py-1.5 flex-shrink-0`}
            >
              ⏳ Pending ({statusCounts.pending || 0})
            </button>
          </div>

          {/* Mobile: Search bar separated */}
          <div className="flex justify-center">
            <div className="relative w-[280px]">
              <input
                type="text"
                placeholder="Search QB..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop: Original layout */}
        <div className="hidden md:flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={getFilterButtonClass('all')}
          >
            All ({statusCounts.total})
          </button>
          <button
            onClick={() => setFilter('correct')}
            className={getFilterButtonClass('correct')}
          >
            ✅ Correct ({statusCounts.correct || 0})
          </button>
          <button
            onClick={() => setFilter('wrong')}
            className={getFilterButtonClass('wrong')}
          >
            ❌ Wrong ({statusCounts.wrong || 0})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={getFilterButtonClass('pending')}
          >
            ⏳ Pending ({statusCounts.pending || 0})
          </button>

          <div className="relative w-[200px]">
            <input
              type="text"
              placeholder="Search QB..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded-md text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Takes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 min-h-[500px]">
        {loading ? (
          <div className="col-span-full text-center py-12 text-white/40 text-lg">
            Loading takes…
          </div>
        ) : filteredTakes.length > 0 ? (
          filteredTakes.map((take) => (
            <TakeCard
              key={take.id}
              take={take}
              onEdit={adminMode ? openEdit : null}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <div className="text-white/40 text-lg">
              {takes.length ? 'No takes match your filter' : 'No takes yet'}
            </div>
          </div>
        )}
      </div>

      {/* Author Modal */}
      {showAuthorModal && (
        <TakeAuthorModal
          onClose={() => setShowAuthorModal(false)}
          onLogin={handleLogin}
          currentAuthor={author}
        />
      )}

      {/* Admin Gate Modal */}
      {showAdminGate && (
        <AdminGate
          onAdminAccess={() => {
            setAdminMode(true);
            setAuthor({ id: 'admin', name: 'Admin' });
            setShowAdminGate(false);
          }}
          onClose={() => setShowAdminGate(false)}
        />
      )}

      {confirmDialog}
    </div>
  );
};

export default TakeBoard;
