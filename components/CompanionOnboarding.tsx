"use client";

import PixelCompanion from "@/components/PixelSpriteCompanion";
import { COMPANION_CHARACTERS } from "@/data/companion";
import type { CompanionAction } from "@/lib/companion";
import type { CompanionState } from "@/lib/companion";
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
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-white/92 px-4 py-4 backdrop-blur-md sm:items-center sm:py-6">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-5xl overflow-y-auto rounded-2xl border hairline bg-white p-4 shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-aurora-700">
              Travel Companion
            </div>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-ink-900">
              {copy(lang, "选择一个会替你流浪的小旅伴", "Choose a tiny traveler to wander for you")}
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-600">
              {copy(
                lang,
                "它会在城市里遇见人、拍照片、发语音，也会在你指定目的地时立刻出发。",
                "It will meet people, take photos, send voice notes, and leave immediately when you name a destination."
              )}
            </p>
          </div>
          <div className="rounded-full border hairline bg-ink-50 px-3 py-1.5 text-[11px] text-ink-500">
            {copy(lang, "本地保存，可随时修改", "Saved locally, editable anytime")}
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

        <div className="mt-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 p-3 sm:mt-5 sm:p-4">
          <div className="text-[13px] font-semibold text-ink-800">
            {copy(lang, "进阶：上传图片生成专属旅伴", "Advanced: upload an image to inspire a custom companion")}
          </div>
          <p className="mt-1 text-[12px] text-ink-500">
            {copy(
              lang,
              "这条路径会作为 P1 接入真实生成。当前版本先保证现成旅伴稳定可用。",
              "This path is P1 for real generation. This version keeps preset companions stable first."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
