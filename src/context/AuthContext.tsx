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
  signInWithRedirect,
  getRedirectResult,
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
  deleteDoc,
  FirebaseUser
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

const AUTH_STORAGE_KEY = 'fx_prompty_current_user_v3';

// Helper to convert Firebase Auth error codes into clear user messages
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
      return 'Google Sign-In cancel kar diya gaya. Dobara prayas karein.';
    case 'auth/popup-blocked':
      return 'Popup browser dwara block ho gaya. Redirect mode se login kiya ja raha hai...';
    case 'auth/unauthorized-domain':
      return 'Ye domain Firebase Console me authorized nahi hai. Firebase Console -> Authentication -> Settings -> Authorized Domains me localhost aur apna Vercel domain add karein.';
    case 'auth/network-request-failed':
      return 'Network issue hai. Kripya apna internet connection check karein.';
    default:
      return fallbackMessage || 'Authentication me samasya aayi. Kripya dobara try karein.';
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Read initial user from persistent storage
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Loading state remains true until Firebase onAuthStateChanged confirms the session
  const [loading, setLoading] = useState(true);

  // Sync active user state to persistent local session
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

  // Helper to handle and sync real Firebase user data with Cloud Firestore
  const syncFirebaseUserToState = async (fbUser: FirebaseUser): Promise<UserProfile> => {
    let firestoreProfile: Partial<UserProfile> = {};

    if (db) {
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          firestoreProfile = userDocSnap.data() as Partial<UserProfile>;
        } else {
          // Initialize fresh user document in Firestore on first login
          const newDoc: UserProfile = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || '',
            email: fbUser.email || '',
            photoURL: fbUser.photoURL || '',
            dob: '',
            pushNotifications: true,
            createdAt: new Date().toISOString().split('T')[0],
            bio: 'Creator on FX Prompty.',
          };
          await setDoc(userDocRef, newDoc, { merge: true });
          firestoreProfile = newDoc;
        }
      } catch (err) {
        console.warn('Firestore sync notice:', err);
      }
    }

    const realProfile: UserProfile = {
      uid: fbUser.uid,
      displayName: firestoreProfile.displayName || fbUser.displayName || '',
      email: fbUser.email || firestoreProfile.email || '',
      photoURL: firestoreProfile.photoURL || fbUser.photoURL || '',
      dob: firestoreProfile.dob || '',
      pushNotifications: firestoreProfile.pushNotifications ?? true,
      createdAt: firestoreProfile.createdAt || new Date().toISOString().split('T')[0],
      bio: firestoreProfile.bio || 'Creator on FX Prompty.',
    };

    setUser(realProfile);
    return realProfile;
  };

  // ========================================================
  // PERSISTENT SESSION LISTENER (Firebase onAuthStateChanged & getRedirectResult)
  // ========================================================
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    // 1. Check for incoming redirect authentication result (e.g. mobile redirect fallback)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          await syncFirebaseUserToState(result.user);
        }
      })
      .catch((err) => {
        console.warn('Redirect auth result warning:', err);
      });

    // 2. Real-time persistent session listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          await syncFirebaseUserToState(fbUser);
        } catch (err) {
          console.error('Error in onAuthStateChanged:', err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ========================================================
  // 1. REAL GOOGLE SIGN-IN (Popup with Automatic Redirect Fallback)
  // ========================================================
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return {
        success: false,
        error: 'FIREBASE_NOT_CONFIGURED',
      };
    }

    try {
      // 1. Primary: Native popup account picker
      const result = await signInWithPopup(auth, googleProvider);
      if (result && result.user) {
        await syncFirebaseUserToState(result.user);
        setLoading(false);
        return { success: true };
      }
      setLoading(false);
      return { success: false, error: 'User data not returned' };
    } catch (err: any) {
      console.warn('Popup login attempt error:', err.code, err.message);

      // 2. Fallback: If popup is blocked by browser or iframe policy, fallback to signInWithRedirect
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.message?.includes('iframe') ||
        err.message?.includes('popup')
      ) {
        try {
          console.info('Switching to signInWithRedirect fallback...');
          await signInWithRedirect(auth, googleProvider);
          return { success: true };
        } catch (redirectErr: any) {
          setLoading(false);
          const friendlyMessage = getFirebaseFriendlyErrorMessage(redirectErr.code, redirectErr.message);
          return { success: false, error: friendlyMessage };
        }
      }

      setLoading(false);
      const friendlyMessage = getFirebaseFriendlyErrorMessage(err.code, err.message);
      return { success: false, error: friendlyMessage };
    }
  };

  // ========================================================
  // 2. EMAIL & PASSWORD SIGN IN
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

    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return {
        success: false,
        error: 'FIREBASE_NOT_CONFIGURED',
      };
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      await syncFirebaseUserToState(userCred.user);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      const friendlyMessage = getFirebaseFriendlyErrorMessage(err.code, err.message);
      return { success: false, error: friendlyMessage };
    }
  };

  // ========================================================
  // 3. EMAIL & PASSWORD SIGN UP
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

    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return {
        success: false,
        error: 'FIREBASE_NOT_CONFIGURED',
      };
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCred.user;

      await updateProfile(fbUser, {
        displayName: cleanName,
      });

      const newProfile: UserProfile = {
        uid: fbUser.uid,
        displayName: cleanName,
        email: cleanEmail,
        photoURL: fbUser.photoURL || '',
        dob: '',
        pushNotifications: true,
        createdAt: new Date().toISOString().split('T')[0],
        bio: 'AI prompt creator on FX Prompty.',
      };

      if (db) {
        try {
          await setDoc(doc(db, 'users', fbUser.uid), newProfile);
        } catch (e) {
          console.warn(e);
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
  };

  // ========================================================
  // 4. PASSWORD RESET EMAIL
  // ========================================================
  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLoading(false);
      return { success: false, error: 'Kripya ek valid email address enter karein.' };
    }

    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return {
        success: false,
        error: 'FIREBASE_NOT_CONFIGURED',
      };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      const friendlyMessage = getFirebaseFriendlyErrorMessage(err.code, err.message);
      return { success: false, error: friendlyMessage };
    }
  };

  // ========================================================
  // 5. UPDATE USER PROFILE (Cloud Firestore users/{uid})
  // ========================================================
  const updateUserProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User signed in nahi hai.' };
    }
    setLoading(true);

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
        console.warn('Profile update notice:', err);
      }
    }

    setUser((prev) => (prev ? { ...prev, ...updates } : null));
    setLoading(false);
    return { success: true };
  };

  // ========================================================
  // 6. CHANGE PASSWORD WITH RE-AUTHENTICATION
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

    setLoading(false);
    return { success: true };
  };

  // ========================================================
  // 7. CLEAN LOGOUT (Firebase SignOut + Session Reset)
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
    localStorage.removeItem('fx_prompty_welcome_dismissed');
    setLoading(false);
  };

  // ========================================================
  // 8. DELETE ACCOUNT (Google Play Store compliance)
  // ========================================================
  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No active user.' };
    setLoading(true);

    if (isFirebaseConfigured && auth?.currentUser) {
      try {
        if (db) {
          await deleteDoc(doc(db, 'users', user.uid));
        }
        await deleteUser(auth.currentUser);
      } catch (err: any) {
        console.warn('Account deletion notice:', err);
      }
    }

    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('fx_prompty_welcome_dismissed');
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
