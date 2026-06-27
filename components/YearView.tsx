"use client";

import { DESTINATIONS } from "@/data/destinations";
import { DEFERRED_TRIPS, INITIAL_TRIPS } from "@/data/plan";
import {
  MONTH_LABELS,
  maturityAt,
  maturityBg,
  maturityLabel,
  type WarpStop,
} from "@/lib/time";
import type { Trip } from "@/lib/types";

interface Props {
  warp: WarpStop;
  onSelectTrip: (destinationId: string) => void;
}

function tintBand(tint: string, mature: string) {
  // single-color (aurora blue) brand: use depth, not hue. mature stage controls saturation.
  if (mature === "ready")
    return "from-aurora-600 to-aurora-800 text-white";
  if (mature === "refining")
    return "from-aurora-400 to-aurora-600 text-white";
  return "from-aurora-200 to-aurora-300 text-aurora-900";
}

function tripWidthPct(t: Trip) {
  // months are 8.33% each; treat each trip as taking ~its real day-count proportionally
  return (t.days / 30.4) * (100 / 12);
}

function tripLeftPct(t: Trip) {
  return ((t.startMonth - 1) / 12) * 100;
}

export default function YearView({ warp, onSelectTrip }: Props) {
  return (
    <div className="rounded-2xl border hairline bg-white shadow-[0_1px_2px_rgba(20,30,50,0.04)] p-7">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-ink-500 font-medium">
            Year View · 2026
          </div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink-900 mt-1">
            一份会成长的年度计划
          </h2>
        </div>
        <div className="text-[11px] text-ink-500">
          点击任一段进入精修视图
        </div>
      </div>

      {/* Month axis */}
      <div className="relative">
        <div className="grid grid-cols-12 text-[10.5px] tracking-[0.12em] text-ink-400 uppercase pb-3">
          {MONTH_LABELS.map((m) => (
            <div key={m} className="px-1">
              {m}
            </div>
          ))}
        </div>
        <div className="relative h-3 rounded-full bg-ink-50 border hairline">
          {/* gridlines */}
          <div className="absolute inset-0 grid grid-cols-12">
            {MONTH_LABELS.map((_, i) => (
              <div
                key={i}
                className={`border-r border-ink-100 ${
                  i === 11 ? "border-r-0" : ""
                }`}
              />
            ))}
          </div>
        </div>

        {/* Trip lanes */}
        <div className="relative mt-7 space-y-4">
          {INITIAL_TRIPS.map((trip, idx) => {
            const dest = DESTINATIONS.find(
              (d) => d.id === trip.destinationId
            );
            if (!dest) return null;
            const m = maturityAt(warp, trip.startMonth);
            return (
              <div key={trip.destinationId} className="relative h-14">
                {/* lane background */}
                <div className="absolute inset-0 grid grid-cols-12">
                  {MONTH_LABELS.map((_, i) => (
                    <div
                      key={i}
                      className={`border-r border-ink-50 ${
                        i === 11 ? "border-r-0" : ""
                      }`}
                    />
                  ))}
                </div>

                {/* uncertainty halo (远期更宽) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-9 rounded-full opacity-50"
                  style={{
                    left: `calc(${tripLeftPct(trip)}% - ${
                      m === "sketched" ? 24 : m === "refining" ? 10 : 3
                    }px)`,
                    width: `calc(${tripWidthPct(trip)}% + ${
                      m === "sketched" ? 48 : m === "refining" ? 20 : 6
                    }px)`,
                    background:
                      m === "sketched"
                        ? "linear-gradient(90deg, transparent, rgba(66,127,176,0.18), transparent)"
                        : m === "refining"
                        ? "linear-gradient(90deg, transparent, rgba(66,127,176,0.28), transparent)"
                        : "linear-gradient(90deg, transparent, rgba(34,197,94,0.18), transparent)",
                  }}
                />

                {/* the trip pill */}
                <button
                  onClick={() => onSelectTrip(trip.destinationId)}
                  className={`group absolute top-1/2 -translate-y-1/2 h-11 rounded-xl px-4 flex items-center gap-3 bg-gradient-to-r ${tintBand(
                    dest.tint,
                    m
                  )} shadow-[0_2px_8px_rgba(20,30,50,0.08)] hover:shadow-[0_4px_16px_rgba(20,30,50,0.14)] transition-all duration-300 hover:scale-[1.02]`}
                  style={{
                    left: `${tripLeftPct(trip)}%`,
                    minWidth: `max(${tripWidthPct(trip)}%, 180px)`,
                  }}
                >
                  <span className="text-base leading-none">
                    {dest.flag}
                  </span>
                  <div className="text-left">
                    <div className="text-[12.5px] font-semibold leading-tight">
                      {dest.experience}
                    </div>
                    <div className="text-[10.5px] opacity-85 leading-tight mt-0.5">
                      {dest.city} · {trip.days}d ·{" "}
                      {maturityLabel(m).slice(2)}
                    </div>
                  </div>
                  <span
                    className={`ml-auto h-2 w-2 rounded-full ${maturityBg(
                      m
                    )} ${
                      m !== "ready" ? "animate-pulse-soft" : ""
                    }`}
                  />
                </button>
              </div>
            );
          })}

          {/* deferred (灰显) */}
          {DEFERRED_TRIPS.map((trip) => {
            const dest = DESTINATIONS.find(
              (d) => d.id === trip.destinationId
            );
            if (!dest) return null;
            return (
              <div key={trip.destinationId} className="relative h-12">
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-9 rounded-xl border-2 border-dashed border-ink-200 px-4 flex items-center gap-3 bg-white"
                  style={{
                    left: `${tripLeftPct(trip)}%`,
                    minWidth: `max(${tripWidthPct(trip)}%, 180px)`,
                  }}
                >
                  <span className="text-base leading-none opacity-50">
                    {dest.flag}
                  </span>
                  <div className="text-left">
                    <div className="text-[12.5px] font-semibold leading-tight text-ink-500 line-through decoration-ink-300">
                      {dest.experience}
                    </div>
                    <div className="text-[10.5px] text-ink-400 leading-tight mt-0.5">
                      被综合 Agent 挪到 2027 · 释放 5 PTO
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-3 text-[11px]">
        <Legend
          dot="bg-rose-400"
          label="🔴 数据更新中 · 远期概率区间"
        />
        <Legend
          dot="bg-amber-500"
          label="🟡 待精修 · 价格信号就绪"
        />
        <Legend
          dot="bg-emerald-500"
          label="🟢 已就绪 · 峰值 + 价格双确认"
        />
      </div>
    </div>
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
