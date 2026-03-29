import { Platform } from "react-native";

import { env } from "../lib/env";
import {
  BackendHealth,
  ChatbotMessageRequest,
  ChatbotResponse,
  SelectedImage,
  VisionDetectResponse,
} from "../types/contracts";

function buildApiUrl(path: string) {
  if (!env.apiBaseUrl) {
    throw new Error(
      "KatChef could not resolve a backend URL. Set EXPO_PUBLIC_API_BASE_URL or EXPO_PUBLIC_API_PORT for this environment."
    );
  }
  return `${env.apiBaseUrl}${path}`;
}

async function buildServiceError(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: string };
    return payload.detail || `Request failed with status ${response.status}`;
  } catch {
    const text = await response.text();
    return text || `Request failed with status ${response.status}`;
  }
}

function normalizeRequestError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return new Error(fallback);
    }

    if (error.message.includes("Network request failed") || error.message.includes("Failed to fetch")) {
      return new Error(
        `KatChef could not reach ${env.apiBaseUrl || "the backend"}. Check the API base URL, CORS, or backend health.`
      );
    }

    return error;
  }

  return new Error(fallback);
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  timeoutMs = 20000,
  timeoutMessage = "The KatChef backend took too long to respond.",
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildApiUrl(path), {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await buildServiceError(response));
    }

    return (await response.json()) as T;
  } catch (error) {
    throw normalizeRequestError(error, timeoutMessage);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getBackendHealth(): Promise<BackendHealth> {
  return requestJson<BackendHealth>(
    "/health",
    {
      method: "GET",
    },
    8000,
    "KatChef could not confirm backend health in time.",
  );
}

export async function detectIngredients(image: SelectedImage): Promise<VisionDetectResponse> {
  const formData = new FormData();
  if (Platform.OS === "web" && image.file) {
    formData.append("file", image.file, image.name);
  } else {
    formData.append("file", {
      uri: image.uri,
      name: image.name,
      type: image.type,
    } as never);
  }

  return requestJson<VisionDetectResponse>(
    "/api/vision/detect",
    {
      method: "POST",
      body: formData,
    },
    45000,
    "KatChef took too long to scan that image. Try a smaller photo or check the Vision service.",
  );
}

export async function sendChatMessage(payload: ChatbotMessageRequest): Promise<ChatbotResponse> {
  return requestJson<ChatbotResponse>(
    "/api/chatbot/message",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    30000,
    "KatChef took too long to answer. Try again in a moment.",
  );
}
