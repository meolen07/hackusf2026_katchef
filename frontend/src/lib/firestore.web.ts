import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

import { defaultPreferences, buildDefaultChatSession } from "../constants/appContent";
import { getLevelForXp } from "../constants/levels";
import {
  AppPreferences,
  ChatSession,
  FridgeItem,
  SessionUser,
  UserProfile,
} from "../types/contracts";
import { getRequiredFirestoreService } from "./firebase.web";

type ProfileListener = (profile: UserProfile | null) => void;
type FridgeListener = (items: FridgeItem[]) => void;

type FridgeItemInput = Pick<FridgeItem, "name" | "quantity" | "category"> &
  Partial<Pick<FridgeItem, "id" | "confidence" | "source" | "createdAt">>;

type XpReason = "scan" | "save" | "chat";

function nowIso() {
  return new Date().toISOString();
}

function getRequiredDb(): Firestore {
  return getRequiredFirestoreService();
}

function buildBadges(profile: UserProfile) {
  const badges = new Set<string>();
  if (profile.scanCount >= 1) badges.add("First Scan");
  if (profile.saveCount >= 5) badges.add("Fridge Curator");
  if (profile.chatCount >= 5) badges.add("Sous Chat");
  if (profile.xp >= 180) badges.add("Flavor Finder");
  if (profile.level === "Master Chef") badges.add("Master Chef");
  return Array.from(badges);
}

function deriveProfile(profile: UserProfile): UserProfile {
  const level = getLevelForXp(profile.xp).title;
  return {
    ...profile,
    level,
    badges: buildBadges({ ...profile, level }),
  };
}

function buildDefaultProfile(user: SessionUser): UserProfile {
  const timestamp = nowIso();
  return deriveProfile({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    xp: 0,
    level: "Beginner",
    joinedAt: timestamp,
    updatedAt: timestamp,
    streak: 1,
    scanCount: 0,
    saveCount: 0,
    chatCount: 0,
    preferences: defaultPreferences,
    badges: [],
    goals: ["Cook more at home"],
    dietaryPreferences: [],
    allergies: [],
  });
}

function mapProfile(userId: string, data: Record<string, unknown>): UserProfile {
  return deriveProfile({
    id: userId,
    email: String(data.email ?? "chef@katchef.app"),
    displayName: String(data.displayName ?? "KatChef Cook"),
    photoURL: (data.photoURL as string | null | undefined) ?? null,
    xp: Number(data.xp ?? 0),
    level: String(data.level ?? "Beginner"),
    joinedAt: String(data.joinedAt ?? nowIso()),
    updatedAt: String(data.updatedAt ?? nowIso()),
    streak: Number(data.streak ?? 1),
    scanCount: Number(data.scanCount ?? 0),
    saveCount: Number(data.saveCount ?? 0),
    chatCount: Number(data.chatCount ?? 0),
    preferences: {
      mascotTips: Boolean((data.preferences as AppPreferences | undefined)?.mascotTips ?? true),
      autoSaveScan: Boolean((data.preferences as AppPreferences | undefined)?.autoSaveScan ?? false),
      notifications: Boolean((data.preferences as AppPreferences | undefined)?.notifications ?? true),
    },
    badges: Array.isArray(data.badges) ? (data.badges as string[]) : [],
    goals: Array.isArray(data.goals) ? (data.goals as string[]) : ["Cook more at home"],
    dietaryPreferences: Array.isArray(data.dietaryPreferences)
      ? (data.dietaryPreferences as string[])
      : [],
    allergies: Array.isArray(data.allergies) ? (data.allergies as string[]) : [],
  });
}

function mapFridgeItem(itemId: string, data: Record<string, unknown>): FridgeItem {
  return {
    id: itemId,
    name: String(data.name ?? "Ingredient"),
    quantity: String(data.quantity ?? "1 item"),
    category: String(data.category ?? "Other"),
    confidence: Number(data.confidence ?? 1),
    source: (data.source as FridgeItem["source"]) ?? "manual",
    createdAt: String(data.createdAt ?? nowIso()),
    updatedAt: String(data.updatedAt ?? nowIso()),
  };
}

function mapChatSession(sessionId: string, data: Record<string, unknown>): ChatSession {
  const fallback = buildDefaultChatSession(sessionId);

  return {
    id: typeof data.id === "string" ? data.id : sessionId,
    title: typeof data.title === "string" && data.title.trim().length > 0 ? data.title : fallback.title,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : fallback.updatedAt,
    messages: Array.isArray(data.messages) ? (data.messages as ChatSession["messages"]) : fallback.messages,
  };
}

export async function ensureUserProfile(user: SessionUser) {
  const firestore = getRequiredDb();
  const userRef = doc(firestore, "users", user.id);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    return mapProfile(user.id, snapshot.data());
  }

  const profile = buildDefaultProfile(user);
  await setDoc(userRef, profile);
  return profile;
}

export function subscribeToUserProfile(userId: string, listener: ProfileListener) {
  const firestore = getRequiredDb();
  return onSnapshot(doc(firestore, "users", userId), (snapshot) => {
    listener(snapshot.exists() ? mapProfile(userId, snapshot.data()) : null);
  });
}

