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

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ...fallback, generatedBy: "local" });
  }

  try {
    const location = getCurrentLocation(fallback.state);
    const character = fallback.state.selectedCharacterId ? getCharacter(fallback.state.selectedCharacterId) : null;
    const timeInfo = getCompanionLocalTimeInfo(fallback.state, now);
    const agentMessages = fallback.messages.filter((message) => message.sender === "agent");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You write as Aurora's tiny pixel travel companion. Keep the persona cute, vivid, human-like, and concise. Do not change destination, message ids, media type, or app state. Return JSON only.",
          },
          {
            role: "user",
            content: JSON.stringify({
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
            }),
          },
        ],
        text: { format: { type: "json_object" } },
        max_output_tokens: 700,
      }),
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ ...fallback, generatedBy: "local" });
    }

    const text = extractOutputText(await response.json());
    const parsed = text ? (JSON.parse(text) as CompanionReplyResult) : {};
    const enhanced = applyLlmMessages(fallback.state, fallback.messages, parsed);
    return NextResponse.json({ ...enhanced, generatedBy: "llm" });
  } catch {
    return NextResponse.json({ ...fallback, generatedBy: "local" });
  }
}
