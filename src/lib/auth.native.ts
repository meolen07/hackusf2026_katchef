import {
  type Auth,
} from "@firebase/auth";
import { Platform } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

const FirebaseAuthNative = require("@firebase/auth/dist/rn/index.js") as typeof import("@firebase/auth");

import { ensureFirebaseServices, firebaseEnabled, getRequiredAuthService } from "./firebase.native";
import { env } from "./env";
import { SessionUser } from "../types/contracts";

type AuthListener = (user: SessionUser | null) => void;

export const googleSignInEnabled = env.googleAuthAvailable;
export const googleSignInMessage = googleSignInEnabled
  ? "Google sign-in is available on native builds. Use a development build or production app instead of Expo Go."
  : "Google sign-in needs the web client ID and iOS client ID before it can run on native builds.";

let googleConfigured = false;

function mapFirebaseUser(
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  },
  provider: "password" | "google" | "guest",
): SessionUser {
  const isGuest = provider === "guest";
  return {
    id: user.uid,
    email: isGuest ? "Guest session" : user.email ?? "chef@katchef.app",
    displayName: isGuest ? user.displayName ?? "Guest Chef" : user.displayName ?? "KatChef Cook",
    photoURL: user.photoURL,
    provider,
  };
}

function normalizeGuestError(error: unknown) {
  if (
    error instanceof Error &&
    (error.message.includes("operation-not-allowed") ||
      error.message.includes("admin-restricted-operation"))
  ) {
    return new Error(
      "Guest login is not enabled yet. Turn on Anonymous sign-in in Firebase Authentication to use it."
    );
  }
  return error;
}

function ensureAuthConfigured() {
  ensureFirebaseServices();
  if (!firebaseEnabled) {
    throw new Error(
      "Firebase Auth is not configured. Add the EXPO_PUBLIC_FIREBASE_* variables before using KatChef."
    );
  }
}

function getRequiredAuth(): Auth {
  ensureAuthConfigured();
  return getRequiredAuthService() as Auth;
}

function ensureNativeGoogleConfigured() {
  if (googleConfigured || !googleSignInEnabled) {
    return;
  }

  GoogleSignin.configure({
    webClientId: env.googleWebClientId,
    iosClientId: env.googleIosClientId || undefined,
    scopes: ["profile", "email"],
  });
  googleConfigured = true;
}

export function observeAuthState(listener: AuthListener) {
  return FirebaseAuthNative.onAuthStateChanged(
    getRequiredAuth(),
    (
      firebaseUser: {
        uid: string;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
        isAnonymous: boolean;
        providerData: Array<{ providerId: string }>;
      } | null,
    ) => {
      if (!firebaseUser) {
        listener(null);
        return;
      }
      const provider = firebaseUser.isAnonymous
        ? "guest"
        : firebaseUser.providerData.some((entry) => entry.providerId.includes("google"))
          ? "google"
          : "password";
      listener(mapFirebaseUser(firebaseUser, provider));
    },
  );
}

export async function signInWithEmail(email: string, password: string) {
  const credential = await FirebaseAuthNative.signInWithEmailAndPassword(getRequiredAuth(), email, password);
  return mapFirebaseUser(credential.user, "password");
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const credential = await FirebaseAuthNative.createUserWithEmailAndPassword(getRequiredAuth(), email, password);
  if (displayName) {
    await FirebaseAuthNative.updateProfile(credential.user, { displayName });
  }
  return mapFirebaseUser(
    {
      ...credential.user,
      displayName: displayName || credential.user.displayName,
    },
    "password",
  );
}

export async function requestPasswordReset(email: string) {
  await FirebaseAuthNative.sendPasswordResetEmail(getRequiredAuth(), email);
}

export async function signInAsGuest() {
  try {
    const credential = await FirebaseAuthNative.signInAnonymously(getRequiredAuth());
    return mapFirebaseUser(credential.user, "guest");
  } catch (error) {
    throw normalizeGuestError(error);
  }
}

export async function signInWithGoogle() {
  ensureAuthConfigured();
  if (!googleSignInEnabled) {
    throw new Error(googleSignInMessage);
  }

  try {
    ensureNativeGoogleConfigured();
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    const response = await GoogleSignin.signIn();
    if (response.type === "cancelled") {
      throw new Error("Google sign-in was cancelled.");
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new Error(
        "Google sign-in did not return an ID token. Check the web client ID and native Google configuration."
      );
    }

    const credential = FirebaseAuthNative.GoogleAuthProvider.credential(idToken);
    const result = await FirebaseAuthNative.signInWithCredential(getRequiredAuth(), credential);
    return mapFirebaseUser(result.user, "google");
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("RNGoogleSignin") ||
        error.message.includes("Native module") ||
        error.message.includes("Expo Go")
      ) {
        throw new Error(
          "Native Google sign-in requires a development build or production build. Expo Go cannot load this module."
        );
      }
    }
    throw error;
  }
}

export async function signOut() {
  if (googleSignInEnabled) {
    try {
      if (GoogleSignin.getCurrentUser()) {
        await GoogleSignin.signOut();
      }
    } catch {
      // Firebase sign-out below is still the source of truth.
    }
  }
  await FirebaseAuthNative.signOut(getRequiredAuth());
}
