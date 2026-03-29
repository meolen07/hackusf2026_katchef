import { Platform } from "react-native";

export const colors = {
  coral: "#FF6B57",
  coralDeep: "#E55641",
  coralSoft: "#FFE1DA",
  green: "#3B9C68",
  greenSoft: "#DDF5E8",
  cream: "#FFF8ED",
  creamSoft: "#FFFDF8",
  creamDeep: "#F8EADA",
  yellow: "#F7C948",
  yellowSoft: "#FFF0BE",
  ink: "#2E2924",
  inkSoft: "#534B44",
  muted: "#7B7268",
  card: "#FFFDF9",
  border: "#F0E3D3",
  white: "#FFFFFF",
  danger: "#D85C52",
  info: "#5E8BFF",
  overlay: "rgba(46, 41, 36, 0.08)",
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const typography = {
  display: "Poppins_700Bold",
  heading: "Poppins_600SemiBold",
  body: "Inter_400Regular",
  bodyBold: "Inter_600SemiBold",
};

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: "#A96A3C",
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    android: {
      elevation: 6,
    },
    default: {
      shadowColor: "#A96A3C",
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
  }),
  float: Platform.select({
    ios: {
      shadowColor: "#A96A3C",
      shadowOpacity: 0.18,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 16 },
    },
    android: {
      elevation: 10,
    },
    default: {
      shadowColor: "#A96A3C",
      shadowOpacity: 0.18,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 16 },
    },
  }),
  soft: Platform.select({
    ios: {
      shadowColor: "#A96A3C",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    android: {
      elevation: 3,
    },
    default: {
      shadowColor: "#A96A3C",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
  }),
};
