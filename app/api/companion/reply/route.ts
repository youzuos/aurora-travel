import { NextResponse } from "next/server";
import {
  createDefaultCompanionState,
  generateCompanionReply,
  getCharacter,
  getCompanionLocalTimeInfo,
  getCurrentLocation,
  type CompanionMessage,
  type CompanionState,
} from "@/lib/companion";
import type { Lang } from "@/lib/types";

export const runtime = "nodejs";

type CompanionReplyResult = {
  messages?: Array<{
    id?: string;
    textZh?: string;
    textEn?: string;
  }>;
};

type LlmProvider = "azure" | "openai";

function isLang(value: unknown): value is Lang {
  return value === "zh" || value === "en";
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

function applyLlmMessages(
  plannedState: CompanionState,
  plannedMessages: readonly CompanionMessage[],
  result: CompanionReplyResult
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

function createLlmPrompt(input: string, lang: Lang, state: CompanionState, now: number) {
  const location = getCurrentLocation(state);
  const character = state.selectedCharacterId ? getCharacter(state.selectedCharacterId) : null;
  const timeInfo = getCompanionLocalTimeInfo(state, now);
  const agentMessages = state.messageHistory.filter((message) => message.sender === "agent").slice(-3);

  const system =
    "You write as Aurora's tiny pixel travel companion. Keep the persona cute, vivid, human-like, and concise. Do not change destination, message ids, media type, or app state. Return JSON only.";

  const user = JSON.stringify({
    userLanguage: lang,
    userInput: input,
    companion: character
      ? {
          zh: character.nameZh,
          en: character.nameEn,
          animal: character.animal,
        }
      : null,
    currentLocation: {
      cityZh: location.cityZh,
      cityEn: location.cityEn,
      countryZh: location.countryZh,
      countryEn: location.countryEn,
      localHour: timeInfo.hour,
      sleeping: timeInfo.sleeping,
      meal: timeInfo.meal,
    },
    candidateAgentMessages: agentMessages.map((message) => ({
      id: message.id,
      kind: message.kind,
      textZh: message.textZh,
      textEn: message.textEn,
    })),
    schema:
      "Return {\"messages\":[{\"id\":\"same id\",\"textZh\":\"natural Chinese reply\",\"textEn\":\"natural English reply\"}]} for each candidate agent message. Keep each reply under 2 short sentences.",
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
        temperature: 0.75,
      }),
    }
  );

  if (!response.ok) return null;
  const text = extractChatText(await response.json());
  return text ? { provider: "azure" as const, text } : null;
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
    }),
  });

  if (!response.ok) return null;
  const text = extractOutputText(await response.json());
  return text ? { provider: "openai" as const, text } : null;
}

async function callConfiguredLlm(system: string, user: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    return (await callAzureOpenAI(system, user, controller.signal)) ?? (await callOpenAI(system, user, controller.signal));
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const input = typeof body.input === "string" ? body.input : "";
  const lang = isLang(body.lang) ? body.lang : "zh";
  const now = typeof body.now === "number" ? body.now : Date.now();
  const state =
    body.state && typeof body.state === "object"
      ? (body.state as CompanionState)
      : createDefaultCompanionState(now);

  const fallback = generateCompanionReply(input, state, lang, now);

  if (!getAzureConfig() && !getOpenAIConfig()) {
    return NextResponse.json({ ...fallback, generatedBy: "local" });
  }

  try {
    const prompt = createLlmPrompt(input, lang, fallback.state, now);
    const llm = await callConfiguredLlm(prompt.system, prompt.user);
    if (!llm) {
      return NextResponse.json({ ...fallback, generatedBy: "local" });
    }

    const parsed = JSON.parse(llm.text) as CompanionReplyResult;
    const enhanced = applyLlmMessages(fallback.state, fallback.messages, parsed);
    return NextResponse.json({ ...enhanced, generatedBy: llm.provider satisfies LlmProvider });
  } catch {
    return NextResponse.json({ ...fallback, generatedBy: "local" });
  }
}
