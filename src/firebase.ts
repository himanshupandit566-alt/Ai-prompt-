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
  measurementId?: string;
}

const RUNTIME_CONFIG_KEY = 'fx_prompty_runtime_firebase_config';

// Helper to strictly sanitize domain strings (strips http/https and trailing slashes to prevent iframe errors)
const cleanDomain = (domain?: string): string => {
  if (!domain) return '';
  return domain
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
};

const sanitizeConfig = (cfg: Partial<FirebaseClientConfig>): FirebaseClientConfig => {
  const apiKey = (cfg.apiKey || '').trim();
  const projectId = (cfg.projectId || '').trim();
  let authDomain = cleanDomain(cfg.authDomain);

  // If authDomain is not specified or clean, default to canonical <projectId>.firebaseapp.com
  if (!authDomain && projectId) {
    authDomain = `${projectId}.firebaseapp.com`;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: cleanDomain(cfg.storageBucket) || `${projectId}.firebasestorage.app`,
    messagingSenderId: (cfg.messagingSenderId || '').trim(),
    appId: (cfg.appId || '').trim(),
    measurementId: (cfg.measurementId || '').trim(),
  };
};

// 1. Check runtime localStorage configuration first (allows instant setup in browser)
export const getStoredFirebaseConfig = (): FirebaseClientConfig | null => {
  try {
    const raw = localStorage.getItem(RUNTIME_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && parsed.projectId) {
        return sanitizeConfig(parsed);
      }
    }
  } catch (e) {
    console.warn('Error reading stored Firebase config', e);
  }
  return null;
};

// 2. Read from Vite environment variables (.env)
const envConfigRaw: Partial<FirebaseClientConfig> = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

const sanitizedEnvConfig = sanitizeConfig(envConfigRaw);
const activeConfig: FirebaseClientConfig = getStoredFirebaseConfig() || sanitizedEnvConfig;

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
// Force Google account picker so user can pick their desired Gmail
googleProvider.setCustomParameters({ prompt: 'select_account' });

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
  }
}

// Function to save runtime Firebase config and re-initialize
export const saveRuntimeFirebaseConfig = (config: FirebaseClientConfig): boolean => {
  try {
    const sanitized = sanitizeConfig(config);
    if (!sanitized.apiKey || !sanitized.projectId) return false;
    localStorage.setItem(RUNTIME_CONFIG_KEY, JSON.stringify(sanitized));
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
