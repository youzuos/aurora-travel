"use client";

import { useEffect, useRef, useState } from "react";
import PixelCompanion from "@/components/PixelSpriteCompanion";
import {
  COMPANION_TIMING,
  addPassiveCompanionMessage,
  getCharacter,
  getCompanionAction,
  getCurrentLocation,
  maybeAdvanceCompanionLocation,
  type CompanionMessage,
  type CompanionState,
} from "@/lib/companion";
import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  state: CompanionState;
  chatOpen: boolean;
  onOpen: () => void;
  onStateChange: (update: CompanionState | ((state: CompanionState) => CompanionState)) => void;
}

export default function CompanionBubble({ lang, state, chatOpen, onOpen, onStateChange }: Props) {
  const [bubble, setBubble] = useState<CompanionMessage | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  const chatOpenRef = useRef(chatOpen);
  const character = state.selectedCharacterId ? getCharacter(state.selectedCharacterId) : null;
  const location = getCurrentLocation(state);
  const action = getCompanionAction(state);

  function clearBubbleTimer() {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
    if (chatOpen) {
      setBubble(null);
      clearBubbleTimer();
    }
  }, [chatOpen]);

  useEffect(() => {
    if (!state.onboardingCompleted) return;

    const intervalMs = state.testMode ? COMPANION_TIMING.testBubbleMs : COMPANION_TIMING.productionBubbleMs;
    const timer = window.setInterval(() => {
      const now = Date.now();
      const currentState = stateRef.current;
      const incrementUnread = !chatOpenRef.current;
      const advancedState = maybeAdvanceCompanionLocation(currentState, now, { incrementUnread });
      const moved = advancedState.currentLocationId !== currentState.currentLocationId;

      const result = moved
        ? {
            state: advancedState,
            message: advancedState.messageHistory[advancedState.messageHistory.length - 1] ?? null,
          }
        : addPassiveCompanionMessage(advancedState, lang, now, { incrementUnread });

      stateRef.current = result.state;
      onStateChange(result.state);

      if (chatOpenRef.current || !result.message) {
        setBubble(null);
        clearBubbleTimer();
        return;
      }

      setBubble(result.message);
      clearBubbleTimer();
      hideTimerRef.current = window.setTimeout(() => {
        setBubble(null);
        hideTimerRef.current = null;
      }, 7000);
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
      clearBubbleTimer();
    };
  }, [lang, onStateChange, state.onboardingCompleted, state.testMode]);

  if (!state.onboardingCompleted || !character) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex max-w-[calc(100vw-2.5rem)] flex-col items-end gap-2">
      {!chatOpen && bubble ? (
        <button
          type="button"
          onClick={onOpen}
          className="max-w-[280px] rounded-2xl border hairline bg-white px-4 py-3 text-left text-[12.5px] leading-relaxed text-ink-700 shadow-xl"
        >
          {lang === "zh" ? bubble.textZh : bubble.textEn}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-3 rounded-2xl border hairline bg-white p-2 pr-3 shadow-xl transition hover:scale-[1.02]"
      >
        <div className="relative h-14 w-14 shrink-0">
          <PixelCompanion
            character={character}
            action={action}
            label={lang === "zh" ? character.nameZh : character.nameEn}
            size="md"
          />
          <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
        </div>
        <div className="hidden min-w-0 text-left sm:block">
          <div className="text-[12px] font-semibold text-ink-900">
            {lang === "zh" ? character.nameZh : character.nameEn}
          </div>
          <div className="truncate text-[11px] text-ink-500">{lang === "zh" ? location.cityZh : location.cityEn}</div>
        </div>
        {state.unreadCount > 0 ? (
          <div className="grid h-5 min-w-5 place-items-center rounded-full bg-aurora-700 px-1.5 text-[10px] font-semibold text-white">
            {state.unreadCount}
          </div>
        ) : null}
      </button>
    </div>
  );
}
