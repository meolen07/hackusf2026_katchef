import { NativeModules, Platform } from "react-native";

const EXPO_PUBLIC_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? "";
const EXPO_PUBLIC_API_PORT = process.env.EXPO_PUBLIC_API_PORT?.trim() ?? "";
const EXPO_PUBLIC_FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim() ?? "";
const EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN =
  process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? "";
const EXPO_PUBLIC_FIREBASE_PROJECT_ID =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "";
const EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET =
  process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ?? "";
const EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID =
  process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? "";
const EXPO_PUBLIC_FIREBASE_APP_ID = process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim() ?? "";
const EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID =
  process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() ?? "";
const EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? "";
const EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? "";
const EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ?? "";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isPrivateIpv4Host(hostname: string) {
  return (
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function getBrowserLocation() {
  if (typeof window === "undefined" || !window.location) {
    return null;
  }
  return window.location;
}

function getMetroBundleHost() {
  if (Platform.OS === "web") {
    return "";
  }

  const scriptURL =
    (NativeModules as { SourceCode?: { scriptURL?: string } })?.SourceCode?.scriptURL ?? "";

  if (!scriptURL) {
    return "";
  }

  const parsed = parseUrl(scriptURL);
  if (parsed?.hostname) {
    return parsed.hostname;
  }

  const match = scriptURL.match(/^https?:\/\/([^/:]+)/i);
  return match?.[1] ?? "";
}

function resolveApiBaseUrl(explicitBaseUrl: string, apiPort: string) {
  const browserLocation = getBrowserLocation();
  const metroBundleHost = getMetroBundleHost();

  if (explicitBaseUrl) {
    const parsed = parseUrl(explicitBaseUrl);
    if (
      Platform.OS === "web" &&
      browserLocation &&
      parsed &&
      isLoopbackHost(browserLocation.hostname) &&
      (isPrivateIpv4Host(parsed.hostname) || parsed.hostname.endsWith(".local"))
    ) {
      const port = parsed.port ? `:${parsed.port}` : "";
      return trimTrailingSlash(`${parsed.protocol}//${browserLocation.hostname}${port}`);
    }

    if (
      Platform.OS !== "web" &&
      parsed &&
      isLoopbackHost(parsed.hostname) &&
      metroBundleHost
    ) {
      const port = parsed.port ? `:${parsed.port}` : "";
      return trimTrailingSlash(`${parsed.protocol}//${metroBundleHost}${port}`);
    }

    return trimTrailingSlash(explicitBaseUrl);
  }

  if (browserLocation) {
    if (apiPort) {
      return trimTrailingSlash(`${browserLocation.protocol}//${browserLocation.hostname}:${apiPort}`);
    }
    return trimTrailingSlash(browserLocation.origin);
  }

  if (metroBundleHost && apiPort) {
    return trimTrailingSlash(`http://${metroBundleHost}:${apiPort}`);
  }

  return "";
}

function requiredFirebaseKeys() {
  return [
    EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    EXPO_PUBLIC_FIREBASE_APP_ID,
  ];
}

const explicitApiBaseUrl = trimTrailingSlash(EXPO_PUBLIC_API_BASE_URL);
const apiPort = EXPO_PUBLIC_API_PORT;
const apiBaseUrl = resolveApiBaseUrl(explicitApiBaseUrl, apiPort);
const metroBundleHost = getMetroBundleHost();
const browserLocation = getBrowserLocation();
const firebaseConfigured = requiredFirebaseKeys().every(Boolean);
const nativeGoogleClientConfigured = Boolean(EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
const nativeGoogleAuthConfigured =
  Platform.OS === "web"
    ? true
    : Boolean(EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) &&
      (Platform.OS === "android" || nativeGoogleClientConfigured);

const googleAuthAvailable = Platform.OS === "web" || nativeGoogleAuthConfigured;
const googleAuthMessage =
  Platform.OS === "web"
    ? "Google sign-in is ready for browser auth."
    : nativeGoogleAuthConfigured
      ? "Google sign-in is configured for native builds. Use a development build or production app instead of Expo Go."
      : "Google sign-in needs the web client ID plus the iOS client ID before it can run on native builds.";

export const env = {
  apiBaseUrl,
  apiPort,
  explicitApiBaseUrl,
  apiBaseUrlResolvedFrom: explicitApiBaseUrl
    ? "explicit"
    : browserLocation
      ? "browser-host"
      : metroBundleHost
        ? "metro-host"
        : "unset",
  googleWebClientId: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  googleIosClientId: EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  googleAndroidClientId: EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  googleAuthAvailable,
  googleAuthMessage,
  runtime: {
    platform: Platform.OS,
    isWeb: Platform.OS === "web",
    isNative: Platform.OS !== "web",
    browserHost: browserLocation?.hostname ?? "",
    metroBundleHost,
  },
  firebase: {
    apiKey: EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
  firebaseConfigured,
};
