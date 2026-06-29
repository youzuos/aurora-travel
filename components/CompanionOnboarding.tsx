"use client";

import { COMPANION_CHARACTERS } from "@/data/companion";
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

function characterInitial(lang: Lang, nameZh: string, nameEn: string) {
  return copy(lang, nameZh, nameEn).slice(0, 1);
}

export default function CompanionOnboarding({ lang, state, onSelect }: Props) {
  if (state.onboardingCompleted) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/92 px-4 backdrop-blur-md">
      <div className="w-full max-w-5xl rounded-2xl border hairline bg-white p-5 shadow-2xl sm:p-7">
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

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COMPANION_CHARACTERS.map((character) => (
            <button
              key={character.id}
              type="button"
              onClick={() => onSelect(character.id)}
              className="group rounded-xl border hairline bg-white p-3 text-left transition hover:border-aurora-300 hover:bg-aurora-50/50"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-aurora-50 to-ink-100">
                <span className="absolute inset-0 z-0 grid place-items-center text-[18px] font-semibold text-aurora-800">
                  {characterInitial(lang, character.nameZh, character.nameEn)}
                </span>
                <img
                  src={character.imageSrc}
                  alt={copy(lang, character.nameZh, character.nameEn)}
                  className="relative z-10 h-full w-full object-cover transition group-hover:scale-[1.03]"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="mt-3 text-[15px] font-semibold text-ink-900">
                {copy(lang, character.nameZh, character.nameEn)}
              </div>
              <div className="mt-1 min-h-[38px] text-[12px] leading-relaxed text-ink-600">
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

        <div className="mt-5 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 p-4">
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
