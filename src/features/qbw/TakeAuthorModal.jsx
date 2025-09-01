import React, { useState } from 'react';
import { X, User, Key } from 'lucide-react';
import { createTakeAuthor, verifyTakeAuthor } from '@/firebase/takeAuthHelpers';
import { toast } from 'react-hot-toast';

const TakeAuthorModal = ({ onClose, onLogin, currentAuthor }) => {
  const [isNewUser, setIsNewUser] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [authorCode, setAuthorCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newUserCode, setNewUserCode] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isNewUser) {
        if (!authorName.trim()) {
          setError('Please enter your name');
          return;
        }

        const author = await createTakeAuthor(authorName);
        setNewUserCode(author.code);
        onLogin({ id: author.id, name: author.name });
      } else {
        if (!authorName.trim() || !authorCode.trim()) {
          setError('Please enter both your name and code');
          return;
        }

        const author = await verifyTakeAuthor(authorName, authorCode);
        onLogin({ id: author.id, name: author.name });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl border border-white/20 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Take Author</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="text-white/60" size={20} />
          </button>
        </div>

        {currentAuthor ? (
          <div className="p-6 text-center space-y-4">
            <div className="text-white/80">
              Currently logged in as:
              <div className="text-xl font-bold text-white mt-2">
                {currentAuthor.name}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-all"
            >
              Continue
            </button>
          </div>
        ) : newUserCode ? (
          <div className="p-6 space-y-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-400 mb-2">
                🎉 Account Created!
              </div>
              <div className="text-white/80 mb-4">
                Welcome, {authorName}! Here's your unique author code:
              </div>
              <div className="bg-neutral-800 p-4 rounded-lg mb-4">
                <div className="text-2xl font-mono font-bold text-white tracking-wider">
                  {newUserCode}
                </div>
              </div>
              <div className="text-yellow-400 text-sm mb-4">
                ⚠️ Save this code! You'll need it to log in again later.
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-all"
            >
              Got it, let's start!
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => {
                  setIsNewUser(true);
                  setError('');
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  isNewUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                New User
              </button>
              <button
                onClick={() => {
                  setIsNewUser(false);
                  setError('');
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  !isNewUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Returning
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/80 font-medium mb-2">
                  Your Name *
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder={
                      isNewUser
                        ? 'Enter your name...'
                        : 'Enter your existing name...'
                    }
                    className="w-full pl-10 pr-3 py-3 bg-neutral-700 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {!isNewUser && (
                <div>
                  <label className="block text-white/80 font-medium mb-2">
                    Your Code *
                  </label>
                  <div className="relative">
                    <Key
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                    />
                    <input
                      type="text"
                      value={authorCode}
                      onChange={(e) =>
                        setAuthorCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter your author code..."
                      className="w-full pl-10 pr-3 py-3 bg-neutral-700 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none font-mono uppercase"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-400 text-sm p-3 bg-red-400/10 rounded-lg">
                  {error}
                </div>
              )}

              <div className="text-sm text-white/60">
                {isNewUser
                  ? "You'll get a unique code to use when returning."
                  : "Don't have a code? Click 'New User' above."}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all"
                >
                  {isLoading
                    ? 'Please wait...'
                    : isNewUser
                      ? 'Create Account'
                      : 'Login'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeAuthorModal;
