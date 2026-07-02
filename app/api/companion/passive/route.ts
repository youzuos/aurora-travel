import { NextResponse } from "next/server";
import {
  advanceCompanionLocationWithoutMessage,
  appendCompanionMessages,
  createAgentMessage,
  createDefaultCompanionState,
  getCompanionPhotoContext,
  getCompanionVisualActionForIntent,
  getCurrentLocation,
  getPassiveCompanionIntent,
  pickCompanionPhoto,
  type CompanionState,
} from "../../../../lib/companion";
import {
  applyLlmMessages,
  generateCompanionLlmMessages,
  hasCompanionLlmConfig,
} from "../../../../lib/companionLlm";
import type { Lang } from "../../../../lib/types";

export const runtime = "nodejs";

function isLang(value: unknown): value is Lang {
  return value === "zh" || value === "en";
}

function hasAgentText(message: { textZh?: string; textEn?: string } | null | undefined) {
  return Boolean(message && ((message.textZh ?? "").trim() || (message.textEn ?? "").trim()));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const lang = isLang(body.lang) ? body.lang : "zh";
  const now = typeof body.now === "number" ? body.now : Date.now();
  const incrementUnread = typeof body.incrementUnread === "boolean" ? body.incrementUnread : true;
  const state =
    body.state && typeof body.state === "object"
      ? (body.state as CompanionState)
      : createDefaultCompanionState(now);

  const advanced = advanceCompanionLocationWithoutMessage(state, now);
  const activeState = advanced.state;
  const passiveIntent = advanced.moved ? "status" : getPassiveCompanionIntent(activeState, now);
  const location = getCurrentLocation(activeState);
  const photo =
    passiveIntent === "photo"
      ? pickCompanionPhoto(
          location,
          activeState.messageHistory,
          now + activeState.statusCursor,
          getCompanionPhotoContext(activeState, now)
        )
      : null;
  const message = createAgentMessage(
    passiveIntent === "photo" ? "image" : passiveIntent === "scenery" ? "voice" : "text",
    "",
    "",
    now,
    {
      ...(passiveIntent === "scenery" ? { voiceDurationSec: 8 } : {}),
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
  const plannedState: CompanionState = {
    ...activeState,
    lastActiveAt: now,
    statusCursor: activeState.statusCursor + 1,
    unreadCount: incrementUnread ? Math.min(3, activeState.unreadCount + 1) : activeState.unreadCount,
    visualAction: advanced.moved ? "excited" : getCompanionVisualActionForIntent(passiveIntent, activeState, now),
    messageHistory: appendCompanionMessages(activeState.messageHistory, [message]),
  };

  if (!hasCompanionLlmConfig()) {
    return NextResponse.json({ error: "llm_unconfigured", state: activeState, message: null });
  }

  try {
    const llm = await generateCompanionLlmMessages({
      lang,
      state: plannedState,
      now,
      candidateMessages: [message],
      mode: "passive",
    });

    if (!llm) {
      return NextResponse.json({ error: "llm_failed", state: activeState, message: null });
    }

    const enhanced = applyLlmMessages(plannedState, [message], llm.result);
    const enhancedMessage = enhanced.messages[0] ?? message;
    if (!hasAgentText(enhancedMessage)) {
      return NextResponse.json({ error: "llm_empty", state: activeState, message: null });
    }
    return NextResponse.json({
      state: enhanced.state,
      message: enhancedMessage,
      generatedBy: llm.provider,
    });
  } catch {
    return NextResponse.json({ error: "llm_failed", state: activeState, message: null });
  }
}
