"use client";

import { useEffect, useRef, useState } from "react";
import PixelCompanion from "@/components/PixelSpriteCompanion";
import {
  COMPANION_TIMING,
  getCharacter,
  getCompanionAction,
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
  onOpenPlan: () => void;
  planStatus: string;
  planCount: number;
  onStateChange: (update: CompanionState | ((state: CompanionState) => CompanionState)) => void;
}

function NotebookIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 4.5h10a2.5 2.5 0 0 1 2.5 2.5v12.5H7A2.5 2.5 0 0 1 4.5 17V7A2.5 2.5 0 0 1 7 4.5Z" />
      <path d="M8 4.5v15M11 8h5M11 11.5h4" strokeLinecap="round" />
    </svg>
  );
}

export default function CompanionBubble({
  lang,
  state,
  chatOpen,
  onOpen,
  onOpenPlan,
  planStatus,
  planCount,
  onStateChange,
}: Props) {
  const [bubble, setBubble] = useState<CompanionMessage | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  const chatOpenRef = useRef(chatOpen);
  const passiveRequestInFlightRef = useRef(false);
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
    let cancelled = false;

    function publishResult(result: { state: CompanionState; message: CompanionMessage | null }) {
      if (cancelled) return;
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
    }

    async function tick() {
      if (passiveRequestInFlightRef.current) return;
      const now = Date.now();
      const currentState = stateRef.current;
      const incrementUnread = !chatOpenRef.current;

      passiveRequestInFlightRef.current = true;
      try {
        const response = await fetch("/api/companion/passive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: currentState, lang, now, incrementUnread }),
        });
        const result = (await response.json()) as {
          error?: string;
          state?: CompanionState;
          message?: CompanionMessage | null;
        };
        if (!response.ok) {
          if (result.state) publishResult({ state: result.state, message: null });
          return;
        }
        if (result.error) {
          if (result.state) publishResult({ state: result.state, message: null });
          return;
        }
        if (!result.state || !result.message) throw new Error("Invalid companion passive message");

        publishResult({ state: result.state, message: result.message });
      } catch {
        // No local template fallback: companion speech is generated only by the LLM.
      } finally {
        passiveRequestInFlightRef.current = false;
      }
    }

    const timer = window.setInterval(() => {
      void tick();
    }, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      clearBubbleTimer();
    };
  }, [lang, onStateChange, state.onboardingCompleted, state.testMode]);

  if (!state.onboardingCompleted || !character) return null;

  return (
    <div className="!fixed bottom-5 right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 sm:bottom-8 sm:right-8">
      {!chatOpen && bubble ? (
        <button
          type="button"
          onClick={onOpen}
          className="max-w-[280px] rounded-2xl border border-white/90 bg-white/95 px-4 py-3 text-left text-[12.5px] leading-relaxed text-ink-800 shadow-[0_16px_45px_rgba(18,29,42,0.18)] backdrop-blur-xl"
        >
          {lang === "zh" ? bubble.textZh : bubble.textEn}
        </button>
      ) : null}

      <div className="rounded-[28px] border border-white/85 bg-white/90 p-2 shadow-[0_18px_50px_rgba(18,29,42,0.24)] ring-1 ring-ink-900/5 backdrop-blur-xl">
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="flex min-h-[76px] w-[176px] items-center gap-3 rounded-[22px] bg-white px-3 py-2 text-left shadow-[inset_0_0_0_1px_rgba(28,31,38,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(18,29,42,0.12)]"
          >
            <div className="relative h-14 w-14 shrink-0">
              <PixelCompanion
                character={character}
                action={action}
                label={lang === "zh" ? character.nameZh : character.nameEn}
                size="md"
              />
              <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
              {state.unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-aurora-700 px-1 text-[10px] font-semibold text-white">
                  {state.unreadCount}
                </span>
              ) : null}
            </div>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-semibold text-ink-900">
                {lang === "zh" ? character.nameZh : character.nameEn}
              </span>
              <span className="mt-0.5 block truncate text-[11px] font-medium text-ink-500">
                {lang === "zh" ? location.cityZh : location.cityEn}
              </span>
              <span className="mt-1 block truncate text-[11px] text-aurora-800">
                {lang === "zh" ? "打开聊天" : "Open chat"}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenPlan}
            aria-label={lang === "zh" ? `打开年度计划，${planStatus}` : `Open annual plan, ${planStatus}`}
            className="group relative flex min-h-[76px] w-[58px] flex-col items-center justify-center overflow-hidden rounded-[22px] border border-amber-200/70 bg-[#fff6df] text-ink-900 shadow-[inset_0_0_0_1px_rgba(124,82,55,0.08),0_10px_24px_rgba(124,82,55,0.12)] transition hover:-translate-y-0.5 hover:bg-white"
          >
            <span className="absolute left-0 top-4 h-9 w-1.5 rounded-r-full bg-amber-300/80" />
            <span className="relative grid h-9 w-9 place-items-center rounded-2xl bg-white text-ink-800 shadow-sm ring-1 ring-ink-900/5 transition group-hover:scale-105">
              <NotebookIcon className="h-[18px] w-[18px]" />
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-aurora-700 px-1 text-[10px] font-semibold text-white shadow-sm">
                {planCount > 0 ? planCount : "+"}
              </span>
            </span>
            <span className="mt-2 text-[12px] font-semibold leading-none">{lang === "zh" ? "计划" : "Plan"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
