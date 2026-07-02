import { NextResponse } from "next/server";
import {
  appendCompanionMessages,
  createAgentMessage,
  createDefaultCompanionState,
  createUserMessage,
  detectCompanionIntent,
  findCompanionLocationFromInput,
  getCompanionPhotoContext,
  getCompanionVisualActionForIntent,
  getCurrentLocation,
  pickCompanionPhoto,
  type CompanionMessage,
  type CompanionState,
} from "../../../../lib/companion";
import {
  applyLlmMessages as applySharedLlmMessages,
  generateCompanionLlmMessages,
  hasCompanionLlmConfig,
} from "../../../../lib/companionLlm";
import type { Lang } from "../../../../lib/types";

export const runtime = "nodejs";

function isLang(value: unknown): value is Lang {
  return value === "zh" || value === "en";
}

function hasAgentText(messages: readonly CompanionMessage[]) {
  return messages.some((message) => message.sender === "agent" && (message.textZh.trim() || message.textEn.trim()));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const input =
    typeof body.input === "string" ? body.input : typeof body.message === "string" ? body.message : "";
  const lang = isLang(body.lang) ? body.lang : "zh";
  const now = typeof body.now === "number" ? body.now : Date.now();
  const state =
    body.state && typeof body.state === "object"
      ? (body.state as CompanionState)
      : createDefaultCompanionState(now);

  const userMessage = createUserMessage(input, now);
  const intent = detectCompanionIntent(input);
  const target = intent === "move" ? findCompanionLocationFromInput(input) : null;
  const plannedState: CompanionState = {
    ...state,
    currentLocationId: target?.id ?? state.currentLocationId,
    lastMovedAt: target ? now : state.lastMovedAt,
    lastActiveAt: now,
    statusCursor: state.statusCursor + 1,
    unreadCount: 0,
    visualAction: getCompanionVisualActionForIntent(intent, state, now),
  };
  const location = getCurrentLocation(plannedState);
  const photo =
    intent === "photo"
      ? pickCompanionPhoto(
          location,
          state.messageHistory,
          now + state.statusCursor,
          `${input} ${getCompanionPhotoContext(plannedState, now)}`
        )
      : null;
  const agentMessage = createAgentMessage(
    intent === "photo" ? "image" : intent === "scenery" ? "voice" : intent === "food" ? "mixed" : "text",
    "",
    "",
    now + 450,
    {
      ...(intent === "scenery" ? { voiceDurationSec: 8 } : {}),
      ...(photo
        ? {
	            image: {
	              src: photo.src,
	              alt: photo.alt,
	              credit: photo.credit,
	              theme: photo.theme,
	              query: photo.query,
	              captionZh: "",
	              captionEn: "",
	            },
          }
        : {}),
    }
  );
  const candidateMessages = [userMessage, agentMessage];
  const plannedStateWithSlots: CompanionState = {
    ...plannedState,
    messageHistory: appendCompanionMessages(state.messageHistory, candidateMessages),
  };

  if (!hasCompanionLlmConfig()) {
    return NextResponse.json(
      {
        error: "llm_unconfigured",
        state: {
          ...plannedState,
          messageHistory: appendCompanionMessages(state.messageHistory, [userMessage]),
        },
        messages: [userMessage],
      }
    );
  }

  try {
    const llm = await generateCompanionLlmMessages({
      input,
      lang,
      state: plannedStateWithSlots,
      now,
      candidateMessages,
      mode: "reply",
    });
    if (!llm) {
      return NextResponse.json(
        {
          error: "llm_failed",
          state: {
            ...plannedState,
            messageHistory: appendCompanionMessages(state.messageHistory, [userMessage]),
          },
          messages: [userMessage],
        }
      );
    }

    const enhanced = applySharedLlmMessages(plannedStateWithSlots, candidateMessages, llm.result);
    if (!hasAgentText(enhanced.messages)) {
      return NextResponse.json(
        {
          error: "llm_empty",
          state: {
            ...plannedState,
            messageHistory: appendCompanionMessages(state.messageHistory, [userMessage]),
          },
          messages: [userMessage],
        }
      );
    }
    return NextResponse.json({ ...enhanced, generatedBy: llm.provider });
  } catch {
    return NextResponse.json(
      {
        error: "llm_failed",
        state: {
          ...plannedState,
          messageHistory: appendCompanionMessages(state.messageHistory, [userMessage]),
        },
        messages: [userMessage],
      }
    );
  }
}
