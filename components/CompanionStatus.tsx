"use client";

import PixelCompanion from "@/components/PixelSpriteCompanion";
import {
  getCharacter,
  getCompanionAction,
  getCompanionLocalTimeInfo,
  getCurrentLocation,
  getStatusLine,
  type CompanionState,
} from "@/lib/companion";
import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  state: CompanionState;
  onOpen: () => void;
}

function copy(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export default function CompanionStatus({ lang, state, onOpen }: Props) {
  if (!state.onboardingCompleted || !state.selectedCharacterId) return null;

  const character = getCharacter(state.selectedCharacterId);
  const location = getCurrentLocation(state);
  const action = getCompanionAction(state);
  const timeInfo = getCompanionLocalTimeInfo(state);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="travel-ticket-card flex w-full items-center gap-3 rounded-xl px-4 py-3 pl-8 text-left transition hover:border-aurora-200 hover:bg-aurora-50/40"
    >
      <div className="relative h-14 w-14 shrink-0">
        <PixelCompanion
          character={character}
          action={action}
          label={copy(lang, character.nameZh, character.nameEn)}
          size="md"
          animated
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-aurora-700">
          <span>{copy(lang, "旅伴近况", "Companion update")}</span>
          <span className="h-1 w-1 rounded-full bg-aurora-300" />
          <span>{lang === "zh" ? location.countryZh : location.countryEn}</span>
          <span className="h-1 w-1 rounded-full bg-aurora-300" />
          <span>{lang === "zh" ? timeInfo.labelZh : timeInfo.labelEn}</span>
        </div>
        <div className="mt-1 text-[13px] leading-relaxed text-ink-700">{getStatusLine(state, lang)}</div>
      </div>
      <div className="hidden rounded-full bg-ink-900 px-3 py-1.5 text-[11px] font-medium text-white sm:block">
        {copy(lang, "聊天", "Chat")}
      </div>
    </button>
  );
}
