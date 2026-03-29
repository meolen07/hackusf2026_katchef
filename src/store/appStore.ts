import type { create as CreateStore } from "zustand";

const { create } = require("zustand") as { create: typeof CreateStore };

import { buildDefaultChatSession, mascotTips } from "../constants/appContent";
import { XP_REWARDS } from "../constants/levels";
import {
  awardXp,
  deleteChatSessionById,
  deleteFridgeItemById,
  ensureUserProfile,
  getChatSession,
  listChatSessions,
  saveChatSession,
  saveFridgeItem,
  subscribeToFridgeItems,
  subscribeToUserProfile,
  updateUserAvatar,
  updateUserFoodProfile,
  updateUserPreferences,
} from "../lib/firestore";
import { sendChatMessage } from "../services/api";
import {
  AppPreferences,
  ChatMessage,
  ChatSession,
  DetectedIngredient,
  FridgeItem,
  MascotMood,
  PendingIngredient,
  SessionUser,
  UserProfile,
} from "../types/contracts";

interface BusyState {
  fridge: boolean;
  scan: boolean;
  chat: boolean;
}

interface AppState {
  activeUserId: string | null;
  profile: UserProfile | null;
  fridgeItems: FridgeItem[];
  pendingScan: PendingIngredient[];
  chatSession: ChatSession;
  chatSessions: ChatSession[];
  searchQuery: string;
  selectedCategory: string;
  mascotMood: MascotMood;
  mascotTipIndex: number;
  busy: BusyState;
  connectUser: (user: SessionUser) => Promise<void>;
  openChatSession: (sessionId: string) => Promise<void>;
  createNewChat: () => Promise<void>;
  deleteChatSession: (sessionId: string) => Promise<void>;
  resetUserData: () => void;
  setPendingScan: (ingredients: DetectedIngredient[]) => void;
  updatePendingScanIngredient: (draftId: string, patch: Partial<DetectedIngredient>) => void;
  removePendingScanIngredient: (draftId: string) => void;
  clearPendingScan: () => void;
  markScanReward: () => Promise<void>;
  savePendingScanToFridge: () => Promise<void>;
  saveIngredient: (input: {
    id?: string;
    name: string;
    quantity: string;
    category: string;
    confidence?: number;
    source?: FridgeItem["source"];
    createdAt?: string;
  }) => Promise<void>;
  deleteIngredient: (itemId: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  cycleMascotTip: () => void;
  setMascotMood: (mood: MascotMood) => void;
  togglePreference: (key: keyof AppPreferences) => Promise<void>;
  saveFoodProfile: (payload: Pick<UserProfile, "dietaryPreferences" | "allergies">) => Promise<void>;
  saveAvatar: (photoURL: string | null) => Promise<void>;
}

let profileUnsubscribe: (() => void) | null = null;
let fridgeUnsubscribe: (() => void) | null = null;
const LEGACY_TECHNICAL_CHAT_ERROR = "KatChef couldn't reach the live chat service.";
const FRIENDLY_CHAT_ERROR = "KatChef hit a temporary hiccup. Try again in a moment and I’ll jump back in.";

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanupSubscriptions() {
  profileUnsubscribe?.();
  fridgeUnsubscribe?.();
  profileUnsubscribe = null;
  fridgeUnsubscribe = null;
}

function buildAssistantMessage(content: string, suggestions?: ChatMessage["suggestions"], tips?: string[]): ChatMessage {
  return {
    id: makeId("assistant"),
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
    suggestions,
    tips,
  };
}

function isLegacyTechnicalAssistantMessage(message: ChatMessage) {
  return message.role === "assistant" && message.content.includes(LEGACY_TECHNICAL_CHAT_ERROR);
}

function isTransientChatErrorMessage(message: ChatMessage) {
  return (
    message.role === "assistant" &&
    (
      message.content.includes(LEGACY_TECHNICAL_CHAT_ERROR) ||
      message.content.includes(FRIENDLY_CHAT_ERROR)
    )
  );
}

function sanitizeChatSession(session: ChatSession): ChatSession {
  const filteredMessages = session.messages.filter((message) => !isTransientChatErrorMessage(message));
  if (filteredMessages.length === session.messages.length) {
    return session;
  }

  return {
    ...session,
    messages: filteredMessages.length > 0 ? filteredMessages : buildDefaultChatSession(session.id, session.title).messages,
    updatedAt: filteredMessages.at(-1)?.createdAt ?? new Date().toISOString(),
  };
}

function sortChatSessions(sessions: ChatSession[]) {
  return [...sessions].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function upsertChatSession(sessions: ChatSession[], nextSession: ChatSession) {
  return sortChatSessions([
    nextSession,
    ...sessions.filter((session) => session.id !== nextSession.id),
  ]);
}

export const useAppStore = create<AppState>((set, get) => ({
  activeUserId: null,
  profile: null,
  fridgeItems: [],
  pendingScan: [],
  chatSession: buildDefaultChatSession(),
  chatSessions: [buildDefaultChatSession()],
  searchQuery: "",
  selectedCategory: "All",
  mascotMood: "happy",
  mascotTipIndex: 0,
  busy: {
    fridge: false,
    scan: false,
    chat: false,
  },

  async connectUser(user) {
    cleanupSubscriptions();
    const profile = await ensureUserProfile(user);
    const storedSessions = await listChatSessions(user.id);
    const baseSessions = storedSessions.length > 0 ? storedSessions : [buildDefaultChatSession()];
    const sessions: ChatSession[] = [];

    for (const storedSession of baseSessions) {
      const session = sanitizeChatSession(storedSession);
      sessions.push(session);

      if (
        storedSessions.length === 0 ||
        session.messages.length !== storedSession.messages.length
      ) {
        await saveChatSession(user.id, session);
      }
    }

    const sortedSessions = sortChatSessions(sessions);
    const session = sortedSessions[0] ?? buildDefaultChatSession();

    set({
      activeUserId: user.id,
      profile,
      chatSession: session,
      chatSessions: sortedSessions,
      mascotMood: "happy",
    });

    profileUnsubscribe = subscribeToUserProfile(user.id, (nextProfile) => {
      if (nextProfile) {
        set({ profile: nextProfile });
      }
    });

    fridgeUnsubscribe = subscribeToFridgeItems(user.id, (items) => {
      set({ fridgeItems: items });
    });
  },

  async openChatSession(sessionId) {
    const { activeUserId, chatSessions } = get();
    if (!activeUserId) return;

    const currentSession = chatSessions.find((session) => session.id === sessionId);
    const loadedSession = sanitizeChatSession(
      currentSession ?? await getChatSession(activeUserId, sessionId),
    );

    if (currentSession && loadedSession.messages.length !== currentSession.messages.length) {
      await saveChatSession(activeUserId, loadedSession);
    }

    set((state) => ({
      chatSession: loadedSession,
      chatSessions: upsertChatSession(state.chatSessions, loadedSession),
      mascotMood: "curious",
    }));
  },

  async createNewChat() {
    const { activeUserId } = get();
    if (!activeUserId) return;

    const nextSession = buildDefaultChatSession(makeId("chat"), "New chat");
    set((state) => ({
      chatSession: nextSession,
      chatSessions: upsertChatSession(state.chatSessions, nextSession),
      mascotMood: "happy",
    }));

    await saveChatSession(activeUserId, nextSession);
  },

  async deleteChatSession(sessionId) {
    const { activeUserId, chatSession, chatSessions } = get();
    if (!activeUserId) return;

    const remainingSessions = chatSessions.filter((session) => session.id !== sessionId);
    const deletingActiveSession = chatSession.id === sessionId;

    await deleteChatSessionById(activeUserId, sessionId);

    let nextSessions = remainingSessions;
    let nextActiveSession = chatSession;

    if (remainingSessions.length === 0) {
      nextActiveSession = buildDefaultChatSession(makeId("chat"), "New chat");
      nextSessions = [nextActiveSession];
      await saveChatSession(activeUserId, nextActiveSession);
    } else if (deletingActiveSession) {
      nextActiveSession = remainingSessions[0];
    }

    set({
      chatSessions: nextSessions,
      chatSession: deletingActiveSession ? nextActiveSession : chatSession,
      mascotMood: "curious",
    });
  },

  resetUserData() {
    cleanupSubscriptions();
    set({
      activeUserId: null,
      profile: null,
      fridgeItems: [],
      pendingScan: [],
      chatSession: buildDefaultChatSession(),
      chatSessions: [buildDefaultChatSession()],
      searchQuery: "",
      selectedCategory: "All",
      mascotMood: "sleepy",
      mascotTipIndex: 0,
      busy: {
        fridge: false,
        scan: false,
        chat: false,
      },
    });
  },

  setPendingScan(ingredients) {
    set({
      pendingScan: ingredients.map((item) => ({
        ...item,
        draftId: makeId("scan"),
      })),
      mascotMood: "thinking",
    });
  },

  updatePendingScanIngredient(draftId, patch) {
    set((state) => ({
      pendingScan: state.pendingScan.map((item) =>
        item.draftId === draftId
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    }));
  },

  removePendingScanIngredient(draftId) {
    set((state) => ({
      pendingScan: state.pendingScan.filter((item) => item.draftId !== draftId),
    }));
  },

  clearPendingScan() {
    set({ pendingScan: [] });
  },

  async markScanReward() {
    const userId = get().activeUserId;
    if (!userId) return;
    await awardXp(userId, XP_REWARDS.scan, "scan");
    set({ mascotMood: "celebrating" });
  },

  async savePendingScanToFridge() {
    const userId = get().activeUserId;
    if (!userId) return;

    set((state) => ({ busy: { ...state.busy, fridge: true } }));

    try {
      const pendingItems = get().pendingScan;
      for (const item of pendingItems) {
        await saveFridgeItem(userId, {
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          confidence: item.confidence,
          source: "scan",
        });
      }
      if (pendingItems.length > 0) {
        await awardXp(userId, XP_REWARDS.save, "save");
      }
      set({
        pendingScan: [],
        mascotMood: "celebrating",
      });
    } finally {
      set((state) => ({ busy: { ...state.busy, fridge: false } }));
    }
  },

  async saveIngredient(input) {
    const userId = get().activeUserId;
    if (!userId) return;

    set((state) => ({ busy: { ...state.busy, fridge: true } }));
    try {
      await saveFridgeItem(userId, input);
      if (!input.id) {
        await awardXp(userId, XP_REWARDS.save, "save");
      }
      set({ mascotMood: "happy" });
    } finally {
      set((state) => ({ busy: { ...state.busy, fridge: false } }));
    }
  },

  async deleteIngredient(itemId) {
    const userId = get().activeUserId;
    if (!userId) return;
    await deleteFridgeItemById(userId, itemId);
    set({ mascotMood: "curious" });
  },

  async sendMessage(message) {
    const { activeUserId, fridgeItems, chatSession, profile } = get();
    if (!activeUserId || !message.trim()) return;

    const userMessage: ChatMessage = {
      id: makeId("user"),
      role: "user",
      content: message.trim(),
      createdAt: new Date().toISOString(),
    };
    const optimisticSession: ChatSession = {
      ...chatSession,
      title: chatSession.messages.length <= 1 ? message.trim().slice(0, 28) || chatSession.title : chatSession.title,
      updatedAt: userMessage.createdAt,
      messages: [...chatSession.messages, userMessage],
    };

    set({
      chatSession: optimisticSession,
      chatSessions: upsertChatSession(get().chatSessions, optimisticSession),
      mascotMood: "thinking",
      busy: { ...get().busy, chat: true },
    });

    try {
      try {
        await saveChatSession(activeUserId, optimisticSession);
      } catch {
        // Firestore persistence should not block a live chat reply.
      }

      const reply = await sendChatMessage({
        message: message.trim(),
        fridgeItems: fridgeItems.map(({ name, quantity, category, confidence }) => ({
          name,
          quantity,
          category,
          confidence,
        })),
        history: optimisticSession.messages.slice(-4).map(({ role, content }) => ({ role, content })),
        profile: profile
          ? {
              displayName: profile.displayName,
              level: profile.level,
              goals: profile.goals,
              dietaryPreferences: profile.dietaryPreferences,
              allergies: profile.allergies,
            }
          : undefined,
      });

      const assistantMessage = buildAssistantMessage(
        reply.reply,
        reply.suggestedRecipes,
        reply.tips,
      );
      const nextSession: ChatSession = {
        ...optimisticSession,
        updatedAt: assistantMessage.createdAt,
        messages: [...optimisticSession.messages, assistantMessage],
      };

      set({
        chatSession: nextSession,
        chatSessions: upsertChatSession(get().chatSessions, nextSession),
        mascotMood: "happy",
      });

      try {
        await saveChatSession(activeUserId, nextSession);
      } catch {
        // Keep the UI responsive even if persistence briefly fails.
      }

      try {
        await awardXp(activeUserId, XP_REWARDS.chat, "chat");
      } catch {
        // XP should not downgrade a successful chat experience.
      }
    } catch {
      const errorMessage = buildAssistantMessage(
        FRIENDLY_CHAT_ERROR,
      );
      const failedSession: ChatSession = {
        ...optimisticSession,
        messages: [...optimisticSession.messages, errorMessage],
        updatedAt: errorMessage.createdAt,
      };
      set({
        chatSession: failedSession,
        chatSessions: upsertChatSession(get().chatSessions, failedSession),
        mascotMood: "curious",
      });
    } finally {
      set((state) => ({
        busy: { ...state.busy, chat: false },
      }));
    }
  },

  setSearchQuery(searchQuery) {
    set({ searchQuery });
  },

  setSelectedCategory(selectedCategory) {
    set({ selectedCategory });
  },

  cycleMascotTip() {
    set((state) => ({
      mascotTipIndex: (state.mascotTipIndex + 1) % mascotTips.length,
    }));
  },

  setMascotMood(mascotMood) {
    set({ mascotMood });
  },

  async togglePreference(key) {
    const { activeUserId, profile } = get();
    if (!activeUserId || !profile) return;

    const next = await updateUserPreferences(activeUserId, {
      [key]: !profile.preferences[key],
    });
    set({
      profile: next,
      mascotMood: "curious",
    });
  },

  async saveFoodProfile(payload) {
    const { activeUserId } = get();
    if (!activeUserId) return;

    const next = await updateUserFoodProfile(activeUserId, payload);
    set({
      profile: next,
      mascotMood: "happy",
    });
  },

  async saveAvatar(photoURL) {
    const { activeUserId } = get();
    if (!activeUserId) return;

    const next = await updateUserAvatar(activeUserId, photoURL);
    set({
      profile: next,
      mascotMood: photoURL ? "celebrating" : "curious",
    });
  },
}));
