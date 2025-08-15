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
          <div className="text-xl font-bold text-white">🏈 QBZero</div>
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
            className="block py-3 text-white/80 hover:text-white border-b border-white/10"
            onClick={onClose}
          >
            QB Profiles
          </Link>
          <Link
            to="/players"
            className="block py-3 text-white/80 hover:text-white border-b border-white/10"
            onClick={onClose}
          >
            Quarterbacks
          </Link>

          <NavGroup label="Tools" isMobile={true}>
            <Link
              to="/roster"
              className="block py-2 text-white/80 hover:text-white"
              onClick={onClose}
            >
              Roster Builder
            </Link>
            <Link
              to="/tier-maker"
              className="block py-2 text-white/80 hover:text-white"
              onClick={onClose}
            >
              Tier Maker
            </Link>
            <Link
              to="/ranker"
              className="block py-2 text-white/80 hover:text-white"
              onClick={onClose}
            >
              Player Ranker
            </Link>
          </NavGroup>

          <NavGroup label="Saved" isMobile={true}>
            <Link
              to="/rosters"
              className="block py-2 text-white/80 hover:text-white"
              onClick={onClose}
            >
              Rosters
            </Link>
            <Link
              to="/lists"
              className="block py-2 text-white/80 hover:text-white"
              onClick={onClose}
            >
              Lists
            </Link>
            <Link
              to="/tier-lists"
              className="block py-2 text-white/80 hover:text-white"
              onClick={onClose}
            >
              Tiers
            </Link>
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
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          🏈 QBZero
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-6 text-sm text-white/60 items-center">
          <Link to="/profiles" className="hover:text-white">
            QB Profiles
          </Link>
          <Link to="/players" className="hover:text-white">
            Quarterbacks
          </Link>

          <NavGroup label="Tools" align="center">
            <Link to="/roster" className="hover:text-white py-1 px-2">
              Roster Builder
            </Link>
            <Link to="/tier-maker" className="hover:text-white py-1 px-2">
              Tier Maker
            </Link>
            <Link to="/ranker" className="hover:text-white py-1 px-2">
              Player Ranker
            </Link>
          </NavGroup>

          <NavGroup label="Saved" align="right">
            <Link to="/rosters" className="hover:text-white py-1 px-2">
              Rosters
            </Link>
            <Link to="/lists" className="hover:text-white py-1 px-2">
              Lists
            </Link>
            <Link to="/tier-lists" className="hover:text-white py-1 px-2">
              Tiers
            </Link>
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
