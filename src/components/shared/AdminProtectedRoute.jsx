import React, { useState, useEffect } from 'react';
import { Lock, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminProtectedRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const correctPassword = 'Sidearm9!'; // Same password as TakeBoard admin

  // Check if already in admin mode
  useEffect(() => {
    const adminStatus = localStorage.getItem('qbzero_admin') === 'true';
    setIsAdmin(adminStatus);
    if (!adminStatus) {
      setShowGate(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (passwordInput === correctPassword) {
        localStorage.setItem('qbzero_admin', 'true');
        toast.success('Admin access granted');
        setIsAdmin(true);
        setShowGate(false);
      } else {
        toast.error('Incorrect password');
        setPasswordInput('');
      }
      setIsLoading(false);
    }, 500);
  };

  if (isAdmin) {
    return children;
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
      <div className="bg-neutral-800 p-8 rounded-xl border border-white/20 w-full max-w-md">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            Admin Access Required
          </h2>
          <p className="text-white/60 text-sm">
            Enter admin password to edit rankings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter admin password..."
              className="w-full pl-10 pr-3 py-3 bg-neutral-700 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Verifying...' : 'Access Admin Mode'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminProtectedRoute;
