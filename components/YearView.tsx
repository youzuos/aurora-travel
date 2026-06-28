"use client";

import { DESTINATIONS } from "@/data/destinations";
import {
  MONTH_LABELS,
  maturityAt,
  maturityBg,
  maturityLabel,
  type WarpStop,
} from "@/lib/time";
import type { DeferredTrip, Lang, Trip, WishlistItem } from "@/lib/types";

interface Props {
  lang: Lang;
  warp: WarpStop;
  trips: Trip[];
  deferredTrips: DeferredTrip[];
  onSelectTrip: (destinationId: string) => void;
  onOpenPlanner: () => void;
  onStartWithWishlist: (items: WishlistItem[]) => void;
}

const INSPIRATIONS = [
  {
    label: "冰岛极光",
    labelEn: "Iceland aurora",
    emoji: "🌌",
    status: "11 月正爆发",
    statusEn: "November peak signal",
    followers: 142,
    priorityLabel: "必去" as const,
  },
  {
    label: "京都樱花",
    labelEn: "Kyoto blossoms",
    emoji: "🌸",
    status: "距花期 89 天",
    statusEn: "89 days to bloom",
    followers: 387,
    priorityLabel: "想去" as const,
  },
  {
    label: "新疆胡杨",
    labelEn: "Xinjiang poplar",
    emoji: "🍂",
    status: "距黄叶 6 月",
    statusEn: "6 months to golden leaves",
    followers: 56,
    priorityLabel: "想去" as const,
  },
];

function priorityScore(label: WishlistItem["priorityLabel"]): 1 | 2 | 3 {
  if (label === "必去") return 3;
  if (label === "想去") return 2;
  return 1;
}

function makeInspirationItem(label: string, priorityLabel: WishlistItem["priorityLabel"]): WishlistItem {
  return {
    id: `inspiration-${label}`,
    label,
    priorityLabel,
    priorityScore: priorityScore(priorityLabel),
    source: "inspiration",
  };
}

function tripWidthPct(t: Trip) {
  return Math.max(8.5, (t.days / 30.4) * (100 / 12));
}

function tripLeftPct(t: Trip) {
  return ((t.startMonth - 1) / 12) * 100;
}

function maturityBand(maturity: string) {
  if (maturity === "ready") return "bg-aurora-800 text-white";
  if (maturity === "refining") return "bg-aurora-200 text-aurora-950";
  return "bg-aurora-100 text-aurora-900";
}

