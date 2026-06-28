"use client";

import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  onOpenPlanner: () => void;
  onToggleLanguage: () => void;
}

export default function TopBar({ lang, onOpenPlanner, onToggleLanguage }: Props) {
  return (
    <header className="sticky top-0 z-30 glass border-b hairline">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-aurora-500 to-aurora-800 grid place-items-center text-white text-xs font-semibold">
            A
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight">Aurora</div>
            <div className="text-[10.5px] text-ink-500 -mt-0.5 tracking-wide truncate">
              {lang === "zh" ? "按时机规划旅行，而不是靠运气。" : "Travel by timing, not by luck."}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLanguage}
            className="px-3 py-1.5 rounded-full border hairline bg-white text-xs font-medium text-ink-700 hover:bg-ink-50 transition"
          >
            {lang === "zh" ? "EN" : "中文"}
          </button>
          <button
            onClick={onOpenPlanner}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border hairline bg-white text-xs font-medium text-ink-700 hover:bg-ink-50 transition"
          >
            <span className="text-sm leading-none">💬</span>
            {lang === "zh" ? "Chat to refine" : "Chat to refine"}
          </button>
        </div>
      </div>
    </header>
  );
}
