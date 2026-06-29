"use client";

import { useEffect, useRef, useState } from "react";
import {
  COMPANION_TIMING,
  addPassiveCompanionMessage,
  getCharacter,
  getCurrentLocation,
  type CompanionMessage,
  type CompanionState,
} from "@/lib/companion";
import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  state: CompanionState;
  chatOpen: boolean;
  onOpen: () => void;
  onStateChange: (state: CompanionState) => void;
}

export default function CompanionBubble({ lang, state, chatOpen, onOpen, onStateChange }: Props) {
  const [bubble, setBubble] = useState<CompanionMessage | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const character = state.selectedCharacterId ? getCharacter(state.selectedCharacterId) : null;
  const location = getCurrentLocation(state);

  useEffect(() => {
    if (!state.onboardingCompleted || chatOpen) return;

    const intervalMs = state.testMode ? COMPANION_TIMING.testBubbleMs : COMPANION_TIMING.productionBubbleMs;
    const timer = window.setInterval(() => {
      const result = addPassiveCompanionMessage(state, lang);
      setBubble(result.message);
      onStateChange(result.state);

      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = window.setTimeout(() => {
        setBubble(null);
        hideTimerRef.current = null;
      }, 7000);
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [chatOpen, lang, onStateChange, state]);

  if (!state.onboardingCompleted || !character) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex max-w-[calc(100vw-2.5rem)] flex-col items-end gap-2">
      {bubble ? (
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
        <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-ink-50">
          <img
            src={character.imageSrc}
            alt={lang === "zh" ? character.nameZh : character.nameEn}
            className="h-full w-full object-cover"
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
