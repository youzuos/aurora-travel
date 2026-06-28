"use client";

import { useState } from "react";
import { getDestination } from "@/data/destinations";
import { buildMonthCalendar, generateLeaveStrategies, type LeaveStrategy } from "@/lib/calendar";
import {
  maturityAt,
  maturityBg,
  maturityColor,
  maturityLabel,
  type WarpStop,
} from "@/lib/time";
import type { Destination, Lang, Maturity, PlanProfile, Trip } from "@/lib/types";

interface Props {
  lang: Lang;
  destinationId: string;
  warp: WarpStop;
  trips: Trip[];
  profile: PlanProfile | null;
  onBack: () => void;
  onOpenPlanner: () => void;
}

function PeakChart({ dest, maturity, lang }: { dest: Destination; maturity: Maturity; lang: Lang }) {
  const W = 560;
  const H = 130;
  const pad = { l: 14, r: 14, t: 14, b: 22 };
  const pts = dest.peakCurve;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const stepX = innerW / (pts.length - 1);
  const peakIdx = pts.reduce((best, p, i) => (p.p > pts[best].p ? i : best), 0);
  const rangeDays =
    maturity === "ready"
      ? dest.confirmedRangeDays
      : maturity === "refining"
      ? dest.refinedRangeDays
      : dest.remoteRangeDays;
  const half = Math.floor(rangeDays / 2);
  const lo = Math.max(0, peakIdx - half);
  const hi = Math.min(pts.length - 1, peakIdx + half);
  const path = pts
    .map((p, i) => {
      const x = pad.l + i * stepX;
      const y = pad.t + innerH * (1 - p.p);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${path} L ${pad.l + (pts.length - 1) * stepX} ${pad.t + innerH} L ${pad.l} ${pad.t + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[130px]">
      <defs>
        <linearGradient id="peakFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#427fb0" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#427fb0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect
        x={pad.l + lo * stepX}
        y={pad.t}
        width={(hi - lo) * stepX}
        height={innerH}
        fill={maturity === "ready" ? "rgba(34,197,94,0.10)" : "rgba(66,127,176,0.12)"}
        rx="6"
      />
      <path d={area} fill="url(#peakFill)" />
      <path d={path} fill="none" stroke="#306694" strokeWidth="1.6" />
      <line x1={pad.l + peakIdx * stepX} x2={pad.l + peakIdx * stepX} y1={pad.t} y2={pad.t + innerH} stroke="#306694" strokeWidth="1" strokeDasharray="2 3" opacity="0.55" />
      <circle cx={pad.l + peakIdx * stepX} cy={pad.t + innerH * (1 - pts[peakIdx].p)} r="3" fill="#306694" />
      <text x={pad.l + lo * stepX} y={H - 6} fontSize="9.5" fill="#737c8e">
        {pts[lo].date.slice(5)}
      </text>
      <text x={pad.l + peakIdx * stepX} y={H - 6} fontSize="9.5" fill="#306694" fontWeight="600" textAnchor="middle">
        {lang === "zh" ? "峰值" : "peak"} {pts[peakIdx].date.slice(5)}
      </text>
      <text x={pad.l + hi * stepX} y={H - 6} fontSize="9.5" fill="#737c8e" textAnchor="end">
        {pts[hi].date.slice(5)}
      </text>
    </svg>
  );
}

function PriceChart({ dest, warp }: { dest: Destination; warp: WarpStop }) {
  const W = 560;
  const H = 130;
  const pad = { l: 30, r: 14, t: 14, b: 22 };
  const pts = [...dest.priceCurve].sort((a, b) => b.t - a.t);
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const max = Math.max(...pts.map((p) => p.price));
  const min = Math.min(...pts.map((p) => p.price));
  const stepX = innerW / (pts.length - 1);
  const path = pts
    .map((p, i) => {
      const x = pad.l + i * stepX;
      const y = pad.t + innerH * (1 - (p.price - min) / Math.max(1, max - min));
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const tNow: Record<WarpStop, number> = {
    "year-start": 300,
    "t-90": 90,
    "t-30": 30,
    "t-14": 14,
  };
  const cursor = Math.max(0, pts.findIndex((p) => p.t <= tNow[warp]));
  const cursorX = pad.l + cursor * stepX;
  const cursorPrice = pts[cursor].price;
  const troughL = pts.findIndex((p) => p.t <= 60);
  const troughR = pts.findIndex((p) => p.t <= 45);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[130px]">
      <defs>
        <linearGradient id="priceFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#427fb0" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#427fb0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <text x="4" y={pad.t + 4} fontSize="9.5" fill="#9aa2b3">¥{Math.round(max / 1000)}k</text>
      <text x="4" y={pad.t + innerH} fontSize="9.5" fill="#9aa2b3">¥{Math.round(min / 1000)}k</text>
      <rect x={pad.l + troughL * stepX} y={pad.t} width={(troughR - troughL) * stepX} height={innerH} fill="rgba(34,197,94,0.12)" rx="4" />
      <path d={`${path} L ${pad.l + (pts.length - 1) * stepX} ${pad.t + innerH} L ${pad.l} ${pad.t + innerH} Z`} fill="url(#priceFill)" />
      <path d={path} fill="none" stroke="#306694" strokeWidth="1.6" />
      <line x1={cursorX} x2={cursorX} y1={pad.t} y2={pad.t + innerH} stroke="#1c1f26" strokeWidth="1" />
      <circle cx={cursorX} cy={pad.t + 6} r="3.2" fill="#1c1f26" />
      <text x={cursorX + 6} y={pad.t + 10} fontSize="10" fill="#1c1f26" fontWeight="600">
        ¥{cursorPrice.toLocaleString()}
      </text>
      <text x={pad.l} y={H - 6} fontSize="9.5" fill="#737c8e">T-365</text>
      <text x={pad.l + innerW} y={H - 6} fontSize="9.5" fill="#737c8e" textAnchor="end">T-0</text>
    </svg>
  );
}

function LeaveStrategyPanel({
  lang,
  trip,
  strategies,
}: {
  lang: Lang;
  trip: Trip;
  strategies: LeaveStrategy[];
}) {
  const [activeId, setActiveId] = useState(strategies[0]?.id ?? "");
  const active = strategies.find((strategy) => strategy.id === activeId) ?? strategies[0];
  if (!active) return null;

  const month = Number(active.startDate.slice(5, 7));
  const days = buildMonthCalendar(2026, month);
  const tripSet = new Set(active.tripDates);
  const ptoSet = new Set(active.ptoDates);
  const holidaySet = new Set(active.holidayDates);
  const conflictSet = new Set(active.blockedConflicts);

  return (
    <section className="mt-5 rounded-xl border hairline bg-ink-50/40 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500 font-medium">
            {lang === "zh" ? "请假策略" : "Leave strategy"}
          </div>
          <div className="mt-1 text-[13px] text-ink-600">
            {lang === "zh"
              ? "结合公共节假日、年假和不可出行日期，先给出可比较的候选方案。"
              : "Compare candidate options using holidays, PTO, and blocked dates."}
          </div>
        </div>
        <div className="text-[12px] text-ink-500">
          {trip.startDate} - {trip.endDate}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {strategies.map((strategy) => (
          <button
            key={strategy.id}
            onClick={() => setActiveId(strategy.id)}
            className={`rounded-xl border p-3 text-left transition ${
              strategy.id === active.id ? "border-aurora-700 bg-white shadow-sm" : "hairline bg-white/70 hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-[13px] font-semibold text-ink-900">
                {lang === "zh" ? strategy.title : strategy.titleEn}
              </div>
              <div className="text-[11px] text-aurora-700">{strategy.ptoDays}d PTO</div>
            </div>
            <div className="mt-1 text-[11.5px] leading-relaxed text-ink-600">
              {lang === "zh" ? strategy.summary : strategy.summaryEn}
            </div>
            {strategy.blockedConflicts.length > 0 && (
              <div className="mt-2 rounded-md bg-rose-50 px-2 py-1 text-[11px] text-rose-600">
                {lang === "zh" ? "冲突日期：" : "Blocked conflict: "}
                {strategy.blockedConflicts.join(", ")}
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <div className="rounded-xl border hairline bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[12px] font-semibold text-ink-900">
              {lang === "zh" ? `${month} 月日历` : `Month ${month}`}
            </div>
            <div className="text-[11px] text-ink-500">
              {active.startDate} → {active.endDate}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-ink-400">
            {(lang === "zh" ? ["日", "一", "二", "三", "四", "五", "六"] : ["S", "M", "T", "W", "T", "F", "S"]).map((d, i) => (
              <div key={`${d}-${i}`}>{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const tripDay = tripSet.has(day.date);
              const ptoDay = ptoSet.has(day.date);
              const holidayDay = holidaySet.has(day.date);
              const conflictDay = conflictSet.has(day.date);
              return (
                <div
                  key={day.date}
                  className={`grid h-8 place-items-center rounded-md text-[10.5px] ${
                    !day.inMonth
                      ? "opacity-20"
                      : conflictDay
                      ? "bg-rose-500 text-white"
                      : ptoDay
                      ? "bg-aurora-700 text-white"
                      : holidayDay
                      ? "bg-emerald-100 text-emerald-800"
                      : tripDay
                      ? "bg-aurora-50 text-aurora-800"
                      : day.isWeekend
                      ? "bg-ink-50 text-ink-600"
                      : "bg-white text-ink-700"
                  }`}
                >
                  {day.day}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border hairline bg-white p-4">
          <div className="grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
            <Metric label={lang === "zh" ? "旅行天数" : "Trip days"} value={`${active.totalDays}d`} />
            <Metric label={lang === "zh" ? "请年假" : "PTO"} value={`${active.ptoDays}d`} />
            <Metric label={lang === "zh" ? "节假日/周末" : "Free days"} value={`${active.holidayDates.length}d`} />
            <Metric label={lang === "zh" ? "冲突" : "Conflicts"} value={`${active.blockedConflicts.length}`} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-ink-500">
            <span><b className="text-aurora-700">■</b> {lang === "zh" ? "请年假" : "PTO"}</span>
            <span><b className="text-emerald-500">■</b> {lang === "zh" ? "公共假日/周末" : "Holiday/weekend"}</span>
            <span><b className="text-rose-500">■</b> {lang === "zh" ? "不可出行冲突" : "Blocked conflict"}</span>
          </div>
          <div className="mt-4 text-[11.5px] leading-relaxed text-ink-600">
            {lang === "zh"
              ? "后续可在这里加入“保存此方案”和真实票价/酒店价格联动。当前先完成可接入的请假策略框架。"
              : "Later this can save a selected option and connect to flight/hotel pricing. This MVP builds the pluggable strategy frame first."}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function TripView({ lang, destinationId, warp, trips, profile, onBack, onOpenPlanner }: Props) {
  const dest = getDestination(destinationId);
  const trip = trips.find((t) => t.destinationId === destinationId);
  if (!dest || !trip) return null;
  const maturity = maturityAt(warp, trip.startMonth);
  const missRate = dest.missRate[maturity];
  const leaveStrategies = generateLeaveStrategies(trip, profile);

  return (
    <section className="rounded-2xl border hairline bg-white shadow-[0_1px_2px_rgba(20,30,50,0.04)] overflow-hidden animate-fade-in">
      <div className="px-5 sm:px-7 py-5 border-b hairline flex items-center justify-between gap-4">
        <button onClick={onBack} className="text-[12px] text-ink-500 hover:text-ink-900 flex items-center gap-1.5">
          ← {lang === "zh" ? "返回年度视图" : "Back to year view"}
        </button>
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${maturityBg(maturity)} ${maturity !== "ready" ? "animate-pulse-soft" : ""}`} />
          <span className={`text-[11px] ${maturityColor(maturity)}`}>{maturityLabel(maturity, lang)}</span>
        </div>
      </div>

      <div className="px-5 sm:px-7 py-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-ink-500">
              {lang === "zh" ? "行程精修" : "Trip detail"}
            </div>
            <h2 className="text-[26px] font-semibold tracking-tight text-ink-900 mt-1 flex flex-wrap items-center gap-3">
              <span>{dest.flag}</span>
              {lang === "zh" ? dest.experience : dest.experienceEn}
              <span className="text-base font-normal text-ink-500">· {dest.city}, {dest.country}</span>
            </h2>
            <div className="text-[12.5px] text-ink-600 mt-1.5 max-w-2xl">
              {lang === "zh" ? dest.story : dest.storyEn}
            </div>
          </div>
          <div className="rounded-xl border hairline bg-ink-50 px-4 py-3 text-[12px] text-ink-700 lg:w-[280px]">
            <div className="font-semibold text-ink-900 mb-1">
              {lang === "zh" ? "为什么放在这里" : "Why this slot"}
            </div>
            {lang === "zh" ? trip.reason : trip.reasonEn}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel
            title={lang === "zh" ? "体验时钟 · 峰值概率" : "Experience clock · peak probability"}
            aside={`${lang === "zh" ? "区间宽度" : "Range"} ${
              maturity === "ready" ? dest.confirmedRangeDays : maturity === "refining" ? dest.refinedRangeDays : dest.remoteRangeDays
            }d`}
          >
            <PeakChart dest={dest} maturity={maturity} lang={lang} />
            <div className="mt-2 text-[11.5px] text-ink-600 flex items-center justify-between">
              <span>
                {maturity === "sketched"
                  ? lang === "zh"
                    ? "远期给概率，不假装精确"
                    : "Far out: probability, not false precision"
                  : maturity === "refining"
                  ? lang === "zh"
                    ? "区间正在收敛"
                    : "The window is narrowing"
                  : lang === "zh"
                  ? "峰值锁定，可执行"
                  : "Peak locked, ready to execute"}
              </span>
              <span className="text-rose-500">
                {lang === "zh" ? "扑空率" : "Miss risk"} <span className="font-semibold">{(missRate * 100).toFixed(0)}%</span>
              </span>
            </div>
          </Panel>

          <Panel
            title={lang === "zh" ? "订票时钟 · 历史价格" : "Booking clock · historical price"}
            aside={lang === "zh" ? "3 年均值 · 预置数据" : "3-year avg · seeded data"}
          >
            <PriceChart dest={dest} warp={warp} />
            <div className="mt-2 text-[11.5px] text-ink-600">
              {lang === "zh"
                ? "T-60~45 是历史价格谷底，价格 Agent 会在接近窗口时提醒。"
                : "T-60~45 is the historical trough. The price agent alerts near that window."}
            </div>
          </Panel>

          <Panel title={lang === "zh" ? "假期杠杆" : "Holiday leverage"}>
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[12px] text-ink-700">
                {trip.ptoDays}d PTO ×{" "}
                <span className="text-emerald-700 font-semibold">
                  {(trip.days / Math.max(1, trip.ptoDays)).toFixed(1)}
                </span>{" "}
                = {trip.days}d
              </div>
              <div className="text-[12px] font-semibold text-ink-900">¥{trip.estimatedBudget.toLocaleString()}</div>
            </div>
            <div className="flex h-7 rounded-lg overflow-hidden border hairline">
              <div className="bg-aurora-600 text-white text-[10.5px] grid place-items-center font-medium" style={{ width: `${(trip.ptoDays / trip.days) * 100}%` }}>
                PTO · {trip.ptoDays}d
              </div>
              <div className="bg-emerald-100 text-emerald-800 text-[10.5px] grid place-items-center font-medium" style={{ width: `${(trip.holidayLeveraged / trip.days) * 100}%` }}>
                {lang === "zh" ? "公共假期" : "Holiday"} · {trip.holidayLeveraged}d
              </div>
            </div>
          </Panel>

          <Panel title={lang === "zh" ? "成熟度时间线" : "Maturity timeline"}>
            <div className="flex flex-wrap items-center gap-3">
              <StagePill label="Sketch" active={maturity === "sketched"} />
              <span className="text-ink-300">→</span>
              <StagePill label="Refining" active={maturity === "refining"} />
              <span className="text-ink-300">→</span>
              <StagePill label="Ready" active={maturity === "ready"} />
            </div>
            <div className="mt-3 text-[11.5px] text-ink-600">
              {lang === "zh"
                ? "同一份计划持续成长，不要求用户反复重新选择模式。"
                : "The same plan matures over time without making the user choose modes repeatedly."}
            </div>
          </Panel>
        </div>

        <LeaveStrategyPanel lang={lang} trip={trip} strategies={leaveStrategies} />

        <button
          onClick={onOpenPlanner}
          className="mt-6 w-full rounded-xl border hairline px-5 py-3 text-left hover:bg-ink-50 transition flex items-center gap-3 group"
        >
          <span className="h-7 w-7 rounded-md bg-ink-900 text-white text-xs grid place-items-center group-hover:bg-aurora-700 transition">
            💬
          </span>
          <span className="text-[12.5px] text-ink-600">
            {lang === "zh"
              ? "修改边界条件或新增心愿，重新生成年度规划。"
              : "Edit constraints or add wishes, then regenerate the year plan."}
          </span>
          <span className="ml-auto text-[11px] text-ink-400">Chat</span>
        </button>
      </div>
    </section>
  );
}

function Panel({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border hairline p-4 bg-ink-50/40">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500 font-medium">{title}</div>
        {aside && <div className="text-[11px] text-ink-500">{aside}</div>}
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-50 px-3 py-2">
      <div className="text-[10.5px] text-ink-500">{label}</div>
      <div className="mt-0.5 text-[14px] font-semibold text-ink-900">{value}</div>
    </div>
  );
}

function StagePill({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
        active ? "bg-aurora-700 text-white border-aurora-700" : "bg-white text-ink-500 border-ink-200"
      }`}
    >
      {label}
    </span>
  );
}