export function subscribeToFridgeItems(userId: string, listener: FridgeListener) {
  const firestore = getRequiredDb();
  const fridgeQuery = query(
    collection(firestore, "users", userId, "fridgeItems"),
    orderBy("updatedAt", "desc"),
  );
  return onSnapshot(fridgeQuery, (snapshot) => {
    listener(snapshot.docs.map((entry) => mapFridgeItem(entry.id, entry.data())));
  });
}

export async function saveFridgeItem(userId: string, input: FridgeItemInput) {
  const firestore = getRequiredDb();
  const timestamp = nowIso();
  const itemId = input.id ?? `fridge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const item: FridgeItem = {
    id: itemId,
    name: input.name.trim(),
    quantity: input.quantity.trim(),
    category: input.category.trim(),
    confidence: input.confidence ?? 1,
    source: input.source ?? "manual",
    createdAt: input.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  await setDoc(doc(firestore, "users", userId, "fridgeItems", itemId), item);
  return item;
}

export async function deleteFridgeItemById(userId: string, itemId: string) {
  const firestore = getRequiredDb();
  await deleteDoc(doc(firestore, "users", userId, "fridgeItems", itemId));
}

export async function getChatSession(userId: string, sessionId = "primary") {
  const firestore = getRequiredDb();
  const snapshot = await getDoc(doc(firestore, "users", userId, "chatSessions", sessionId));
  if (!snapshot.exists()) {
    return buildDefaultChatSession(sessionId);
  }
  return mapChatSession(snapshot.id, snapshot.data());
}

export async function listChatSessions(userId: string) {
  const firestore = getRequiredDb();
  const chatSessionsQuery = query(
    collection(firestore, "users", userId, "chatSessions"),
    orderBy("updatedAt", "desc"),
  );
  const snapshot = await getDocs(chatSessionsQuery);
  return snapshot.docs.map((entry) => mapChatSession(entry.id, entry.data()));
}

export async function saveChatSession(userId: string, session: ChatSession) {
  const firestore = getRequiredDb();
  await setDoc(doc(firestore, "users", userId, "chatSessions", session.id), session);
  return session;
}

export async function deleteChatSessionById(userId: string, sessionId: string) {
  const firestore = getRequiredDb();
  await deleteDoc(doc(firestore, "users", userId, "chatSessions", sessionId));
}

export async function updateUserPreferences(userId: string, preferences: Partial<AppPreferences>) {
  const firestore = getRequiredDb();
  const timestamp = nowIso();
  const userRef = doc(firestore, "users", userId);
  const current = await getDoc(userRef);
  const profile = current.exists()
    ? mapProfile(userId, current.data())
    : buildDefaultProfile({
        id: userId,
        email: "chef@katchef.app",
        displayName: "KatChef Cook",
        provider: "password",
        photoURL: null,
      });
  const next = deriveProfile({
    ...profile,
    preferences: {
      ...profile.preferences,
      ...preferences,
    },
    updatedAt: timestamp,
  });
  await setDoc(userRef, next);
  return next;
}

export async function updateUserFoodProfile(
  userId: string,
  payload: Pick<UserProfile, "dietaryPreferences" | "allergies">,
) {
  const firestore = getRequiredDb();
  const timestamp = nowIso();
  const userRef = doc(firestore, "users", userId);
  const current = await getDoc(userRef);
  const profile = current.exists()
    ? mapProfile(userId, current.data())
    : buildDefaultProfile({
        id: userId,
        email: "chef@katchef.app",
        displayName: "KatChef Cook",
        provider: "password",
        photoURL: null,
      });

  const next = deriveProfile({
    ...profile,
    dietaryPreferences: payload.dietaryPreferences,
    allergies: payload.allergies,
    updatedAt: timestamp,
  });

  await setDoc(userRef, next);
  return next;
}

export async function updateUserAvatar(userId: string, photoURL: string | null) {
  const firestore = getRequiredDb();
  const timestamp = nowIso();
  const userRef = doc(firestore, "users", userId);
  const current = await getDoc(userRef);
  const profile = current.exists()
    ? mapProfile(userId, current.data())
    : buildDefaultProfile({
        id: userId,
        email: "chef@katchef.app",
        displayName: "KatChef Cook",
        provider: "password",
        photoURL: null,
      });

  const next = deriveProfile({
    ...profile,
    photoURL,
    updatedAt: timestamp,
  });

  await setDoc(userRef, next);
  return next;
}

export async function awardXp(userId: string, amount: number, reason: XpReason) {
  const firestore = getRequiredDb();
  const timestamp = nowIso();
  const userRef = doc(firestore, "users", userId);
  const snapshot = await getDoc(userRef);
  const current = snapshot.exists()
    ? mapProfile(userId, snapshot.data())
    : buildDefaultProfile({
        id: userId,
        email: "chef@katchef.app",
        displayName: "KatChef Cook",
        provider: "password",
        photoURL: null,
      });
  const next = deriveProfile({
    ...current,
    xp: current.xp + amount,
    updatedAt: timestamp,
    scanCount: current.scanCount + (reason === "scan" ? 1 : 0),
    saveCount: current.saveCount + (reason === "save" ? 1 : 0),
    chatCount: current.chatCount + (reason === "chat" ? 1 : 0),
  });
  await setDoc(userRef, next);
  return next;
}
