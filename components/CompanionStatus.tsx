"use client";

import { getCharacter, getCurrentLocation, getStatusLine, type CompanionState } from "@/lib/companion";
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
  const initial = copy(lang, character.nameZh, character.nameEn).slice(0, 1);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border hairline bg-white px-4 py-3 text-left shadow-[0_1px_2px_rgba(20,30,50,0.04)] transition hover:border-aurora-200 hover:bg-aurora-50/40"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-aurora-50 to-ink-100">
        <span className="absolute inset-0 grid place-items-center text-[13px] font-semibold text-aurora-800">
          {initial}
        </span>
        <img
          src={character.imageSrc}
          alt={copy(lang, character.nameZh, character.nameEn)}
          className="relative z-10 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-aurora-700">
          <span>{copy(lang, "旅伴近况", "Companion update")}</span>
          <span className="h-1 w-1 rounded-full bg-aurora-300" />
          <span>{lang === "zh" ? location.cityZh : location.cityEn}</span>
        </div>
        <div className="mt-1 text-[13px] leading-relaxed text-ink-700">{getStatusLine(state, lang)}</div>
      </div>
      <div className="hidden rounded-full bg-ink-900 px-3 py-1.5 text-[11px] font-medium text-white sm:block">
        {copy(lang, "聊天", "Chat")}
      </div>
    </button>
  );
}
