import type { create as CreateStore } from "zustand";

const { create } = require("zustand") as { create: typeof CreateStore };

import {
  observeAuthState,
  requestPasswordReset,
  signInAsGuest,
  signInWithEmail,
  signInWithGoogle,
  signOut as performSignOut,
  signUpWithEmail,
} from "../lib/auth";
import { SessionUser } from "../types/contracts";
import { useAppStore } from "./appStore";

type AuthStatus = "booting" | "authenticated" | "anonymous";

interface AuthState {
  status: AuthStatus;
  user: SessionUser | null;
  error: string | null;
  bootstrap: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  sendReset: (email: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

let bootstrapped = false;
let authUnsubscribe: (() => void) | null = null;

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    if (
      error.message.includes("firestore.googleapis.com") ||
      error.message.includes("Cloud Firestore API has not been used") ||
      error.message.includes("FirebaseError: [code=permission-denied]") ||
      error.message.includes("Missing or insufficient permissions") ||
      error.message.includes("PERMISSION_DENIED")
    ) {
      return "Cloud Firestore is blocking writes for this user. Publish the Firestore security rules, then try again.";
    }

    if (error.message.includes("unauthorized-domain")) {
      return "This browser domain is not authorized in Firebase Authentication yet. Add localhost and 127.0.0.1 to Authorized domains.";
    }

    if (error.message.includes("development build") || error.message.includes("Expo Go")) {
      return "Google sign-in on mobile needs a development build or production app. Expo Go cannot run the native Google auth module.";
    }

    if (error.message.includes("PLAY_SERVICES")) {
      return "Google Play Services is unavailable on this device right now, so Google sign-in cannot start.";
    }

    return error.message;
  }
  return "Something went sideways. Please try once more.";
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "booting",
  user: null,
  error: null,

  bootstrap() {
    if (bootstrapped) return;
    try {
      bootstrapped = true;
      authUnsubscribe = observeAuthState(async (user) => {
        if (user) {
          try {
            await useAppStore.getState().connectUser(user);
            set({
              user,
              status: "authenticated",
              error: null,
            });
          } catch (error) {
            useAppStore.getState().resetUserData();
            set({
              user: null,
              status: "anonymous",
              error: normalizeError(error),
            });
            void performSignOut().catch(() => undefined);
          }
          return;
        }

        useAppStore.getState().resetUserData();
        set({
          user: null,
          status: "anonymous",
          error: null,
        });
      });
    } catch (error) {
      bootstrapped = false;
      set({
        user: null,
        status: "anonymous",
        error: normalizeError(error),
      });
    }
  },

  async signIn(email, password) {
    try {
      set({ error: null });
      await signInWithEmail(email, password);
    } catch (error) {
      set({ error: normalizeError(error) });
    }
  },

  async signUp(email, password, displayName) {
    try {
      set({ error: null });
      await signUpWithEmail(email, password, displayName);
    } catch (error) {
      set({ error: normalizeError(error) });
    }
  },

  async sendReset(email) {
    try {
      set({ error: null });
      await requestPasswordReset(email);
      set({ error: "Password reset sent. Check your inbox." });
    } catch (error) {
      set({ error: normalizeError(error) });
    }
  },

  async signInAsGuest() {
    try {
      set({ error: null });
      await signInAsGuest();
    } catch (error) {
      set({ error: normalizeError(error) });
    }
  },

  async signInWithGoogle() {
    try {
      set({ error: null });
      await signInWithGoogle();
    } catch (error) {
      set({ error: normalizeError(error) });
    }
  },

  async signOut() {
    try {
      await performSignOut();
    } catch (error) {
      set({ error: normalizeError(error) });
    }
  },

  clearError() {
    set({ error: null });
  },
}));
