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

// Verified, canonical Firebase Configuration for fx-prompty
export const DEFAULT_FIREBASE_CONFIG: FirebaseClientConfig = {
  apiKey: 'AIzaSyB0AAVJPGz1SY2LZ-C6DRZwo8M12rBdV_s',
  authDomain: 'fx-prompty.firebaseapp.com',
  projectId: 'fx-prompty',
  storageBucket: 'fx-prompty.firebasestorage.app',
  messagingSenderId: '461202466056',
  appId: '1:461202466056:web:f92114179625e9050478bd',
  measurementId: 'G-GLDWJ5Y93D',
};

// Auto-purge any stale or mistyped keys from previous sessions in localStorage
try {
  const cached = localStorage.getItem(RUNTIME_CONFIG_KEY);
  if (cached && (cached.includes('GdV_s') || cached.includes('461282466056') || !cached.includes('AIzaSyB0AAVJPGz1SY2LZ-C6DRZwo8M12rBdV_s'))) {
    localStorage.removeItem(RUNTIME_CONFIG_KEY);
  }
} catch (e) {
  console.warn('LocalStorage cleanup notice:', e);
}

// Helper to sanitize domain strings
const cleanDomain = (domain?: string): string => {
  if (!domain) return '';
  return domain
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
};

const sanitizeConfig = (cfg: Partial<FirebaseClientConfig>): FirebaseClientConfig => {
  const apiKey = (cfg.apiKey || DEFAULT_FIREBASE_CONFIG.apiKey).trim();
  const projectId = (cfg.projectId || DEFAULT_FIREBASE_CONFIG.projectId).trim();
  let authDomain = cleanDomain(cfg.authDomain || DEFAULT_FIREBASE_CONFIG.authDomain);

  if (!authDomain && projectId) {
    authDomain = `${projectId}.firebaseapp.com`;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: cleanDomain(cfg.storageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket) || `${projectId}.firebasestorage.app`,
    messagingSenderId: (cfg.messagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId || '').trim(),
    appId: (cfg.appId || DEFAULT_FIREBASE_CONFIG.appId || '').trim(),
    measurementId: (cfg.measurementId || DEFAULT_FIREBASE_CONFIG.measurementId || '').trim(),
  };
};

// Read runtime config from localStorage only if valid
export const getStoredFirebaseConfig = (): FirebaseClientConfig | null => {
  try {
    const raw = localStorage.getItem(RUNTIME_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && parsed.projectId && !parsed.apiKey.includes('GdV_s')) {
        return sanitizeConfig(parsed);
      }
    }
  } catch (e) {
    console.warn('Error reading stored Firebase config', e);
  }
  return null;
};

// Priority: 1. Clean .env (if present) -> 2. Stored valid config -> 3. Canonical verified default
const envConfigRaw: Partial<FirebaseClientConfig> = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

const sanitizedEnv = sanitizeConfig(envConfigRaw);

// Use verified keys
const activeConfig: FirebaseClientConfig = (sanitizedEnv.apiKey && !sanitizedEnv.apiKey.includes('GdV_s'))
  ? sanitizedEnv
  : (getStoredFirebaseConfig() || DEFAULT_FIREBASE_CONFIG);

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
