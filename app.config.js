const appJson = require("./app.json");

function deriveIosUrlScheme(iosClientId) {
  if (!iosClientId || !iosClientId.includes(".apps.googleusercontent.com")) {
    return undefined;
  }

  const clientPrefix = iosClientId.replace(".apps.googleusercontent.com", "");
  return `com.googleusercontent.apps.${clientPrefix}`;
}

const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
const iosUrlScheme = deriveIosUrlScheme(iosClientId);
const googleServicesIosFile = process.env.GOOGLE_SERVICES_IOS_FILE;
const googleServicesAndroidFile = process.env.GOOGLE_SERVICES_ANDROID_FILE;

module.exports = () => {
  const baseConfig = appJson.expo;
  const plugins = [...(baseConfig.plugins || [])];

  plugins.push(
    iosUrlScheme
      ? [
          "@react-native-google-signin/google-signin",
          {
            iosUrlScheme,
          },
        ]
      : "@react-native-google-signin/google-signin",
  );

  return {
    ...baseConfig,
    plugins,
    ios: {
      ...baseConfig.ios,
      ...(googleServicesIosFile ? { googleServicesFile: googleServicesIosFile } : {}),
    },
    android: {
      ...baseConfig.android,
      ...(googleServicesAndroidFile ? { googleServicesFile: googleServicesAndroidFile } : {}),
    },
  };
};
