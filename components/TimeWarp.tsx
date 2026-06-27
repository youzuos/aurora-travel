"use client";

import { WARP_STOPS, type WarpStop } from "@/lib/time";

interface Props {
  warp: WarpStop;
  onChange: (w: WarpStop) => void;
}

export default function TimeWarp({ warp, onChange }: Props) {
  const idx = WARP_STOPS.findIndex((s) => s.key === warp);
  const pct = (idx / (WARP_STOPS.length - 1)) * 100;

  return (
    <div className="rounded-2xl border hairline bg-white px-6 py-5 shadow-[0_1px_2px_rgba(20,30,50,0.04)]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500 font-medium">
            Time warp · demo
          </div>
          <div className="text-sm text-ink-800 mt-0.5">
            拖动看「同一份计划」如何随时间收敛置信度
          </div>
        </div>
        <div className="text-[11px] text-ink-500">
          {WARP_STOPS[idx].sub}
        </div>
      </div>

      <div className="relative h-9">
        {/* track */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-ink-100" />
        {/* progress */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-gradient-to-r from-aurora-500 to-aurora-700 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        {/* stops */}
        <div className="absolute inset-0 flex items-center justify-between">
          {WARP_STOPS.map((s, i) => {
            const active = i <= idx;
            return (
              <button
                key={s.key}
                onClick={() => onChange(s.key)}
                className="group flex flex-col items-center -mx-2"
              >
                <span
                  className={`block h-3 w-3 rounded-full border-2 transition-all duration-300 ${
                    active
                      ? "bg-aurora-600 border-aurora-600 scale-110"
                      : "bg-white border-ink-200 group-hover:border-aurora-400"
                  }`}
                />
                <span
                  className={`mt-2 text-[11px] tracking-wide transition-colors ${
                    s.key === warp
                      ? "text-aurora-700 font-semibold"
                      : "text-ink-500 group-hover:text-ink-700"
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
