import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Plus,
  User,
  Shield,
} from 'lucide-react';
import {
  fetchAllTakes,
  fetchAuthorTakes,
  createTake,
} from '@/firebase/takeHelpers';
import { quarterbacks } from '@/features/ranker/quarterbacks';
import { toast } from 'react-hot-toast';
import TakeAuthorModal from './TakeAuthorModal';
import AdminGate from './AdminGate';

const TakeCard = ({ take }) => {
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

const TakeBoard = () => {
  const [takes, setTakes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [author, setAuthor] = useState(null);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [viewingAuthorId, setViewingAuthorId] = useState(null); // null means viewing all takes
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    qbName: '',
    date: new Date().toLocaleDateString(),
    proofDate: '',
    status: 'pending',
  });

  // QB Search state
  const [qbSearch, setQbSearch] = useState('');

  // Filter QBs based on search
  const filteredQBs = useMemo(() => {
    return quarterbacks.filter((qb) =>
      qb.name.toLowerCase().includes(qbSearch.toLowerCase())
    );
  }, [qbSearch]);

  const [adminMode, setAdminMode] = useState(false);
  const [showAdminGate, setShowAdminGate] = useState(false);

  // Check for admin mode on mount
  useEffect(() => {
    const isAdmin = localStorage.getItem('qbzero_admin') === 'true';
    if (isAdmin) {
      setAdminMode(true);
      setAuthor({ id: 'admin', name: 'Admin' });
    }
  }, []);

  useEffect(() => {
    if (author) {
      loadTakes();
    }
  }, [author, viewingAuthorId]);

  const loadTakes = async () => {
    try {
      const takesData = viewingAuthorId
        ? await fetchAuthorTakes(viewingAuthorId)
        : await fetchAllTakes();
      setTakes(takesData);
    } catch (error) {
      console.error('Error loading takes:', error);
      toast.error('Failed to load takes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!author) {
      setShowAuthorModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await createTake(formData, author.id, author.name);
      toast.success('Take added successfully!');
      setFormData({
        title: '',
        description: '',
        qbName: '',
        date: new Date().toLocaleDateString(),
        proofDate: '',
        status: 'pending',
      });
      setQbSearch('');
      setShowForm(false);
      loadTakes();
    } catch (error) {
      console.error('Error creating take:', error);
      toast.error('Failed to create take');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = (authorData) => {
    setAuthor(authorData);
    setShowAuthorModal(false);
    localStorage.setItem('takeAuthor', JSON.stringify(authorData));
  };

  // Load author from localStorage on mount
  useEffect(() => {
    const savedAuthor = localStorage.getItem('takeAuthor');
    const isAdmin = localStorage.getItem('qbzero_admin') === 'true';

    if (isAdmin) {
      setAdminMode(true);
      setAuthor({ id: 'admin', name: 'Admin' });
    } else if (savedAuthor) {
      setAuthor(JSON.parse(savedAuthor));
    }
  }, []);

  const filteredTakes = takes.filter((take) => {
    if (filter !== 'all' && take.status !== filter) return false;
    if (search.trim()) {
      return take.qbName.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const statusCounts = takes.reduce((acc, take) => {
    acc[take.status] = (acc[take.status] || 0) + 1;
    return acc;
  }, {});

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
      <div className="relative mb-14 md:mb-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white/90 mb-2">
            🎯 Take Board
          </h2>
          <p className="text-white/60">QB predictions and hot takes</p>
        </div>

        {/* Author Controls - Positioned Absolute Right */}
        <div className="absolute md:right-0 right-1/2 md:translate-x-0 translate-x-1/2 md:top-1/2 top-[calc(100%+0.5rem)] md:-translate-y-1/2 translate-y-0 flex md:flex-row flex-col items-center gap-3">
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
                  onClick={() => {
                    setAdminMode(false);
                    setAuthor(null);
                    localStorage.removeItem('qbzero_admin');
                    localStorage.removeItem('takeAuthor');
                    toast.success('Logged out');
                  }}
                  className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 text-xs font-medium transition-all"
                >
                  Logout
                </button>
              )}

              <button
                onClick={() => setShowForm(!showForm)}
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

      {/* Take Creation Form */}
      {showForm && (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/20 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/80 font-medium mb-2">
                Take Title *
              </label>
              <input
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
              <label className="block text-white/80 font-medium mb-2">
                Description *
              </label>
              <textarea
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
                <label className="block text-white/80 font-medium mb-2">
                  QB Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={qbSearch}
                    onChange={(e) => setQbSearch(e.target.value)}
                    placeholder="Search QB..."
                    className="w-full p-3 bg-neutral-700 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none"
                  />
                  {qbSearch && filteredQBs.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-neutral-800 border border-white/20 rounded-lg max-h-48 overflow-y-auto">
                      {filteredQBs.map((qb) => (
                        <button
                          key={qb.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              qbName: qb.name,
                            }));
                            setQbSearch(qb.name);
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
                <label className="block text-white/80 font-medium mb-2">
                  Status *
                </label>
                <select
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

            <div>
              <label className="block text-white/80 font-medium mb-2">
                Proof Date
              </label>
              <input
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

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-all"
              >
                {isSubmitting ? 'Adding...' : 'Add Take'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Buttons and Search */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={getFilterButtonClass('all')}
        >
          All ({takes.length})
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

      {/* Takes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 min-h-[500px]">
        {filteredTakes.length > 0 ? (
          filteredTakes.map((take) => <TakeCard key={take.id} take={take} />)
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <div className="text-white/40 text-lg">
              No takes match your filter
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
    </div>
  );
};

export default TakeBoard;
