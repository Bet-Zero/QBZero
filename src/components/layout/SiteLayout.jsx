// SiteLayout.jsx
import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ChevronDown, Menu, X } from 'lucide-react';

const NavGroup = ({ label, children, align = 'left', isMobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
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
      <button className="py-2 px-3 text-white/60 hover:text-white flex items-center gap-1">
        {label}
        <ChevronDown size={14} />
      </button>

      <div
        className={`absolute top-full pt-2 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all ${
          align === 'center' ? '-translate-x-1/2 left-1/2' : ''
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
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 h-full w-80 bg-[#121212] border-l border-white/10 z-50 lg:hidden transform transition-transform duration-200">
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
            className="p-2 text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-6 space-y-4">
          <Link
            to="/profiles"
            className="block py-2 text-white/60 hover:text-white"
          >
            QB Profiles
          </Link>
          <Link to="/qbw" className="block py-2 text-white/60 hover:text-white">
            QBW 🔮
          </Link>
          <Link
            to="/backup-qbs"
            className="block py-2 text-white/60 hover:text-white"
          >
            Backup QBs
          </Link>
          <Link
            to="/my-rankings"
            className="block py-2 text-white/60 hover:text-white"
          >
            QB Rankings
          </Link>
          <NavGroup label="Tools" isMobile={true}>
            <Link
              to="/tier-maker"
              className="block py-2 text-white/60 hover:text-white"
            >
              Tier Maker
            </Link>
            <Link
              to="/ranker"
              className="block py-2 text-white/60 hover:text-white"
              onClick={onClose}
            >
              QB Ranker
            </Link>
            <div className="border-t border-white/10 my-2" />
            <div>
              <div className="text-xs text-white/50 mb-1">Saved</div>
              <Link
                to="/lists"
                className="block py-2 text-white/60 hover:text-white"
              >
                Lists
              </Link>
              <Link
                to="/rankings/all"
                className="block py-2 text-white/60 hover:text-white"
              >
                Community Rankings
              </Link>
              <Link
                to="/tiers"
                className="block py-2 text-white/60 hover:text-white"
              >
                Tiers
              </Link>
            </div>
          </NavGroup>
        </nav>
      </div>
    </>
  );
};

const SiteLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <Link to="/profiles" className="hover:text-white">
            QB Profiles
          </Link>
          <Link to="/qbw" className="hover:text-white">
            QBW 🔮
          </Link>
          <Link to="/backup-qbs" className="hover:text-white">
            Backup QBs
          </Link>
          <Link to="/my-rankings" className="hover:text-white">
            QB Rankings
          </Link>
          <NavGroup label="Tools" align="center">
            <Link
              to="/tier-maker"
              className="block py-2 px-4 text-white/60 hover:text-white hover:bg-white/5"
            >
              Tier Maker
            </Link>
            <Link
              to="/ranker"
              className="block py-2 px-4 text-white/60 hover:text-white hover:bg-white/5"
            >
              QB Ranker
            </Link>
            <div className="border-t border-white/10 my-2" />
            <div className="px-4">
              <div className="text-xs text-white/50 mb-1">Saved</div>
              <Link
                to="/lists"
                className="block py-2 text-white/60 hover:text-white"
              >
                Lists
              </Link>
              <Link
                to="/rankings/all"
                className="block py-2 text-white/60 hover:text-white"
              >
                Community Rankings
              </Link>
              <Link
                to="/tiers"
                className="block py-2 text-white/60 hover:text-white"
              >
                Tiers
              </Link>
            </div>
          </NavGroup>
        </nav>

        <button
          onClick={() => setMobileMenuOpen(true)}
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
        <Outlet />
        <Toaster position="bottom-center" />
      </main>
    </div>
  );
};

export default SiteLayout;
