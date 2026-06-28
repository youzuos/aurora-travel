"use client";

import { aggregateStage, maturityAt, type WarpStop } from "@/lib/time";
import type { Lang, Maturity, Trip } from "@/lib/types";

interface Props {
  lang: Lang;
  warp: WarpStop;
  trips: Trip[];
}

const CARD_META: Record<
  Maturity,
  { emoji: string; label: string; zh: string; color: string }
> = {
  sketched: {
    emoji: "🟡",
    label: "Sketch",
    zh: "Sketch",
    color: "border-amber-200 bg-amber-50/70",
  },
  refining: {
    emoji: "🟠",
    label: "Refining",
    zh: "Refining",
    color: "border-orange-200 bg-orange-50/70",
  },
  ready: {
    emoji: "🟢",
    label: "Ready",
    zh: "Ready",
    color: "border-emerald-200 bg-emerald-50/70",
  },
};

export default function MaturitySummary({ lang, warp, trips }: Props) {
  if (!trips.length) return null;

  const maturities = trips.map((trip) => maturityAt(warp, trip.startMonth));
  const stage = aggregateStage(maturities);
  const counts = maturities.reduce(
    (acc, maturity) => {
      acc[maturity] += 1;
      return acc;
    },
    { sketched: 0, refining: 0, ready: 0 } as Record<Maturity, number>
  );
  const stages: Maturity[] = ["sketched", "refining", "ready"];
  const activeIdx = stages.indexOf(stage);

  return (
    <section className="rounded-2xl border hairline bg-white p-4 shadow-[0_1px_2px_rgba(20,30,50,0.04)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-ink-500 font-medium">
            {lang === "zh" ? "计划成熟度" : "Plan maturity"}
          </div>
          <div className="mt-1 text-sm font-medium text-ink-800">
            {lang === "zh"
              ? `你的 2026 还在 ${CARD_META[stage].zh} 阶段`
              : `Your 2026 plan is in ${CARD_META[stage].label}`}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-3 gap-3 lg:max-w-[560px]">
          {stages.map((maturity) => {
            const meta = CARD_META[maturity];
            return (
              <div
                key={maturity}
                className={`rounded-xl border px-3 py-2 ${meta.color} ${
                  maturity === stage ? "ring-2 ring-aurora-200" : ""
                }`}
              >
                <div className="text-[12px] font-semibold text-ink-900">
                  {meta.emoji} {meta.label}
                </div>
                <div className="mt-1 text-[11px] text-ink-600">
                  {counts[maturity]} {lang === "zh" ? "段行程" : counts[maturity] === 1 ? "trip" : "trips"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {stages.map((maturity, index) => (
          <div key={maturity} className="flex flex-1 items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full transition-all duration-500 ${
                index === activeIdx
                  ? "scale-125 bg-aurora-700 shadow-[0_0_0_5px_rgba(66,127,176,0.12)]"
                  : index < activeIdx
                  ? "bg-aurora-400"
                  : "bg-ink-200"
              }`}
            />
            {index < stages.length - 1 && (
              <div className={`h-[2px] flex-1 rounded-full ${index < activeIdx ? "bg-aurora-400" : "bg-ink-100"}`} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
