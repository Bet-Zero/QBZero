import React from 'react';
import { Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';

const AdminProtectedRoute = ({ children }) => {
  const { user, isAdmin, loading, signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      if (error?.code === 'auth/popup-closed-by-user') return;
      toast.error(error?.message || 'Sign-in failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white/50 text-sm">Checking access…</div>
      </div>
    );
  }

  if (isAdmin) return children;

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
      <div className="bg-neutral-800 p-8 rounded-xl border border-white/20 w-full max-w-md text-center">
        <Shield className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          Admin Access Required
        </h2>

        {user ? (
          <p className="text-white/60 text-sm">
            Signed in as {user.email}, which is not an admin account.
          </p>
        ) : (
          <>
            <p className="text-white/60 text-sm mb-6">
              Sign in to edit rankings.
            </p>
            <button
              onClick={handleSignIn}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Sign in with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminProtectedRoute;
