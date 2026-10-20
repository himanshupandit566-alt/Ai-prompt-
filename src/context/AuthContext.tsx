import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types/auth';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (displayName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const AUTH_STORAGE_KEY = 'fx_prompty_auth_user_v1';

// Default initial demo user profile
const DEFAULT_USER: UserProfile = {
  uid: 'usr-fx-001',
  displayName: 'Himanshu Pandey',
  email: 'himanshupandit566@gmail.com',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  dob: '2001-08-15',
  pushNotifications: true,
  createdAt: '2026-01-10',
  bio: 'AI art enthusiast & prompt engineer creating cinematic visuals with FX Prompty.',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      return DEFAULT_USER; // Default logged in for pleasant exploration
    } catch {
      return DEFAULT_USER;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to sync auth state to localStorage', e);
    }
  }, [user]);

  // ========================================================
  // FIREBASE INTEGRATION PLACEHOLDER & CLIENT HANDLERS
  // ========================================================
  // To connect real Firebase:
  // 1. Install firebase: npm i firebase
  // 2. Initialize in src/firebase.ts: initializeApp(firebaseConfig)
  // 3. Connect signInWithEmailAndPassword, createUserWithEmailAndPassword, etc.
  // ========================================================

  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    await new Promise((res) => setTimeout(res, 600)); // simulated latency

    if (!email || !password) {
      setLoading(false);
      return { success: false, error: 'Email and password are required.' };
    }

    if (password.length < 6) {
      setLoading(false);
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Set user in state
    const loggedInUser: UserProfile = {
      uid: `usr-${Date.now()}`,
      displayName: email.split('@')[0].replace(/[._]/g, ' '),
      email,
      photoURL: user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      dob: user?.dob || '2000-01-01',
      pushNotifications: true,
      createdAt: new Date().toISOString().split('T')[0],
      bio: 'Creative prompt explorer on FX Prompty.',
    };

    setUser(loggedInUser);
    setLoading(false);
    return { success: true };
  };

  const signUpWithEmail = async (displayName: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    await new Promise((res) => setTimeout(res, 700));

    if (!displayName || !email || !password) {
      setLoading(false);
      return { success: false, error: 'All fields are required.' };
    }

    if (password.length < 6) {
      setLoading(false);
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const newUser: UserProfile = {
      uid: `usr-${Date.now()}`,
      displayName: displayName.trim(),
      email: email.trim().toLowerCase(),
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      dob: '2000-01-01',
      pushNotifications: true,
      createdAt: new Date().toISOString().split('T')[0],
      bio: 'New FX Prompty creator.',
    };

    setUser(newUser);
    setLoading(false);
    return { success: true };
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    await new Promise((res) => setTimeout(res, 800));

    // Simulated Google OAuth response
    const googleUser: UserProfile = {
      uid: 'google-usr-981273',
      displayName: 'Himanshu Pandey',
      email: 'himanshupandit566@gmail.com',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      dob: '2001-08-15',
      pushNotifications: true,
      createdAt: new Date().toISOString().split('T')[0],
      bio: 'Signed in with Google Account.',
    };

    setUser(googleUser);
    setLoading(false);
    return { success: true };
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    await new Promise((res) => setTimeout(res, 500));
    setLoading(false);

    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    // In real Firebase: await sendPasswordResetEmail(auth, email);
    return { success: true };
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No authenticated user found.' };
    setLoading(true);
    await new Promise((res) => setTimeout(res, 400));

    // In real Firebase:
    // await updateProfile(auth.currentUser, { displayName, photoURL });
    // await setDoc(doc(db, "users", user.uid), updates, { merge: true });

    setUser((prev) => (prev ? { ...prev, ...updates } : null));
    setLoading(false);
    return { success: true };
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    await new Promise((res) => setTimeout(res, 600));
    setLoading(false);

    if (!currentPassword) {
      return { success: false, error: 'Current password is required.' };
    }
    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    // In real Firebase:
    // const cred = EmailAuthProvider.credential(user.email, currentPassword);
    // await reauthenticateWithCredential(auth.currentUser, cred);
    // await updatePassword(auth.currentUser, newPassword);

    return { success: true };
  };

  const logOut = async () => {
    setLoading(true);
    await new Promise((res) => setTimeout(res, 300));
    // In real Firebase: await signOut(auth);
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setLoading(false);
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    await new Promise((res) => setTimeout(res, 600));
    // In real Firebase:
    // await deleteDoc(doc(db, "users", user.uid));
    // await deleteUser(auth.currentUser);
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setLoading(false);
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        updateUserProfile,
        changePassword,
        logOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
