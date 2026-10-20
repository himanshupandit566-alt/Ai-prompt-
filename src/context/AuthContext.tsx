import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types/auth';
import {
  auth,
  db,
  isFirebaseConfigured,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  deleteDoc
} from '../firebase';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  isFirebaseActive: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (displayName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const AUTH_STORAGE_KEY = 'fx_prompty_current_user_v2';
const USERS_DB_STORAGE_KEY = 'fx_prompty_registered_users_v2';

// Helper to convert Firebase Auth error codes into friendly user messages
const getFirebaseFriendlyErrorMessage = (code: string, fallbackMessage?: string): string => {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Password galat hai. Kripya sahi password dalein.';
    case 'auth/user-not-found':
      return 'Is email se koi account nahi mila. Kripya pehle Sign Up karein.';
    case 'auth/email-already-in-use':
      return 'Is email se pehle se account bana hua hai. Kripya Sign In karein.';
    case 'auth/invalid-email':
      return 'Kripya ek valid email address enter karein.';
    case 'auth/weak-password':
      return 'Password kam se kam 6 characters ka hona chahiye.';
    case 'auth/popup-closed-by-user':
      return 'Google Sign-In process user dwara cancel kar diya gaya.';
    case 'auth/too-many-requests':
      return 'Bohot saare galat attempts. Kripya thodi der baad dobara prayas karein.';
    case 'auth/network-request-failed':
      return 'Network connection me samasya hai. Kripya internet check karein.';
    default:
      return fallbackMessage || 'Authentication me samasya aayi. Kripya dobara prayas karein.';
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // User starts null (no hardcoded static dummy profile)
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync current user state to persistent local session
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

  // Firebase onAuthStateChanged listener when Firebase is configured
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          let profileData: Partial<UserProfile> = {};
          if (db) {
            const userDocRef = doc(db, 'users', fbUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              profileData = userDocSnap.data() as Partial<UserProfile>;
            } else {
              // Create default document in Firestore
              const initialData: UserProfile = {
                uid: fbUser.uid,
                displayName: fbUser.displayName || '',
                email: fbUser.email || '',
                photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${fbUser.uid}`,
                dob: '',
                pushNotifications: true,
                createdAt: new Date().toISOString().split('T')[0],
                bio: 'AI prompt enthusiast on FX Prompty.',
              };
              await setDoc(userDocRef, initialData, { merge: true });
              profileData = initialData;
            }
          }

          setUser({
            uid: fbUser.uid,
            displayName: profileData.displayName || fbUser.displayName || '',
            email: fbUser.email || '',
            photoURL: profileData.photoURL || fbUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${fbUser.uid}`,
            dob: profileData.dob || '',
            pushNotifications: profileData.pushNotifications ?? true,
            createdAt: profileData.createdAt || new Date().toISOString().split('T')[0],
            bio: profileData.bio || 'AI prompt explorer on FX Prompty.',
          });
        } catch (err) {
          console.error('Error fetching Firestore user record:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Helper to get local mock registered database
  const getLocalUsers = (): Record<string, { profile: UserProfile; passwordHash: string }> => {
    try {
      const data = localStorage.getItem(USERS_DB_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  };

  const saveLocalUsers = (users: Record<string, { profile: UserProfile; passwordHash: string }>) => {
    try {
      localStorage.setItem(USERS_DB_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save local users database', e);
    }
  };

  // ========================================================
  // 1. SIGN IN WITH EMAIL & PASSWORD
  // ========================================================
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setLoading(false);
      return { success: false, error: 'Kripya ek valid email address enter karein.' };
    }

    if (!password) {
      setLoading(false);
      return { success: false, error: 'Kripya apna password enter karein.' };
    }

    // A. Real Firebase Auth Flow
    if (isFirebaseConfigured && auth) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = userCred.user;

        let profile: UserProfile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || '',
          email: fbUser.email || cleanEmail,
          photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${fbUser.uid}`,
          dob: '',
          pushNotifications: true,
          createdAt: new Date().toISOString().split('T')[0],
          bio: 'AI prompt enthusiast on FX Prompty.',
        };

        if (db) {
          try {
            const userDocSnap = await getDoc(doc(db, 'users', fbUser.uid));
            if (userDocSnap.exists()) {
              profile = { ...profile, ...(userDocSnap.data() as Partial<UserProfile>) };
            }
          } catch (e) {
            console.warn('Could not read user profile from firestore', e);
          }
        }

        setUser(profile);
        setLoading(false);
        return { success: true };
      } catch (err: any) {
        setLoading(false);
        const friendlyMessage = getFirebaseFriendlyErrorMessage(err.code, err.message);
        return { success: false, error: friendlyMessage };
      }
    }

    // B. Local Responsive Fallback Flow (Identical real behavior)
    await new Promise((res) => setTimeout(res, 500));
    const localUsers = getLocalUsers();
    const existing = localUsers[cleanEmail];

    if (!existing) {
      setLoading(false);
      return {
        success: false,
        error: 'Is email se koi account nahi mila. Kripya pehle Sign Up karein.',
      };
    }

    if (existing.passwordHash !== password) {
      setLoading(false);
      return {
        success: false,
        error: 'Password galat hai. Kripya sahi password dalein.',
      };
    }

    setUser(existing.profile);
    setLoading(false);
    return { success: true };
  };

  // ========================================================
  // 2. SIGN UP WITH EMAIL, NAME & PASSWORD
  // ========================================================
  const signUpWithEmail = async (
    displayName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim();

    if (!cleanEmail) {
      setLoading(false);
      return { success: false, error: 'Kripya ek valid email address enter karein.' };
    }

    if (password.length < 6) {
      setLoading(false);
      return { success: false, error: 'Password kam se kam 6 characters ka hona chahiye.' };
    }

    // A. Real Firebase Flow
    if (isFirebaseConfigured && auth) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = userCred.user;

        const defaultAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanEmail}`;
        await updateProfile(fbUser, {
          displayName: cleanName,
          photoURL: defaultAvatar,
        });

        const newProfile: UserProfile = {
          uid: fbUser.uid,
          displayName: cleanName,
          email: cleanEmail,
          photoURL: defaultAvatar,
          dob: '',
          pushNotifications: true,
          createdAt: new Date().toISOString().split('T')[0],
          bio: 'AI prompt enthusiast on FX Prompty.',
        };

        if (db) {
          try {
            await setDoc(doc(db, 'users', fbUser.uid), newProfile);
          } catch (e) {
            console.warn('Could not write new profile to firestore', e);
          }
        }

        setUser(newProfile);
        setLoading(false);
        return { success: true };
      } catch (err: any) {
        setLoading(false);
        const friendlyMessage = getFirebaseFriendlyErrorMessage(err.code, err.message);
        return { success: false, error: friendlyMessage };
      }
    }

    // B. Local Fallback Flow
    await new Promise((res) => setTimeout(res, 600));
    const localUsers = getLocalUsers();

    if (localUsers[cleanEmail]) {
      setLoading(false);
      return {
        success: false,
        error: 'Is email se pehle se account bana hua hai. Kripya Sign In karein.',
      };
    }

    const uid = `usr-${Date.now()}`;
    const newProfile: UserProfile = {
      uid,
      displayName: cleanName,
      email: cleanEmail,
      photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanEmail}`,
      dob: '',
      pushNotifications: true,
      createdAt: new Date().toISOString().split('T')[0],
      bio: 'AI prompt enthusiast on FX Prompty.',
    };

    localUsers[cleanEmail] = {
      profile: newProfile,
      passwordHash: password,
    };
    saveLocalUsers(localUsers);

    setUser(newProfile);
    setLoading(false);
    return { success: true };
  };

  // ========================================================
  // 3. 1-CLICK GOOGLE SIGN-IN
  // ========================================================
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    // A. Real Firebase Flow
    if (isFirebaseConfigured && auth) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;

        let profile: UserProfile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || '',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${fbUser.uid}`,
          dob: '',
          pushNotifications: true,
          createdAt: new Date().toISOString().split('T')[0],
          bio: 'Signed in with Google Account on FX Prompty.',
        };

        if (db) {
          try {
            const userDocSnap = await getDoc(doc(db, 'users', fbUser.uid));
            if (userDocSnap.exists()) {
              profile = { ...profile, ...(userDocSnap.data() as Partial<UserProfile>) };
            } else {
              await setDoc(doc(db, 'users', fbUser.uid), profile, { merge: true });
            }
          } catch (e) {
            console.warn('Could not sync Google user profile with Firestore', e);
          }
        }

        setUser(profile);
        setLoading(false);
        return { success: true };
      } catch (err: any) {
        setLoading(false);
        const friendlyMessage = getFirebaseFriendlyErrorMessage(err.code, err.message);
        return { success: false, error: friendlyMessage };
      }
    }

    // B. Local Responsive Fallback Flow (Simulates seamless 1-tap Google OAuth)
    await new Promise((res) => setTimeout(res, 600));

    // Dynamically retrieve or generate a Google account profile
    const googleUid = `google-${Date.now().toString(36)}`;
    const googleUser: UserProfile = {
      uid: googleUid,
      displayName: 'Google User',
      email: `user.${googleUid.slice(-4)}@gmail.com`,
      photoURL: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80`,
      dob: '',
      pushNotifications: true,
      createdAt: new Date().toISOString().split('T')[0],
      bio: 'Connected via Google Account.',
    };

    const localUsers = getLocalUsers();
    localUsers[googleUser.email] = {
      profile: googleUser,
      passwordHash: 'google_oauth_authorized',
    };
    saveLocalUsers(localUsers);

    setUser(googleUser);
    setLoading(false);
    return { success: true };
  };

  // ========================================================
  // 4. FORGOT PASSWORD / PASSWORD RESET EMAIL
  // ========================================================
  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLoading(false);
      return { success: false, error: 'Kripya ek valid email address enter karein.' };
    }

    // A. Real Firebase Flow
    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        setLoading(false);
        return { success: true };
      } catch (err: any) {
        setLoading(false);
        const friendlyMessage = getFirebaseFriendlyErrorMessage(err.code, err.message);
        return { success: false, error: friendlyMessage };
      }
    }

    // B. Local Fallback Flow
    await new Promise((res) => setTimeout(res, 500));
    setLoading(false);
    return { success: true };
  };

  // ========================================================
  // 5. DYNAMIC UPDATE USER PROFILE (Firestore sync)
  // ========================================================
  const updateUserProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User signed in nahi hai.' };
    }
    setLoading(true);

    // A. Real Firebase Update
    if (isFirebaseConfigured && auth?.currentUser) {
      try {
        const updateObj: { displayName?: string; photoURL?: string } = {};
        if (updates.displayName !== undefined) updateObj.displayName = updates.displayName;
        if (updates.photoURL !== undefined) updateObj.photoURL = updates.photoURL;

        if (Object.keys(updateObj).length > 0) {
          await updateProfile(auth.currentUser, updateObj);
        }

        if (db) {
          await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
        }
      } catch (err: any) {
        console.warn('Firebase profile update issue, falling back to local state:', err);
      }
    }

    // B. Local DB Sync
    const localUsers = getLocalUsers();
    if (user.email && localUsers[user.email]) {
      localUsers[user.email].profile = { ...localUsers[user.email].profile, ...updates };
      // If email was changed:
      if (updates.email && updates.email !== user.email) {
        localUsers[updates.email] = localUsers[user.email];
        delete localUsers[user.email];
      }
      saveLocalUsers(localUsers);
    }

    setUser((prev) => (prev ? { ...prev, ...updates } : null));
    setLoading(false);
    return { success: true };
  };

  // ========================================================
  // 6. CHANGE PASSWORD (with re-authentication)
  // ========================================================
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User signed in nahi hai.' };
    }
    setLoading(true);

    if (!currentPassword) {
      setLoading(false);
      return { success: false, error: 'Kripya current password dalein.' };
    }

    if (newPassword.length < 6) {
      setLoading(false);
      return { success: false, error: 'Naya password kam se kam 6 characters ka hona chahiye.' };
    }

    // A. Real Firebase Re-auth and Update
    if (isFirebaseConfigured && auth?.currentUser && user.email) {
      try {
        const cred = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, cred);
        await updatePassword(auth.currentUser, newPassword);
        setLoading(false);
        return { success: true };
      } catch (err: any) {
        setLoading(false);
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          return { success: false, error: 'Current password galat hai.' };
        }
        return { success: false, error: getFirebaseFriendlyErrorMessage(err.code, err.message) };
      }
    }

    // B. Local Fallback Validation
    await new Promise((res) => setTimeout(res, 500));
    const localUsers = getLocalUsers();
    const entry = localUsers[user.email];

    if (entry && entry.passwordHash !== currentPassword) {
      setLoading(false);
      return { success: false, error: 'Current password galat hai.' };
    }

    if (entry) {
      entry.passwordHash = newPassword;
      saveLocalUsers(localUsers);
    }

    setLoading(false);
    return { success: true };
  };

  // ========================================================
  // 7. LOG OUT SESSION
  // ========================================================
  const logOut = async () => {
    setLoading(true);
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Firebase signOut error', e);
      }
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setLoading(false);
  };

  // ========================================================
  // 8. DELETE ACCOUNT (Google Play Store compliance)
  // ========================================================
  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No active user.' };
    setLoading(true);

    // A. Real Firebase Delete
    if (isFirebaseConfigured && auth?.currentUser) {
      try {
        if (db) {
          await deleteDoc(doc(db, 'users', user.uid));
        }
        await deleteUser(auth.currentUser);
      } catch (err: any) {
        console.warn('Firebase account deletion error:', err);
      }
    }

    // B. Local storage deletion
    const localUsers = getLocalUsers();
    if (user.email && localUsers[user.email]) {
      delete localUsers[user.email];
      saveLocalUsers(localUsers);
    }

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
        isFirebaseActive: isFirebaseConfigured,
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
