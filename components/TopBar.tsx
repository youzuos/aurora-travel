"use client";

import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  onOpenPlanner: () => void;
  onToggleLanguage: () => void;
  onOpenCompanion: () => void;
}

export default function TopBar({ lang, onOpenPlanner, onToggleLanguage, onOpenCompanion }: Props) {
  return (
    <header className="sticky top-0 z-30 glass border-b hairline">
      <div className="mx-auto max-w-[1240px] px-5 py-4 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-aurora-500 to-aurora-800 text-xs font-semibold text-white">
              A
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">Aurora</div>
              <div className="truncate text-[10.5px] -mt-0.5 tracking-wide text-ink-500">
                Travel by timing, not by luck.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={onOpenCompanion}
              className="inline-flex items-center gap-1.5 rounded-full border hairline bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-50"
              title={lang === "zh" ? "打开小动物设置和聊天" : "Open pet companion settings and chat"}
            >
              <span className="text-sm leading-none" aria-hidden="true">
                🐾
              </span>
              <span>{lang === "zh" ? "小动物" : "Pet"}</span>
            </button>
            <button
              onClick={onToggleLanguage}
              className="rounded-full border hairline bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-50"
            >
              {lang === "zh" ? "EN" : "ZH"}
            </button>
            <button
              onClick={onOpenPlanner}
              className="hidden items-center gap-2 rounded-full border hairline bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-50 sm:inline-flex"
            >
              <span className="text-sm leading-none">+</span>
              Chat
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
