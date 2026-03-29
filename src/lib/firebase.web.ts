import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

import { env } from "./env";

export const firebaseEnabled = env.firebaseConfigured;

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function ensureFirebaseServices() {
  if (!firebaseEnabled) {
    return;
  }

  if (!firebaseApp) {
    firebaseApp = getApps().length ? getApp() : initializeApp(env.firebase);
  }

  if (!auth) {
    auth = getAuth(firebaseApp);
    void setPersistence(auth, browserLocalPersistence).catch(() => undefined);
  }

  if (!db) {
    db = getFirestore(firebaseApp);
  }
}

export function getRequiredAuthService(): Auth {
  ensureFirebaseServices();

  if (!firebaseEnabled || !firebaseApp) {
    throw new Error(
      "Firebase Auth is not configured. Add the EXPO_PUBLIC_FIREBASE_* variables before using KatChef."
    );
  }

  return auth ?? getAuth(firebaseApp);
}

export function getRequiredFirestoreService(): Firestore {
  ensureFirebaseServices();

  if (!firebaseEnabled || !firebaseApp) {
    throw new Error(
      "Firestore is not configured. Add the EXPO_PUBLIC_FIREBASE_* variables before using fridge, profile, or chat persistence."
    );
  }

  return db ?? getFirestore(firebaseApp);
}

export { auth, db, firebaseApp };
