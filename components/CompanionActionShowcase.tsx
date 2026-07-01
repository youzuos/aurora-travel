"use client";

import PixelCompanion from "@/components/PixelSpriteCompanion";
import type { CompanionAction, CompanionCharacter } from "@/lib/companion";
import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  character: CompanionCharacter;
  currentAction: CompanionAction;
}

const ACTIONS: Array<{ action: CompanionAction; zh: string; en: string }> = [
  { action: "idle", zh: "待机", en: "Idle" },
  { action: "walking", zh: "旅行", en: "Walking" },
  { action: "map", zh: "地图", en: "Map" },
  { action: "photo", zh: "拍照", en: "Photo" },
  { action: "food", zh: "吃饭", en: "Food" },
  { action: "sleepy", zh: "休息", en: "Sleepy" },
  { action: "excited", zh: "灵感", en: "Excited" },
];

function copy(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export default function CompanionActionShowcase({ lang, character, currentAction }: Props) {
  return (
    <div className="mt-3 rounded-xl border hairline bg-white/75 p-2">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
        {copy(lang, "状态样式预览", "State preview")}
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {ACTIONS.map((item) => {
          const active = item.action === currentAction;
          return (
            <div
              key={item.action}
              className={`grid min-w-0 place-items-center rounded-lg border px-1.5 py-2 text-center ${
                active ? "border-aurora-300 bg-aurora-50" : "border-transparent bg-ink-50/70"
              }`}
            >
              <div className="h-10 w-10">
                <PixelCompanion
                  character={character}
                  action={item.action}
                  label={`${copy(lang, character.nameZh, character.nameEn)} ${copy(lang, item.zh, item.en)}`}
                  size="sm"
                  animated
                />
              </div>
              <div className={`mt-1 text-[10.5px] ${active ? "font-semibold text-aurora-800" : "text-ink-500"}`}>
                {copy(lang, item.zh, item.en)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
