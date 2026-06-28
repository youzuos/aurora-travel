"use client";

import { WARP_STOPS, type WarpStop } from "@/lib/time";
import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  warp: WarpStop;
  disabled?: boolean;
  onChange: (w: WarpStop) => void;
}

export default function TimeWarp({ lang, warp, disabled, onChange }: Props) {
  const stops = WARP_STOPS[lang];
  const idx = Math.max(0, stops.findIndex((s) => s.key === warp));
  const pct = (idx / (stops.length - 1)) * 100;

  return (
    <section
      className={`rounded-2xl border hairline bg-white px-5 sm:px-6 py-5 shadow-[0_1px_2px_rgba(20,30,50,0.04)] ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500 font-medium">
          {lang === "zh"
            ? "TIME WARP · 拖动看你的计划如何“长大”"
            : "TIME WARP · Watch your plan grow"}
        </div>
        <div className="rounded-full bg-ink-900 px-2.5 py-1 text-[10.5px] font-semibold text-white">
          {stops[idx]?.key === "year-start" ? stops[idx].label : stops[idx]?.label}
        </div>
      </div>

      <div className="mt-5">
        <div className="grid grid-cols-4 gap-2 text-[11px] text-ink-500">
          {stops.map((stop, i) => (
            <button
              key={stop.key}
              disabled={disabled}
              onClick={() => !disabled && onChange(stop.key)}
              className={`text-left disabled:cursor-not-allowed ${
                i === idx && !disabled ? "font-semibold text-aurora-800" : ""
              }`}
            >
              {stop.label}
            </button>
          ))}
        </div>

        <div className="relative mt-3 h-10">
          <div className="absolute left-1 right-1 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-ink-100" />
          <div
            className="absolute left-1 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-gradient-to-r from-aurora-300 to-aurora-700 transition-all duration-500"
            style={{ width: disabled ? 0 : `calc(${pct}% - 4px)` }}
          />
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between">
            {stops.map((stop, i) => {
              const active = !disabled && i <= idx;
              const current = !disabled && i === idx;
              return (
                <button
                  key={stop.key}
                  disabled={disabled}
                  onClick={() => !disabled && onChange(stop.key)}
                  className="relative grid h-8 w-8 place-items-center disabled:cursor-not-allowed"
                  aria-label={stop.label}
                >
                  {current && (
                    <span className="absolute -top-5 text-[10px] font-semibold text-aurora-700">
                      {lang === "zh" ? "当前 ▼" : "Now ▼"}
                    </span>
                  )}
                  <span
                    className={`h-4 w-4 rounded-full border-2 transition-all duration-300 ${
                      current
                        ? "scale-125 border-aurora-800 bg-aurora-700 shadow-[0_0_0_5px_rgba(66,127,176,0.14)]"
                        : active
                        ? "border-aurora-600 bg-aurora-500"
                        : "border-ink-200 bg-white"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-1 flex items-start justify-between gap-4 text-[11px]">
          <div className="text-ink-500">
            <div className="font-medium text-ink-700">{lang === "zh" ? "模糊" : "Fuzzy"}</div>
            <div>{lang === "zh" ? "概率区间" : "probability range"}</div>
          </div>
          <div className="text-right text-ink-500">
            <div className="font-medium text-ink-700">{lang === "zh" ? "精准窗口" : "Precise window"}</div>
            <div>{stops[idx]?.sub}</div>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-ink-50 px-3 py-2 text-[12px] text-ink-700">
          {disabled
            ? lang === "zh"
              ? "生成年度计划后，时间轴会展示同一份计划如何从模糊变清晰。"
              : "Generate a plan first, then the timeline will show how it matures."
            : stops[idx]?.current}
        </div>
      </div>
    </section>
  );
}
