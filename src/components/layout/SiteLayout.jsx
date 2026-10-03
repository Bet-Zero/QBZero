// SiteLayout.jsx
import React, { Suspense, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ChevronDown, Menu, X, Lock } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import PageErrorBoundary from './PageErrorBoundary';

/**
 * A destination only the owner can open.
 *
 * These were static padlocked <div>s, so the padlock stayed on after signing
 * in -- the person who can edit saw the same locked shell as a visitor and had
 * to navigate by typing URLs. The padlock now reflects whether this browser can
 * actually get in. It is a label, not a gate: AdminProtectedRoute and
 * firestore.rules are what enforce access.
 */
const AdminLink = ({
  to,
  label,
  className,
  lockClassName,
  iconSize = 14,
  onClick,
}) => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className={lockClassName}>
        <Lock size={iconSize} />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <Link to={to} className={className} onClick={onClick}>
      {label}
    </Link>
  );
};

const NavGroup = ({ label, children, align = 'left', isMobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="w-full flex items-center justify-between py-3 text-white/80 hover:text-white border-b border-white/10"
        >
          <span className="font-medium">{label}</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {isOpen && (
          <div className="pl-4 py-2 space-y-2 bg-white/5">{children}</div>
        )}
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        aria-haspopup="true"
        className="py-2 px-3 text-white/60 hover:text-white flex items-center gap-1"
      >
        {label}
        <ChevronDown size={14} />
      </button>

      <div
        className={`absolute top-full pt-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 invisible group-hover:visible group-focus-within:visible transition-all z-50 ${
          align === 'right' ? 'right-0' : ''
        }`}
      >
        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg py-2 w-48 shadow-xl">
          <div className="space-y-1">{children}</div>
        </div>
      </div>
    </div>
  );
};

const MobileMenu = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        role="presentation"
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-[#121212] border-l border-white/10 z-50 lg:hidden transform transition-transform duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <Link
            to="/"
            className="text-xl font-bold text-white hover:text-blue-400 transition-colors"
            onClick={onClose}
          >
            🏈 QBZero
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-6 space-y-4">
          <div className="flex items-center gap-2 py-2 text-white/40 cursor-not-allowed">
            <Lock size={14} />
            <span>QB Profiles</span>
          </div>
          <div className="flex items-center gap-2 py-2 text-white/40 cursor-not-allowed">
            <Lock size={14} />
            <span>QBW 🔮</span>
          </div>
          <div className="flex items-center gap-2 py-2 text-white/40 cursor-not-allowed">
            <Lock size={14} />
            <span>Backup QBs</span>
          </div>
          <Link
            to="/rankings"
            className="block py-2 text-white/60 hover:text-white"
            onClick={onClose}
          >
            QB Rankings
          </Link>
          <AdminLink
            to="/rankings/edit"
            label="Edit Rankings"
            onClick={onClose}
            className="block py-2 text-white/60 hover:text-white"
            lockClassName="flex items-center gap-2 py-2 text-white/40 cursor-not-allowed"
          />
          <AdminLink
            to="/rankings/history"
            label="Ranking History"
            onClick={onClose}
            className="block py-2 text-white/60 hover:text-white"
            lockClassName="flex items-center gap-2 py-2 text-white/40 cursor-not-allowed"
          />
          <NavGroup label="Tools" isMobile={true}>
            <AdminLink
              to="/tier-maker"
              label="Tier Maker"
              onClick={onClose}
              className="block py-2 text-white/60 hover:text-white"
              lockClassName="flex items-center gap-2 py-2 text-white/40 cursor-not-allowed"
            />
            <Link
              to="/ranker"
              className="block py-2 text-white/60 hover:text-white"
              onClick={onClose}
            >
              QB Ranker
            </Link>
            <AdminLink
              to="/rankings/all"
              label="Create Rankings"
              onClick={onClose}
              className="block py-2 text-white/60 hover:text-white"
              lockClassName="flex items-center gap-2 py-2 text-white/40 cursor-not-allowed"
            />
            <div className="border-t border-white/10 my-2" />
            <div>
              <AdminLink
                to="/lists"
                label="Lists"
                onClick={onClose}
                className="block py-2 text-white/60 hover:text-white"
                lockClassName="flex items-center gap-2 py-2 text-white/40 cursor-not-allowed"
              />
              <AdminLink
                to="/tier-lists"
                label="Tiers"
                onClick={onClose}
                className="block py-2 text-white/60 hover:text-white"
                lockClassName="flex items-center gap-2 py-2 text-white/40 cursor-not-allowed"
              />
              <AdminLink
                to="/rankings/browse"
                label="Browse Rankings"
                onClick={onClose}
                className="block py-2 text-white/60 hover:text-white"
                lockClassName="flex items-center gap-2 py-2 text-white/40 cursor-not-allowed"
              />
            </div>
          </NavGroup>
        </nav>
      </div>
    </>
  );
};

