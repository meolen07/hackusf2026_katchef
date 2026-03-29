import {
  AppPreferences,
  ChatMessage,
  ChatRecipeSuggestion,
  ChatSession,
} from "../types/contracts";

export const defaultPreferences: AppPreferences = {
  mascotTips: true,
  autoSaveScan: false,
  notifications: true,
};

export const mascotTips = [
  "Save scanned ingredients right away so your fridge stays smarter than your memory.",
  "Acid at the end is the secret sauce. Lemon, vinegar, or yogurt can wake up almost anything.",
  "Cook protein first, greens last, and suddenly weeknight dinner looks suspiciously competent.",
  "When the fridge feels chaotic, build a bowl: grain, veg, protein, sauce. It works more often than it should.",
];

export const quickChatPrompts = [
  "What can I cook in 15 minutes?",
  "Give me a healthy dinner idea.",
  "What should I use before it goes bad?",
  "Turn my fridge into lunch.",
];

export const dietaryPreferenceOptions = [
  "Vegan",
  "Vegetarian",
  "Pescatarian",
  "Gluten-free",
  "Dairy-free",
  "Halal",
  "Kosher",
  "High-protein",
] as const;

export const allergyExamples = ["Peanuts", "Shellfish", "Dairy", "Soy", "Eggs"];

export const starterSuggestions: ChatRecipeSuggestion[] = [
  {
    title: "Golden Egg Toast",
    reason: "Fast, comforting, and perfect when effort is running low.",
    cookTime: "8 min",
    ingredients: ["Eggs", "Bread", "Butter"],
  },
  {
    title: "Sheet Pan Green Bowl",
    reason: "A low-mess way to use a fridge full of vegetables.",
    cookTime: "20 min",
    ingredients: ["Broccoli", "Spinach", "Rice", "Lemon"],
  },
];

export function buildWelcomeMessage(): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content:
      "Tell me what’s in your fridge or what mood you’re cooking for, and I’ll keep the advice short, useful, and slightly charming.",
    createdAt: new Date().toISOString(),
    suggestions: starterSuggestions,
    tips: mascotTips.slice(0, 2),
  };
}

export function buildDefaultChatSession(sessionId = "primary", title?: string): ChatSession {
  const resolvedTitle = title ?? (sessionId === "primary" ? "Kitchen Chat" : "New chat");
  return {
    id: sessionId,
    title: resolvedTitle,
    updatedAt: new Date().toISOString(),
    messages: [buildWelcomeMessage()],
  };
}
