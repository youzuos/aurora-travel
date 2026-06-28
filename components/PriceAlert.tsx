"use client";

import type { Lang } from "@/lib/types";
import type { WarpStop } from "@/lib/time";

interface Props {
  lang: Lang;
  warp: WarpStop;
  hasPlan: boolean;
}

const ALERTS: {
  id: string;
  emoji: string;
  badge: string;
  zhTitle: string;
  enTitle: string;
  zhText: string;
  enText: string;
  activeWarps: WarpStop[];
  tint: string;
}[] = [
  {
    id: "peak-lock",
    emoji: "🌸",
    badge: "T-14",
    zhTitle: "时机 Agent · 峰值锁定",
    enTitle: "Timing agent · peak locked",
    zhText: "京都花期模型收敛：满开窗口锁定 2026-04-02 ~ 04-05，扑空率降至 5%。",
    enText: "Kyoto bloom model narrowed: peak window locks to Apr 2-5, 2026, with miss risk down to 5%.",
    activeWarps: ["t-14"],
    tint: "border-rose-200 bg-rose-50/70",
  },
  {
    id: "fare-window",
    emoji: "💰",
    badge: "T-45",
    zhTitle: "价格 Agent · 抢票窗口",
    enTitle: "Price agent · fare window",
    zhText: "京都机票降至 ¥3,180，接近 3 年最低点，建议进入下单观察期。",
    enText: "Kyoto fares dropped to ¥3,180, near the 3-year low. Start booking watch now.",
    activeWarps: ["t-30", "t-14"],
    tint: "border-emerald-200 bg-emerald-50/70",
  },
  {
    id: "waiting-data",
    emoji: "🌌",
    badge: "T-180",
    zhTitle: "时机 Agent · 等待数据",
    enTitle: "Timing agent · waiting for signal",
    zhText: "漠河极光预测窗口将在 9 月开始收敛，当前只保留远期概率区间。",
    enText: "Mohe aurora forecast will start narrowing in September; keep a broad range for now.",
    activeWarps: ["year-start", "t-90"],
    tint: "border-aurora-200 bg-aurora-50/70",
  },
];

export default function PriceAlert({ lang, warp, hasPlan }: Props) {
  if (!hasPlan) return null;

  return (
    <section className="rounded-2xl border hairline bg-white p-4 shadow-[0_1px_2px_rgba(20,30,50,0.04)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.16em] text-ink-500 font-medium">
          {lang === "zh" ? "Agent 正在持续看守" : "Agents watching in the background"}
        </div>
        <div className="text-[11px] text-ink-400">
          {lang === "zh" ? "横向滑动查看更多" : "Scroll for more"}
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ALERTS.map((alert) => {
          const active = alert.activeWarps.includes(warp);
          return (
            <article
              key={alert.id}
              className={`min-w-[280px] flex-1 rounded-xl border px-4 py-3 transition ${
                alert.tint
              } ${active ? "opacity-100 shadow-sm" : "opacity-55"}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl leading-none">{alert.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate text-[12px] font-semibold text-ink-900">
                      {lang === "zh" ? alert.zhTitle : alert.enTitle}
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-ink-600 border hairline">
                      {alert.badge}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ink-700">
                    {lang === "zh" ? alert.zhText : alert.enText}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
