import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type Auth,
} from "firebase/auth";

import { getRequiredAuthService } from "./firebase.web";
import { SessionUser } from "../types/contracts";

type AuthListener = (user: SessionUser | null) => void;

export const googleSignInEnabled = true;
export const googleSignInMessage = "Google sign-in is available in the browser and works best in popup-friendly environments.";

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

function getRequiredAuth(): Auth {
  return getRequiredAuthService();
}

export function observeAuthState(listener: AuthListener) {
  return onAuthStateChanged(
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
  const credential = await signInWithEmailAndPassword(getRequiredAuth(), email, password);
  return mapFirebaseUser(credential.user, "password");
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(getRequiredAuth(), email, password);
  if (displayName) {
    await updateProfile(credential.user, { displayName });
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
  await sendPasswordResetEmail(getRequiredAuth(), email);
}

export async function signInAsGuest() {
  try {
    const credential = await signInAnonymously(getRequiredAuth());
    return mapFirebaseUser(credential.user, "guest");
  } catch (error) {
    throw normalizeGuestError(error);
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const credential = await signInWithPopup(getRequiredAuth(), provider);
    return mapFirebaseUser(credential.user, "google");
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("popup-blocked") || error.message.includes("cancelled-popup-request"))
    ) {
      await signInWithRedirect(getRequiredAuth(), provider);
      return new Promise<SessionUser>(() => undefined);
    }
    throw error;
  }
}

export async function signOut() {
  await firebaseSignOut(getRequiredAuth());
}
