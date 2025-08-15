// SiteLayout.jsx
import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ChevronDown, Menu, X, Lock } from 'lucide-react';

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

  let alignmentClass = 'left-0';
  if (align === 'center') alignmentClass = 'left-1/2 -translate-x-1/2';
  if (align === 'right') alignmentClass = 'right-0';

  return (
    <div className="relative group">
      {/* Trigger */}
      <div className="inline-flex items-center gap-1 cursor-pointer hover:text-white text-white/60">
        <span>{label}</span>
        <ChevronDown
          size={14}
          className="mt-[1px] text-white/60 group-hover:text-white"
        />
      </div>

      {/* Invisible hover bridge to prevent flicker */}
      <div className="absolute top-full h-4 w-full" />

      {/* Dropdown */}
      <div
        className={`absolute hidden group-hover:flex flex-col mt-2 bg-[#1c1c1c] border border-white/10 rounded shadow-lg text-sm text-white/80 min-w-[160px] p-2 z-50 ${alignmentClass}`}
      >
        {children}
      </div>
    </div>
  );
};

const LockedLink = ({ children }) => (
  <span className="flex items-center gap-1 text-white/40 cursor-not-allowed select-none">
    <Lock size={14} className="inline" />
    {children}
  </span>
);

const MobileMenu = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Menu */}
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
          <LockedLink>QB Profiles</LockedLink>
          <LockedLink>Rankings</LockedLink>
          <LockedLink>QBW 🔮</LockedLink>

          <NavGroup label="Tools" isMobile={true}>
            <LockedLink>Tier Maker</LockedLink>
            <Link
              to="/ranker"
              className="block py-2 text-white/80 hover:text-white"
              onClick={onClose}
            >
              QB Ranker
            </Link>
            <div className="border-t border-white/10 my-2" />
            <div>
              <div className="text-xs text-white/50 mb-1">Saved</div>
              <LockedLink>Lists</LockedLink>
              <LockedLink>Tiers</LockedLink>
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

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-6 text-sm text-white/60 items-center">
          <LockedLink>QB Profiles</LockedLink>
          <LockedLink>Rankings</LockedLink>
          <LockedLink>QBW 🔮</LockedLink>
          <NavGroup label="Tools" align="center">
            <LockedLink>Tier Maker</LockedLink>
            <Link to="/ranker" className="hover:text-white py-1 px-2">
              QB Ranker
            </Link>
            <div className="border-t border-white/10 my-2" />
            <div>
              <div className="text-xs text-white/50 mb-1">Saved</div>
              <LockedLink>Lists</LockedLink>
              <LockedLink>Tiers</LockedLink>
            </div>
          </NavGroup>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 text-white/60 hover:text-white"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Menu */}
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
