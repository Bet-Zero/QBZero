import { X, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';

const AdminGate = ({ onAdminAccess, onClose }) => {
  const { user, isAdmin, loading, signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      await signIn();
      toast.success('Signed in');
      onAdminAccess();
    } catch (error) {
      if (error?.code === 'auth/popup-closed-by-user') return;
      toast.error(error?.message || 'Sign-in failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-neutral-800 p-8 rounded-xl border border-white/20 w-full max-w-sm relative text-center">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-white/40 hover:text-white"
        >
          <X size={16} />
        </button>

        <Shield className="w-10 h-10 text-purple-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">Admin Mode</h2>

        {loading ? (
          <p className="text-white/50 text-sm">Checking access…</p>
        ) : isAdmin ? (
          <button
            onClick={onAdminAccess}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Continue as admin
          </button>
        ) : user ? (
          <p className="text-white/60 text-sm">
            Signed in as {user.email}, which is not an admin account.
          </p>
        ) : (
          <button
            onClick={handleSignIn}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminGate;
