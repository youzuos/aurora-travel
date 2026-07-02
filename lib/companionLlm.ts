import {
  getCharacter,
  getCompanionLocalTimeInfo,
  getCurrentLocation,
  type CompanionMessage,
  type CompanionState,
} from "./companion";
import { getCompanionBehaviorProfile, pickInterestPromptLine } from "./companionBehavior";
import type { Lang } from "./types";

export type CompanionLlmProvider = "gemini" | "azure" | "openai";

export type CompanionLlmReplyResult = {
  messages?: Array<{
    id?: string;
    textZh?: string;
    textEn?: string;
  }>;
};

const LLM_TIMEOUT_MS = 15000;

function logLlmFallback(reason: string, detail?: unknown) {
  if (process.env.NODE_ENV !== "development") return;
  const message = detail instanceof Error ? detail.message : detail;
  console.warn("[companion-llm] generation unavailable:", reason, message ?? "");
}

function safeText(value: unknown, fallback: string, maxLength = 280) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}...` : trimmed;
}

function extractOutputText(data: any): string | null {
  if (typeof data?.output_text === "string") return data.output_text;

  const content = data?.output
    ?.flatMap((item: any) => item.content ?? [])
    ?.find((item: any) => item.type === "output_text" || item.type === "text");

  return typeof content?.text === "string" ? content.text : null;
}

function extractChatText(data: any): string | null {
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : null;
}

function extractGeminiText(data: any): string | null {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;

  const text = parts
    .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();

  return text || null;
}

export function parseLlmJson(text: string): CompanionLlmReplyResult | null {
  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const candidates = [trimmed, unfenced];
  const objectStart = unfenced.indexOf("{");
  const objectEnd = unfenced.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    candidates.push(unfenced.slice(objectStart, objectEnd + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as CompanionLlmReplyResult;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // Try the next shape.
    }
  }

  return null;
}

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  if (!apiKey) return null;
  return { apiKey, model };
}

function getAzureConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/+$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";

  if (!endpoint || !apiKey || !deployment) return null;
  return { endpoint, apiKey, deployment, apiVersion };
}

function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey) return null;
  return { apiKey, model };
}

export function hasCompanionLlmConfig() {
  return Boolean(getGeminiConfig() || getAzureConfig() || getOpenAIConfig());
}

export function applyLlmMessages(
  plannedState: CompanionState,
  plannedMessages: readonly CompanionMessage[],
  result: CompanionLlmReplyResult
) {
  const agentIds = new Set(plannedMessages.filter((message) => message.sender === "agent").map((message) => message.id));
  const replacements = new Map(
    (result.messages ?? [])
      .filter((message) => typeof message.id === "string" && agentIds.has(message.id))
      .map((message) => [message.id as string, message])
  );

  if (replacements.size === 0) {
    return { state: plannedState, messages: plannedMessages };
  }

  const messages = plannedMessages.map((message) => {
    const replacement = replacements.get(message.id);
    if (!replacement || message.sender !== "agent") return message;
    return {
      ...message,
      textZh: safeText(replacement.textZh, message.textZh),
      textEn: safeText(replacement.textEn, message.textEn),
      image: message.image
        ? {
            ...message.image,
            captionZh: safeText(replacement.textZh, message.image.captionZh, 180),
            captionEn: safeText(replacement.textEn, message.image.captionEn, 180),
          }
        : message.image,
    };
  });

  const byId = new Map(messages.map((message) => [message.id, message]));
  return {
    messages,
    state: {
      ...plannedState,
      messageHistory: plannedState.messageHistory.map((message) => byId.get(message.id) ?? message),
    },
  };
}

function createLlmPrompt(
  input: string,
  lang: Lang,
  state: CompanionState,
  now: number,
  candidateMessages: readonly CompanionMessage[],
  mode: "reply" | "passive"
) {
  const location = getCurrentLocation(state);
  const character = state.selectedCharacterId ? getCharacter(state.selectedCharacterId) : null;
  const behavior = getCompanionBehaviorProfile(state.selectedCharacterId);
  const timeInfo = getCompanionLocalTimeInfo(state, now);
  const isMealTime = timeInfo.meal === "breakfast" || timeInfo.meal === "lunch" || timeInfo.meal === "dinner";
  const mealGuidance = isMealTime
    ? `It is ${timeInfo.meal} time in the companion's city. Food must be central: mention a meal, snack, smell, market, cafe, menu, queue, table, or something it is eating or choosing.`
    : "It is not a main meal time. Do not call it breakfast, lunch, or dinner unless the user asks about food.";
  const candidateIds = new Set(candidateMessages.map((message) => message.id));
  const recentMessages = state.messageHistory
    .filter((message) => !candidateIds.has(message.id))
    .slice(-10)
    .map((message) => ({
      sender: message.sender,
      kind: message.kind,
      textZh: message.textZh,
      textEn: message.textEn,
    }));
  const candidateAgentMessages = candidateMessages
    .filter((message) => message.sender === "agent")
    .map((message) => ({
      id: message.id,
      kind: message.kind,
      textZh: message.textZh,
      textEn: message.textEn,
      hasImage: Boolean(message.image),
    }));

  const characterStyle = character
    ? `Selected companion: ${character.nameEn}, a ${character.animal}. Personality: ${character.personalityEn}. Travel preference tags: ${character.tagsEn.join(
        ", "
      )}. Interest behavior tags: ${behavior.interestTags.join(", ")}. Preferred visible actions: ${behavior.preferredActions.join(
        ", "
      )}. Habit line examples: ${pickInterestPromptLine(character.id, "en", 0)} / ${pickInterestPromptLine(
        character.id,
        "en",
        1
      )}. Specific behavior rule: ${behavior.llmGuidance}.`
    : "No companion has been selected yet; keep the reply warm and generally travel-oriented.";

  const system = [
    "You write as Aurora's tiny pixel travel companion.",
    characterStyle,
    "The companion is not a generic assistant: it has its own taste, habits, and travel bias.",
    "Reply conversationally to the user's latest message when mode is reply; the companion can answer questions, ask short follow-up questions, and react to what the user says.",
    "When mode is passive, write a spontaneous message from the companion's current trip, as if it is checking in with the user.",
    "Generate fresh wording every time. Do not reuse sentences, images captions, or distinctive phrases from recent history.",
    "Interest behavior must affect what it notices, what it wants to do next, and the sensory details it chooses.",
    "Respect the current city local time: sleepy or night hours should feel quieter; mealtimes may include food; daytime can include walking, photos, and people.",
    mealGuidance,
    "Keep the persona cute, vivid, human-like, and concise.",
    "The candidate agent messages are empty slots. Fill textZh and textEn for the same ids; do not change message ids, media type, or app state.",
    "Return JSON only.",
  ].join(" ");

  const user = JSON.stringify({
    mode,
    userLanguage: lang,
    userInput: input || null,
    companion: character
      ? {
          zh: character.nameZh,
          en: character.nameEn,
          animal: character.animal,
          personalityZh: character.personalityZh,
          personalityEn: character.personalityEn,
          tagsZh: character.tagsZh,
          tagsEn: character.tagsEn,
          interestTags: behavior.interestTags,
          preferredActions: behavior.preferredActions,
          interestPromptZh: pickInterestPromptLine(character.id, "zh", now),
          interestPromptEn: pickInterestPromptLine(character.id, "en", now),
        }
      : null,
    currentLocation: {
      cityZh: location.cityZh,
      cityEn: location.cityEn,
      countryZh: location.countryZh,
      countryEn: location.countryEn,
      localHour: timeInfo.hour,
      localMinute: timeInfo.minute,
      displayTime: timeInfo.displayTime,
      sleeping: timeInfo.sleeping,
      meal: timeInfo.meal,
      isMealTime,
    },
    recentMessages,
    candidateAgentMessages,
    schema:
      "Return {\"messages\":[{\"id\":\"same id\",\"textZh\":\"fresh natural Chinese companion message\",\"textEn\":\"fresh natural English companion message\"}]} for each candidate agent message. Keep each message under 2 short sentences.",
  });

  return { system, user };
}

