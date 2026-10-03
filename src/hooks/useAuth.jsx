import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/firebaseConfig';

// Admin status lives in Firestore: a document at admins/<uid> grants it. The
// same check runs in firestore.rules, which is what actually enforces it --
// this copy only decides whether to show editing controls. Never rely on it
// for anything a rule should be deciding.
const readIsAdmin = async (user) => {
  if (!user) return false;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (error) {
    console.error('Could not read admin status:', error);
    return false;
  }
};

const AuthContext = createContext({
  user: null,
  isAdmin: false,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The user and their admin status are published together, after the admin
    // read. Setting the user first showed a freshly signed-in admin "not an
    // admin account" until the read came back. The counter drops a read that
    // finishes after a newer auth change, so a sign-out mid-read can't be
    // overwritten by the previous account's admin status.
    let latest = 0;
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      const call = ++latest;
      setLoading(true);
      const nextIsAdmin = await readIsAdmin(nextUser);
      if (call !== latest) return;
      setUser(nextUser);
      setIsAdmin(nextIsAdmin);
      setLoading(false);
    });
    return () => {
      latest = Infinity;
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    isAdmin,
    loading,
    signIn: () => signInWithPopup(auth, googleProvider),
    signOut: () => firebaseSignOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => useContext(AuthContext);

export default useAuth;
