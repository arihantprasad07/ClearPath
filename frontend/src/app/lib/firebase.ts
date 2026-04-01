import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

const app = firebaseEnabled ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const firebaseAuth = app ? getAuth(app) : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;

if (firebaseAuth) {
  void setPersistence(firebaseAuth, browserLocalPersistence);
}

export async function loginWithFirebaseEmail(email: string, password: string) {
  if (!firebaseAuth) throw new Error('Firebase Authentication is not configured.');
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function loginWithGooglePopup() {
  if (!firebaseAuth || !googleProvider) throw new Error('Firebase Authentication is not configured.');
  return signInWithPopup(firebaseAuth, googleProvider);
}

export async function logoutFirebase() {
  if (!firebaseAuth) return;
  await signOut(firebaseAuth);
}

export function subscribeToFirebaseAuth(handler: (user: User | null) => void) {
  if (!firebaseAuth) return () => undefined;
  return onAuthStateChanged(firebaseAuth, handler);
}