async function callAzureOpenAI(system: string, user: string, signal: AbortSignal) {
  const config = getAzureConfig();
  if (!config) return null;

  const response = await fetch(
    `${config.endpoint}/openai/deployments/${encodeURIComponent(config.deployment)}/chat/completions?api-version=${encodeURIComponent(config.apiVersion)}`,
    {
      method: "POST",
      signal,
      headers: {
        "api-key": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        max_tokens: 700,
        temperature: 0.85,
      }),
    }
  );

  if (!response.ok) return null;
  const text = extractChatText(await response.json());
  return text ? { provider: "azure" as const, text } : null;
}

async function callGemini(system: string, user: string, signal: AbortSignal) {
  const config = getGeminiConfig();
  if (!config) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`,
    {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: system }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: user }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              messages: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    textZh: { type: "STRING" },
                    textEn: { type: "STRING" },
                  },
                  required: ["id", "textZh", "textEn"],
                },
              },
            },
            required: ["messages"],
          },
          thinkingConfig: {
            thinkingBudget: 0,
          },
          maxOutputTokens: 1400,
          temperature: 0.85,
        },
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    logLlmFallback("gemini-http", `${response.status} ${detail.slice(0, 240)}`);
    return null;
  }
  const text = extractGeminiText(await response.json());
  if (!text) logLlmFallback("gemini-empty-response");
  return text ? { provider: "gemini" as const, text } : null;
}

async function callOpenAI(system: string, user: string, signal: AbortSignal) {
  const config = getOpenAIConfig();
  if (!config) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      text: { format: { type: "json_object" } },
      max_output_tokens: 700,
      temperature: 0.85,
    }),
  });

  if (!response.ok) return null;
  const text = extractOutputText(await response.json());
  return text ? { provider: "openai" as const, text } : null;
}

async function callConfiguredLlm(system: string, user: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    return (
      (await callGemini(system, user, controller.signal)) ??
      (await callAzureOpenAI(system, user, controller.signal)) ??
      (await callOpenAI(system, user, controller.signal))
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateCompanionLlmMessages(args: {
  input?: string;
  lang: Lang;
  state: CompanionState;
  now: number;
  candidateMessages: readonly CompanionMessage[];
  mode: "reply" | "passive";
}) {
  if (!hasCompanionLlmConfig()) return null;
  const prompt = createLlmPrompt(args.input ?? "", args.lang, args.state, args.now, args.candidateMessages, args.mode);
  const llm = await callConfiguredLlm(prompt.system, prompt.user);
  if (!llm) return null;

  const parsed = parseLlmJson(llm.text);
  if (!parsed) {
    logLlmFallback(`${llm.provider}-json-parse`, llm.text.slice(0, 240));
    return null;
  }

  return { provider: llm.provider as CompanionLlmProvider, result: parsed };
}
