"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import PixelCompanion, { type PixelCompanionInteraction } from "@/components/PixelSpriteCompanion";
import type { CompanionAction, CompanionCharacter } from "@/lib/companion";
import {
  resolveCompanionTouchReaction,
  type CompanionInteractionContext,
  type CompanionTouchReaction,
  type CompanionTouchZone,
} from "@/lib/companionInteraction";
import type { Lang } from "@/lib/types";

interface Props {
  character: CompanionCharacter;
  action: CompanionAction;
  label: string;
  lang: Lang;
  size?: "sm" | "md" | "lg";
  context?: CompanionInteractionContext;
}

const HOVER_TEXT: { zh: string[]; en: string[] } = {
  hover: {
    zh: ["我在这里", "要出发吗"],
    en: ["I'm here", "Shall we go?"],
  },
}.hover;

const TOUCH_ZONES: Array<{
  zone: CompanionTouchZone;
  labelZh: string;
  labelEn: string;
  className: string;
  style: CSSProperties;
}> = [
  {
    zone: "hand",
    labelZh: "向小动物挥手",
    labelEn: "Wave to the companion",
    className: "z-10 rounded-[45%]",
    style: { left: "29%", top: "33%", width: "36%", height: "40%" },
  },
  {
    zone: "backpack",
    labelZh: "看看小动物的背包",
    labelEn: "Check the companion backpack",
    className: "z-20 rounded-[35%]",
    style: { left: "5%", top: "45%", width: "26%", height: "27%" },
  },
  {
    zone: "camera",
    labelZh: "点点小动物的相机",
    labelEn: "Tap the companion camera",
    className: "z-30 rounded-[30%]",
    style: { right: "5%", top: "31%", width: "38%", height: "33%" },
  },
  {
    zone: "head",
    labelZh: "摸摸小动物的头",
    labelEn: "Pat the companion head",
    className: "z-40 rounded-[45%]",
    style: { left: "28%", top: "3%", width: "44%", height: "31%" },
  },
];

function pickHoverText(lang: Lang, seed: number) {
  const list = HOVER_TEXT[lang];
  return list[Math.abs(seed) % list.length];
}

function hoverReaction(action: CompanionAction, lang: Lang, seed: number): CompanionTouchReaction {
  return {
    zone: "hand",
    interaction: "hover",
    action: action === "sleepy" ? "sleepy" : "walking",
    text: pickHoverText(lang, seed),
    durationMs: 760,
  };
}

export default function InteractiveCompanion({ character, action, label, lang, size = "lg", context }: Props) {
  const [reaction, setReaction] = useState<CompanionTouchReaction | undefined>();
  const resetTimerRef = useRef<number | null>(null);
  const sequenceRef = useRef(0);
  const displayAction = reaction?.action ?? action;
  const interaction = reaction?.interaction as PixelCompanionInteraction | undefined;

  function clearResetTimer() {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }

  function showReaction(nextReaction: CompanionTouchReaction) {
    setReaction(nextReaction);
    clearResetTimer();
    resetTimerRef.current = window.setTimeout(() => {
      setReaction(undefined);
      resetTimerRef.current = null;
    }, nextReaction.durationMs);
  }

  function showZoneReaction(zone: CompanionTouchZone) {
    sequenceRef.current += 1;
    showReaction(
      resolveCompanionTouchReaction(
        zone,
        lang,
        {
          ...context,
          currentAction: context?.currentAction ?? action,
        },
        sequenceRef.current
      )
    );
  }

  function showHoverReaction() {
    if (reaction) return;
    sequenceRef.current += 1;
    showReaction(hoverReaction(action, lang, sequenceRef.current));
  }

  useEffect(() => {
    return () => {
      clearResetTimer();
    };
  }, []);

  return (
    <div
      className="group relative h-full w-full touch-manipulation outline-none"
      role="group"
      aria-label={lang === "zh" ? `${label}，可以摸头、点相机、看背包或挥手互动` : `${label}, interact by patting, tapping the camera, checking the bag, or waving`}
      onPointerEnter={showHoverReaction}
    >
      {reaction ? (
        <span className="pointer-events-none absolute -top-4 left-1/2 z-50 max-w-[180px] -translate-x-1/2 rounded-2xl border border-white/90 bg-white/95 px-3 py-1.5 text-[12px] font-semibold leading-tight text-ink-800 shadow-[0_10px_26px_rgba(18,29,42,0.16)] ring-1 ring-ink-900/5">
          {reaction.text}
        </span>
      ) : null}
      <span className="pointer-events-none absolute inset-x-[24%] bottom-0 h-3 rounded-[50%] bg-ink-900/10 opacity-0 blur-md transition group-hover:opacity-100" />
      <PixelCompanion character={character} action={displayAction} label={label} size={size} animated interaction={interaction} />
      {TOUCH_ZONES.map((zone) => (
        <button
          key={zone.zone}
          type="button"
          aria-label={lang === "zh" ? zone.labelZh : zone.labelEn}
          className={`absolute bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-aurora-900/20 ${zone.className}`}
          style={zone.style}
          onPointerDown={() => showZoneReaction(zone.zone)}
          onClick={(event) => {
            if (event.detail === 0) showZoneReaction(zone.zone);
          }}
        />
      ))}
    </div>
  );
}
