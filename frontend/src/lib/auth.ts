import { Platform } from "react-native";

const implementation = Platform.OS === "web"
  ? require("./auth.web")
  : require("./auth.native");

export const observeAuthState = implementation.observeAuthState as typeof import("./auth.web").observeAuthState;
export const signInWithEmail = implementation.signInWithEmail as typeof import("./auth.web").signInWithEmail;
export const signUpWithEmail = implementation.signUpWithEmail as typeof import("./auth.web").signUpWithEmail;
export const requestPasswordReset = implementation.requestPasswordReset as typeof import("./auth.web").requestPasswordReset;
export const signInAsGuest = implementation.signInAsGuest as typeof import("./auth.web").signInAsGuest;
export const signInWithGoogle = implementation.signInWithGoogle as typeof import("./auth.web").signInWithGoogle;
export const signOut = implementation.signOut as typeof import("./auth.web").signOut;
export const googleSignInEnabled = implementation.googleSignInEnabled as boolean;
export const googleSignInMessage = implementation.googleSignInMessage as string;
