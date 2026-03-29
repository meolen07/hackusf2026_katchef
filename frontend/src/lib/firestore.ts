import { Platform } from "react-native";

const implementation = Platform.OS === "web"
  ? require("./firestore.web")
  : require("./firestore.native");

export const ensureUserProfile = implementation.ensureUserProfile as typeof import("./firestore.web").ensureUserProfile;
export const subscribeToUserProfile = implementation.subscribeToUserProfile as typeof import("./firestore.web").subscribeToUserProfile;
export const subscribeToFridgeItems = implementation.subscribeToFridgeItems as typeof import("./firestore.web").subscribeToFridgeItems;
export const saveFridgeItem = implementation.saveFridgeItem as typeof import("./firestore.web").saveFridgeItem;
export const deleteFridgeItemById = implementation.deleteFridgeItemById as typeof import("./firestore.web").deleteFridgeItemById;
export const getChatSession = implementation.getChatSession as typeof import("./firestore.web").getChatSession;
export const listChatSessions = implementation.listChatSessions as typeof import("./firestore.web").listChatSessions;
export const saveChatSession = implementation.saveChatSession as typeof import("./firestore.web").saveChatSession;
export const deleteChatSessionById = implementation.deleteChatSessionById as typeof import("./firestore.web").deleteChatSessionById;
export const updateUserPreferences = implementation.updateUserPreferences as typeof import("./firestore.web").updateUserPreferences;
export const updateUserFoodProfile = implementation.updateUserFoodProfile as typeof import("./firestore.web").updateUserFoodProfile;
export const updateUserAvatar = implementation.updateUserAvatar as typeof import("./firestore.web").updateUserAvatar;
export const awardXp = implementation.awardXp as typeof import("./firestore.web").awardXp;
