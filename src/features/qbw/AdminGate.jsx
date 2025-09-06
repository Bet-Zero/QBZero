import { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminGate = ({ onAdminAccess, onClose }) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const correctPassword = 'Makenzie1!'; // Using the same password as your main PasswordGate

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      if (passwordInput === correctPassword) {
        localStorage.setItem('qbzero_admin', 'true');
        toast.success('Admin mode activated');
        onAdminAccess();
      } else {
        toast.error('Incorrect password');
        setPasswordInput('');
      }
      setIsLoading(false);
    }, 500); // Small delay to prevent timing attacks
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl border border-white/20 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock size={20} className="text-purple-400" />
            Admin Access
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="text-white/60" size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="text-white/60 text-sm mb-4">
            Enter admin password to access posting without authentication.
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/80 font-medium mb-2">
                Password *
              </label>
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
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-all"
              >
                {isLoading ? 'Verifying...' : 'Access Admin'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminGate;