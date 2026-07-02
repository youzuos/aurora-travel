"use client";

import PixelCompanion from "@/components/PixelSpriteCompanion";
import { COMPANION_CHARACTERS } from "@/data/companion";
import type { CompanionAction, CompanionState } from "@/lib/companion";
import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  state: CompanionState;
  onSelect: (characterId: string) => void;
}

function copy(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

const PREVIEW_ACTIONS: readonly CompanionAction[] = ["walking", "photo", "excited", "food", "map", "idle", "sleepy", "photo"];

export default function CompanionOnboarding({ lang, state, onSelect }: Props) {
  if (state.onboardingCompleted) return null;

  return (
    <div className="!fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-white/92 px-4 py-4 backdrop-blur-md sm:items-center sm:py-6">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-5xl overflow-y-auto rounded-2xl border hairline bg-white p-4 shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-aurora-700">
              Travel Companion
            </div>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-ink-900">
              {copy(lang, "\u9009\u62e9\u4e00\u4e2a\u4f1a\u66ff\u4f60\u65c5\u884c\u7684\u5c0f\u65c5\u4f34", "Choose a tiny traveler to wander for you")}
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-600">
              {copy(
                lang,
                "\u5b83\u4f1a\u5728\u57ce\u5e02\u91cc\u9047\u89c1\u4eba\u3001\u62cd\u7167\u7247\u3001\u53d1\u6d88\u606f\uff0c\u4e5f\u4f1a\u5728\u4f60\u6307\u5b9a\u76ee\u7684\u5730\u65f6\u7acb\u523b\u51fa\u53d1\u3002",
                "It will meet people, take photos, send messages, and leave immediately when you name a destination."
              )}
            </p>
          </div>
          <div className="rounded-full border hairline bg-ink-50 px-3 py-1.5 text-[11px] text-ink-500">
            {copy(lang, "\u672c\u5730\u4fdd\u5b58\uff0c\u53ef\u968f\u65f6\u4fee\u6539", "Saved locally, editable anytime")}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 lg:grid-cols-4">
          {COMPANION_CHARACTERS.map((character, index) => (
            <button
              key={character.id}
              type="button"
              onClick={() => onSelect(character.id)}
              className="group rounded-xl border hairline bg-white p-2.5 text-left transition hover:border-aurora-300 hover:bg-aurora-50/50 sm:p-3"
            >
              <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-aurora-50 to-ink-100 sm:aspect-square">
                <PixelCompanion
                  character={character}
                  action={PREVIEW_ACTIONS[index % PREVIEW_ACTIONS.length]}
                  label={copy(lang, character.nameZh, character.nameEn)}
                  size="lg"
                />
              </div>
              <div className="mt-3 text-[15px] font-semibold text-ink-900">
                {copy(lang, character.nameZh, character.nameEn)}
              </div>
              <div className="mt-1 text-[12px] leading-relaxed text-ink-600 sm:min-h-[38px]">
                {copy(lang, character.personalityZh, character.personalityEn)}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(lang === "zh" ? character.tagsZh : character.tagsEn).map((tag) => (
                  <span key={tag} className="rounded-full bg-ink-50 px-2 py-1 text-[10.5px] text-ink-500">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
