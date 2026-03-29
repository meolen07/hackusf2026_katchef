import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseApp, getApp, getApps, initializeApp } from "@firebase/app";
import type { Auth, Persistence } from "@firebase/auth";
import { Firestore, getFirestore } from "@firebase/firestore";

import { env } from "./env";

export const firebaseEnabled = env.firebaseConfigured;

// Expo Go is finicky here; force the RN auth build so the auth component registers.
type FirebaseAuthRuntime = typeof import("@firebase/auth") & {
  getReactNativePersistence: (
    storage: typeof AsyncStorage,
  ) => Persistence;
};

const FirebaseAuthNative = require("@firebase/auth/dist/rn/index.js") as FirebaseAuthRuntime;

type NativeAuthModule = {
  getReactNativePersistence: (
    storage: typeof AsyncStorage,
  ) => Persistence;
};

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
    try {
      auth = FirebaseAuthNative.initializeAuth(firebaseApp, {
        persistence: (FirebaseAuthNative.getReactNativePersistence as NativeAuthModule["getReactNativePersistence"])(AsyncStorage),
      });
    } catch {
      auth = FirebaseAuthNative.getAuth(firebaseApp);
    }
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

  return auth ?? FirebaseAuthNative.getAuth(firebaseApp);
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
