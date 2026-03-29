export type IngredientCategory =
  | "Vegetable"
  | "Fruit"
  | "Protein"
  | "Dairy"
  | "Pantry"
  | "Seasoning"
  | "Other";

export type ItemSource = "manual" | "scan";
export type ChatRole = "user" | "assistant";
export type MascotMood = "happy" | "thinking" | "celebrating" | "sleepy" | "curious";

export interface DetectedIngredient {
  name: string;
  quantity: string;
  category: IngredientCategory | string;
  confidence: number;
}

export interface PendingIngredient extends DetectedIngredient {
  draftId: string;
}

export interface FridgeItem extends DetectedIngredient {
  id: string;
  source: ItemSource;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRecipeSuggestion {
  title: string;
  reason: string;
  cookTime: string;
  ingredients: string[];
  steps?: string[];
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  suggestions?: ChatRecipeSuggestion[];
  tips?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface AppPreferences {
  mascotTips: boolean;
  autoSaveScan: boolean;
  notifications: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  xp: number;
  level: string;
  joinedAt: string;
  updatedAt: string;
  streak: number;
  scanCount: number;
  saveCount: number;
  chatCount: number;
  preferences: AppPreferences;
  badges: string[];
  goals: string[];
  dietaryPreferences: string[];
  allergies: string[];
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  provider: "password" | "google" | "guest";
}

export interface BackendHealth {
  status: "ok";
  appName: string;
  environment: string;
  firebaseEnabled: boolean;
  visionConfigured: boolean;
  chatbotConfigured: boolean;
  googleCredentialsConfigured?: boolean;
  host?: string;
  port?: number;
  maxUploadSizeMb?: number;
  corsOrigins?: string[];
}

export interface ChatbotMessageRequest {
  message: string;
  fridgeItems: DetectedIngredient[];
  history: Pick<ChatMessage, "role" | "content">[];
  profile?: {
    displayName?: string;
    level?: string;
    goals: string[];
    dietaryPreferences: string[];
    allergies: string[];
  };
}

export interface ChatbotResponse {
  reply: string;
  suggestedRecipes: ChatRecipeSuggestion[];
  tips: string[];
}

export interface VisionDetectResponse {
  ingredients: DetectedIngredient[];
}

export interface SelectedImage {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
}
