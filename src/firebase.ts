import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
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
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const RUNTIME_CONFIG_KEY = 'fx_prompty_runtime_firebase_config';

// 1. Check runtime localStorage configuration first (allows instant setup in browser)
export const getStoredFirebaseConfig = (): FirebaseClientConfig | null => {
  try {
    const raw = localStorage.getItem(RUNTIME_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading stored Firebase config', e);
  }
  return null;
};

// 2. Fall back to Vite environment variables from .env
const envConfig: FirebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const activeConfig: FirebaseClientConfig = getStoredFirebaseConfig() || envConfig;

// Validate configuration
export const isFirebaseConfigured = Boolean(
  activeConfig.apiKey &&
  activeConfig.projectId &&
  !activeConfig.apiKey.includes('YOUR_') &&
  !activeConfig.apiKey.includes('AIzaSyYourApiKeyHere')
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
const googleProvider = new GoogleAuthProvider();
// Force Google to show account selection picker every time
googleProvider.setCustomParameters({ prompt: 'select_account' });

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
}

// Function to save runtime Firebase config and re-initialize
export const saveRuntimeFirebaseConfig = (config: FirebaseClientConfig): boolean => {
  try {
    if (!config.apiKey || !config.projectId) return false;
    localStorage.setItem(RUNTIME_CONFIG_KEY, JSON.stringify(config));
    window.location.reload();
    return true;
  } catch (e) {
    console.error('Failed to save Firebase config', e);
    return false;
  }
};

export const clearRuntimeFirebaseConfig = () => {
  try {
    localStorage.removeItem(RUNTIME_CONFIG_KEY);
    window.location.reload();
  } catch (e) {
    console.error(e);
  }
};

export {
  app,
  auth,
  db,
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
  type FirebaseUser
};