// Shown while a page's code downloads on its first visit.
const PageLoading = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="text-white/50 text-sm">Loading…</div>
  </div>
);

const SiteLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Any navigation closes the drawer, including links that forget onClick and
  // the browser's back button.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
      <header className="bg-[#121212] border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl sm:text-2xl font-bold tracking-tight text-white hover:text-blue-400 transition-colors"
        >
          🏈 QBZero
        </Link>

        <nav className="hidden lg:flex gap-6 text-sm text-white/60 items-center">
          <div className="flex items-center gap-1 text-white/40 cursor-not-allowed">
            <Lock size={12} />
            <span>QB Profiles</span>
          </div>
          <div className="flex items-center gap-1 text-white/40 cursor-not-allowed">
            <Lock size={12} />
            <span>QBW 🔮</span>
          </div>
          <div className="flex items-center gap-1 text-white/40 cursor-not-allowed">
            <Lock size={12} />
            <span>Backup QBs</span>
          </div>
          <Link to="/rankings" className="hover:text-white">
            QB Rankings
          </Link>
          <AdminLink
            to="/rankings/edit"
            label="Edit Rankings"
            iconSize={12}
            className="hover:text-white"
            lockClassName="flex items-center gap-1 text-white/40 cursor-not-allowed"
          />
          <AdminLink
            to="/rankings/history"
            label="Ranking History"
            iconSize={12}
            className="hover:text-white"
            lockClassName="flex items-center gap-1 text-white/40 cursor-not-allowed"
          />
          <NavGroup label="Tools" align="right">
            <AdminLink
              to="/tier-maker"
              label="Tier Maker"
              iconSize={12}
              className="block py-2 px-4 text-white/60 hover:text-white hover:bg-white/5"
              lockClassName="flex items-center gap-2 py-2 px-4 text-white/40 cursor-not-allowed"
            />
            <Link
              to="/ranker"
              className="block py-2 px-4 text-white/60 hover:text-white hover:bg-white/5"
            >
              QB Ranker
            </Link>
            <AdminLink
              to="/rankings/all"
              label="Create Rankings"
              iconSize={12}
              className="block py-2 px-4 text-white/60 hover:text-white hover:bg-white/5"
              lockClassName="flex items-center gap-2 py-2 px-4 text-white/40 cursor-not-allowed"
            />
            <div className="border-t border-white/10 my-2" />
            <div className="px-4">
              <AdminLink
                to="/lists"
                label="Lists"
                iconSize={12}
                className="block py-2 text-white/60 hover:text-white"
                lockClassName="flex items-center gap-2 py-2 text-white/40 cursor-not-allowed"
              />
              <AdminLink
                to="/tier-lists"
                label="Tiers"
                iconSize={12}
                className="block py-2 text-white/60 hover:text-white"
                lockClassName="flex items-center gap-2 py-2 text-white/40 cursor-not-allowed"
              />
              <AdminLink
                to="/rankings/browse"
                label="Browse Rankings"
                iconSize={12}
                className="block py-2 text-white/60 hover:text-white"
                lockClassName="flex items-center gap-2 py-2 text-white/40 cursor-not-allowed"
              />
            </div>
          </NavGroup>
        </nav>

        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileMenuOpen}
          className="lg:hidden p-2 text-white/60 hover:text-white"
        >
          <Menu size={24} />
        </button>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 w-full">
        <PageErrorBoundary resetKey={pathname}>
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </PageErrorBoundary>
        <Toaster position="bottom-center" />
      </main>
    </div>
  );
};

export default SiteLayout;
