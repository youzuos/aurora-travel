"use client";

import { aggregateStage } from "@/lib/time";
import type { Maturity, Trip } from "@/lib/types";
import { maturityAt } from "@/lib/time";
import type { WarpStop } from "@/lib/time";

interface Props {
  warp: WarpStop;
  trips: Trip[];
  onOpenChat: () => void;
}

export default function TopBar({ warp, trips, onOpenChat }: Props) {
  const maturities: Maturity[] = trips.map((t) =>
    maturityAt(warp, t.startMonth)
  );
  const stage = aggregateStage(maturities);
  const dot = (active: boolean) =>
    active
      ? "h-1.5 w-6 rounded-full bg-aurora-600 transition-all duration-500"
      : "h-1.5 w-1.5 rounded-full bg-ink-200 transition-all duration-500";

  return (
    <header className="sticky top-0 z-30 glass border-b hairline">
      <div className="mx-auto max-w-[1240px] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-aurora-500 to-aurora-800 grid place-items-center text-white text-xs font-semibold">
            A
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">
              Aurora
            </div>
            <div className="text-[10.5px] text-ink-500 -mt-0.5 tracking-wide">
              Travel by timing, not by luck.
            </div>
          </div>
        </div>

        {/* Growth indicator ●○○ → ○●○ → ○○● */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-50 border hairline">
          <div className={dot(stage === "sketched")} />
          <div className={dot(stage === "refining")} />
          <div className={dot(stage === "ready")} />
          <span className="ml-2 text-[11px] text-ink-600 font-medium tracking-wide uppercase">
            {stage === "sketched"
              ? "Sketched"
              : stage === "refining"
              ? "Refining"
              : "Ready"}
          </span>
        </div>

        <button
          onClick={onOpenChat}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition shadow-sm"
        >
          <span className="text-sm leading-none">✦</span>
          Modify plan
        </button>
      </div>
    </header>
  );
}
