"use client";

import { PEAK_LOCK_T14, PRICE_ALERT_T60 } from "@/data/agentScripts";
import type { WarpStop } from "@/lib/time";

interface Props {
  warp: WarpStop;
}

export default function PriceAlert({ warp }: Props) {
  if (warp !== "t-60" && warp !== "t-14") return null;
  const msg =
    warp === "t-60" ? PRICE_ALERT_T60.message : PEAK_LOCK_T14.message;
  const emoji = warp === "t-60" ? "💰" : "🌸";
  const label =
    warp === "t-60" ? "价格 Agent · 主动提醒" : "时机 Agent · 峰值锁定";
  const tint =
    warp === "t-60"
      ? "from-emerald-50 to-white border-emerald-200 text-emerald-900"
      : "from-rose-50 to-white border-rose-200 text-rose-900";

  return (
    <div
      key={warp}
      className={`rounded-2xl border-2 bg-gradient-to-br ${tint} px-5 py-4 shadow-sm animate-slide-up flex items-start gap-3`}
    >
      <div className="text-2xl leading-none">{emoji}</div>
      <div className="flex-1">
        <div className="text-[10.5px] uppercase tracking-[0.16em] font-semibold opacity-80">
          {label}
        </div>
        <div className="text-[13px] mt-1 leading-relaxed">{msg}</div>
      </div>
      <span className="px-2.5 py-1 rounded-full bg-white border hairline text-[10.5px] text-ink-700">
        T-{warp === "t-60" ? "60" : "14"}
      </span>
    </div>
  );
}
