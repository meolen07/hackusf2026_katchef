import { ImageSourcePropType } from "react-native";

export type BadgeDefinition = {
  name: string;
  description: string;
  unlockedSource: ImageSourcePropType;
  lockedSource: ImageSourcePropType;
};

const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  "First Scan": {
    name: "First Scan",
    description: "Captured your first ingredient scan with KatLens.",
    unlockedSource: require("../../assets/badges/gold-scan-camera.png"),
    lockedSource: require("../../assets/badges/silver-scan-camera.png"),
  },
  "Flavor Finder": {
    name: "Flavor Finder",
    description: "Built momentum by turning ingredients into dinner ideas.",
    unlockedSource: require("../../assets/badges/gold-ingredient-finder.png"),
    lockedSource: require("../../assets/badges/silver-ingredient-finder.png"),
  },
  "Fridge Curator": {
    name: "Fridge Curator",
    description: "Kept your fridge stocked, organized, and worth cooking from.",
    unlockedSource: require("../../assets/badges/gold-fridge-curator.png"),
    lockedSource: require("../../assets/badges/silver-fridge-curator.png"),
  },
  "Sous Chat": {
    name: "Sous Chat",
    description: "Chatted with KatChef enough to earn co-pilot status.",
    unlockedSource: require("../../assets/badges/gold-sous-chat.png"),
    lockedSource: require("../../assets/badges/silver-sous-chat.png"),
  },
  "Master Chef": {
    name: "Master Chef",
    description: "Reached the top level and unlocked the signature chef badge.",
    unlockedSource: require("../../assets/badges/gold-master-chef.png"),
    lockedSource: require("../../assets/badges/silver-master-chef.png"),
  },
};

export const BADGE_ORDER = [
  "First Scan",
  "Fridge Curator",
  "Sous Chat",
  "Flavor Finder",
  "Master Chef",
] as const;

export function getBadgeDefinition(name: string) {
  return BADGE_DEFINITIONS[name] ?? null;
}