export default function YearView({
  lang,
  warp,
  trips,
  deferredTrips,
  onSelectTrip,
  onOpenPlanner,
  onStartWithWishlist,
}: Props) {
  if (!trips.length) {
    return (
      <section className="rounded-2xl border hairline bg-white shadow-[0_1px_2px_rgba(20,30,50,0.04)] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-[11px] uppercase tracking-[0.22em] text-ink-500 font-medium">
            Plan once · Refine all year
          </div>
          <h2 className="mt-4 text-[30px] font-semibold tracking-tight text-ink-900">
            {lang === "zh" ? "你的 2026，从一句话开始" : "Your 2026 starts with one sentence"}
          </h2>
          <button
            onClick={onOpenPlanner}
            className="mx-auto mt-7 flex w-full max-w-xl items-center justify-between rounded-2xl border hairline bg-ink-50/70 px-5 py-4 text-left hover:bg-white hover:shadow-sm transition"
          >
            <span>
              <span className="block text-[15px] font-semibold text-ink-900">
                💬 {lang === "zh" ? "告诉我你这辈子想看的风景" : "Tell me what you want to see in this life"}
              </span>
              <span className="mt-1 block text-[12.5px] text-ink-500">
                {lang === "zh" ? "比如：极光、樱花、胡杨..." : "For example: aurora, blossoms, poplar forests..."}
              </span>
            </span>
            <span className="rounded-full bg-ink-900 px-4 py-2 text-[12px] font-medium text-white">
              {lang === "zh" ? "开始 →" : "Start →"}
            </span>
          </button>

          <div className="my-8 flex items-center gap-3 text-[12px] text-ink-400">
            <div className="h-px flex-1 bg-ink-100" />
            {lang === "zh" ? "或者，看看大家在追什么" : "Or see what others are tracking"}
            <div className="h-px flex-1 bg-ink-100" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {INSPIRATIONS.map((item) => (
              <button
                key={item.label}
                onClick={() => onStartWithWishlist([makeInspirationItem(item.label, item.priorityLabel)])}
                className="rounded-xl border hairline bg-white px-4 py-4 text-left hover:border-aurora-200 hover:bg-aurora-50/50 transition"
              >
                <div className="text-2xl">{item.emoji}</div>
                <div className="mt-2 text-[14px] font-semibold text-ink-900">
                  {lang === "zh" ? item.label : item.labelEn}
                </div>
                <div className="mt-1 text-[12px] text-aurora-700">
                  {lang === "zh" ? item.status : item.statusEn}
                </div>
                <div className="mt-2 text-[11px] text-ink-400">
                  {item.followers} {lang === "zh" ? "人在追" : "people tracking"}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              onStartWithWishlist(
                INSPIRATIONS.map((item) => makeInspirationItem(item.label, item.priorityLabel))
              )
            }
            className="mt-6 rounded-full border hairline bg-white px-5 py-2.5 text-sm font-medium text-ink-800 hover:bg-ink-50"
          >
            {lang === "zh" ? "+ 用这个开始我的 2026" : "+ Start my 2026 with these"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border hairline bg-white shadow-[0_1px_2px_rgba(20,30,50,0.04)] p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-ink-500 font-medium">
            {lang === "zh" ? "年度视图 · 2026" : "Year view · 2026"}
          </div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink-900 mt-1">
            {lang === "zh" ? "一份会随时间成长的旅行计划" : "A travel plan that matures over time"}
          </h2>
        </div>
        <button
          onClick={onOpenPlanner}
          className="self-start rounded-full border hairline bg-white px-3.5 py-2 text-[12px] font-medium text-ink-700 hover:bg-ink-50"
        >
          💬 {lang === "zh" ? "Chat to refine" : "Chat to refine"}
        </button>
      </div>

      <div className="relative overflow-x-auto pb-1">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-12 text-[10.5px] tracking-[0.12em] text-ink-400 uppercase pb-3">
            {MONTH_LABELS[lang].map((m) => (
              <div key={m} className="px-1">
                {m}
              </div>
            ))}
          </div>
          <div className="relative h-3 rounded-full bg-ink-50 border hairline">
            <div className="absolute inset-0 grid grid-cols-12">
              {MONTH_LABELS[lang].map((_, i) => (
                <div key={i} className={`border-r border-ink-100 ${i === 11 ? "border-r-0" : ""}`} />
              ))}
            </div>
          </div>

          <div className="relative mt-7 space-y-4">
            {trips.map((trip) => {
              const dest = DESTINATIONS.find((d) => d.id === trip.destinationId);
              if (!dest) return null;
              const maturity = maturityAt(warp, trip.startMonth);
              return (
                <div key={trip.destinationId} className="relative h-14">
                  <div className="absolute inset-0 grid grid-cols-12">
                    {MONTH_LABELS[lang].map((_, i) => (
                      <div key={i} className={`border-r border-ink-50 ${i === 11 ? "border-r-0" : ""}`} />
                    ))}
                  </div>
                  <button
                    onClick={() => onSelectTrip(trip.destinationId)}
                    className={`group absolute top-1/2 -translate-y-1/2 h-11 rounded-xl px-4 flex items-center gap-3 ${maturityBand(
                      maturity
                    )} shadow-[0_2px_8px_rgba(20,30,50,0.08)] hover:shadow-[0_4px_16px_rgba(20,30,50,0.14)] transition-all duration-300 hover:scale-[1.02]`}
                    style={{
                      left: `${tripLeftPct(trip)}%`,
                      minWidth: `max(${tripWidthPct(trip)}%, 210px)`,
                    }}
                  >
                    <span className="text-base leading-none">{dest.flag}</span>
                    <div className="min-w-0 text-left">
                      <div className="truncate text-[12.5px] font-semibold leading-tight">
                        {lang === "zh" ? dest.experience : dest.experienceEn}
                      </div>
                      <div className="mt-0.5 truncate text-[10.5px] opacity-85 leading-tight">
                        {dest.city} · {trip.days}d · {maturityLabel(maturity, lang)}
                      </div>
                    </div>
                    <span className={`ml-auto h-2.5 w-2.5 rounded-full ${maturityBg(maturity)} ${maturity !== "ready" ? "animate-pulse-soft" : ""}`} />
                  </button>
                </div>
              );
            })}

            {deferredTrips.map((trip) => {
              const dest = DESTINATIONS.find((d) => d.id === trip.destinationId);
              if (!dest) return null;
              return (
                <div key={trip.destinationId} className="relative h-12">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-9 rounded-xl border-2 border-dashed border-ink-200 px-4 flex items-center gap-3 bg-white"
                    style={{
                      left: `${tripLeftPct(trip)}%`,
                      minWidth: `max(${tripWidthPct(trip)}%, 240px)`,
                    }}
                  >
                    <span className="text-base leading-none opacity-50">{dest.flag}</span>
                    <div className="min-w-0 text-left">
                      <div className="truncate text-[12.5px] font-semibold leading-tight text-ink-500 line-through decoration-ink-300">
                        {lang === "zh" ? dest.experience : dest.experienceEn}
                      </div>
                      <div className="mt-0.5 truncate text-[10.5px] text-ink-400 leading-tight">
                        {lang === "zh" ? trip.deferReason : trip.deferReasonEn}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px]">
        <Legend dot="bg-amber-400" label={lang === "zh" ? "Sketch · 模糊概率区间" : "Sketch · broad range"} />
        <Legend dot="bg-orange-500" label={lang === "zh" ? "Refining · 正在收敛" : "Refining · narrowing"} />
        <Legend dot="bg-emerald-500" label={lang === "zh" ? "Ready · 精准窗口" : "Ready · precise window"} />
        <Legend dot="bg-ink-300" label={lang === "zh" ? "Deferred · 推迟到明年" : "Deferred · next year"} />
      </div>
    </section>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-50 border hairline">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="text-ink-700">{label}</span>
    </div>
  );
}
