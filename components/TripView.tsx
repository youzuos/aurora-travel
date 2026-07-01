"use client";

import { useMemo, useState, type ReactNode } from "react";
import { getDestination } from "@/data/destinations";
import { buildMonthCalendar, generateLeaveStrategies, type LeaveStrategy } from "@/lib/calendar";
import {
  maturityAt,
  maturityBg,
  maturityColor,
  maturityLabel,
  type WarpStop,
} from "@/lib/time";
import type { DailyPlanDay, Destination, Lang, Maturity, PlanProfile, Trip, TripWishlistItem } from "@/lib/types";

interface Props {
  lang: Lang;
  destinationId: string;
  warp: WarpStop;
  trips: Trip[];
  profile: PlanProfile | null;
  onBack: () => void;
  onOpenPlanner: () => void;
}

type RiskLevel = "low" | "medium" | "high";

function formatShortDate(date: string) {
  return date.slice(5).replace("-", "/");
}

function formatDateRange(start?: string, end?: string, lang: Lang = "zh") {
  if (!start || !end) return lang === "zh" ? "日期待确认" : "Dates pending";
  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

function formatDays(days: number, lang: Lang) {
  return lang === "zh" ? `${days} 天` : `${days}d`;
}

function formatPto(days: number, lang: Lang) {
  return lang === "zh" ? `${days} 天年假` : `${days}d PTO`;
}

function cleanReason(reason: string) {
  return reason.replace(/\s+的/g, "的").replace(/\s+/g, " ").trim();
}

function getRangeDays(dest: Destination, maturity: Maturity) {
  if (maturity === "ready") return dest.confirmedRangeDays;
  if (maturity === "refining") return dest.refinedRangeDays;
  return dest.remoteRangeDays;
}

function getWindowPoints(dest: Destination) {
  const pts = dest.peakCurve;
  const peakIdx = pts.reduce((best, point, index) => (point.p > pts[best].p ? index : best), 0);
  const desired = 9;
  let start = Math.max(0, peakIdx - Math.floor(desired / 2));
  let end = Math.min(pts.length, start + desired);
  start = Math.max(0, end - desired);
  return {
    points: pts.slice(start, end),
    peakDate: pts[peakIdx]?.date ?? pts[0]?.date,
  };
}

function getRiskLevel(missRate: number): RiskLevel {
  const percent = missRate * 100;
  if (percent <= 15) return "low";
  if (percent <= 35) return "medium";
  return "high";
}

function getRiskCopy(level: RiskLevel, lang: Lang) {
  if (lang === "en") {
    return {
      label: level === "low" ? "Low" : level === "medium" ? "Medium" : "High",
      text:
        level === "low"
          ? "The window is fairly stable. Focus on execution details."
          : level === "medium"
          ? "Worth planning, but Aurora should keep watching weather and timing signals."
          : "Do not lock every detail yet. Keep a backup window ready.",
    };
  }

  return {
    label: level === "low" ? "较低" : level === "medium" ? "中等" : "较高",
    text:
      level === "low"
        ? "窗口已经比较稳，重点是确认预约、交通和行李。"
        : level === "medium"
        ? "值得规划，但还要继续盯天气、花期或雪况变化。"
        : "不建议现在把日期完全拍死，最好保留备选窗口。",
  };
}

function getMaturityHint(maturity: Maturity, lang: Lang) {
  if (lang === "en") {
    if (maturity === "sketched") return "This is still an early sketch. Aurora will narrow the window as better signals arrive.";
    if (maturity === "refining") return "The window is narrowing. Aurora will keep checking weather, openings, and price signals.";
    return "This is close to execution. The next focus is weather, reservations, transport, and packing.";
  }

  if (maturity === "sketched") return "现在距离出发还远，这只是初步判断。我会在信息变多后继续收窄窗口。";
  if (maturity === "refining") return "现在窗口已经开始收敛，后续会继续跟踪天气、开放和价格信号。";
  return "现在已经接近可执行窗口，重点是确认天气、预约、交通和打包。";
}

function getAuroraJudgment(dest: Destination, trip: Trip, maturity: Maturity, lang: Lang) {
  const range = formatDateRange(trip.startDate, trip.endDate, lang);
  if (lang === "en") {
    return `I would keep ${dest.experienceEn} around ${range}. ${cleanReason(trip.reasonEn)} ${getMaturityHint(maturity, lang)}`;
  }
  return `我建议把「${dest.experience}」放在 ${range}。${cleanReason(trip.reason)} ${getMaturityHint(maturity, lang)}`;
}

function getTripDisplayTitle(dest: Destination, trip: Trip, lang: Lang) {
  if (trip.title) return trip.title;
  return lang === "zh" ? dest.experience : dest.experienceEn;
}

function fallbackDailyPlan(dest: Destination, trip: Trip): DailyPlanDay[] {
  const start = trip.startDate ?? "2026-04-01";
  const baseCity = dest.city;
  return [
    {
      day: 1,
      date: start,
      dayOfWeek: "Day 1",
      city: baseCity,
      spots: [`抵达 ${baseCity}`, `${dest.experience} 核心体验`, "自由探索时间"],
      weather: "临近 T-14 后更新天气",
      notes: ["当前先保留天粒度骨架，后续由天气、开放时间和小精灵见闻继续细化。"],
      backup: "如果目的地内容不够满，保留为随缘逛逛或继续增加附近目的地。",
    },
  ];
}

function fallbackTripWishlist(dest: Destination): TripWishlistItem[] {
  return [
    { name: langlessExperience(dest), added: "system", day: 1 },
    { name: "自由探索时间", added: "system", note: "目的地较少时，先留白给临场体验。" },
  ];
}

function langlessExperience(dest: Destination) {
  return dest.experience.replace(/^.+? /, dest.experience);
}

function WindowBarChart({ dest, lang }: { dest: Destination; lang: Lang }) {
  const { points, peakDate } = useMemo(() => getWindowPoints(dest), [dest]);
  const maxP = Math.max(...points.map((point) => point.p), 1);

  return (
    <div className="h-[220px] rounded-xl bg-white px-4 pb-4 pt-5">
      <div className="flex h-[160px] items-end justify-between gap-2">
        {points.map((point) => {
          const isPeak = point.date === peakDate;
          const height = Math.max(20, Math.round((point.p / maxP) * 148));
          return (
            <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              {isPeak && (
                <div className="rounded-full bg-aurora-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {lang === "zh" ? "峰值" : "Peak"}
                </div>
              )}
              <div
                className={`w-full max-w-[34px] rounded-t-md transition-all duration-300 ${
                  isPeak ? "bg-aurora-800 shadow-sm" : "bg-aurora-300"
                }`}
                style={{ height }}
                title={`${point.date}: ${Math.round(point.p * 100)}%`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between gap-2 text-center text-[10.5px] text-ink-500">
        {points.map((point) => (
          <div key={point.date} className="min-w-0 flex-1">
            {formatShortDate(point.date)}
          </div>
        ))}
      </div>
    </div>
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
  const stepX = innerW / Math.max(1, pts.length - 1);
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
  const rawCursor = pts.findIndex((p) => p.t <= tNow[warp]);
  const cursor = rawCursor >= 0 ? rawCursor : pts.length - 1;
  const cursorX = pad.l + cursor * stepX;
  const cursorPrice = pts[cursor]?.price ?? min;
  const troughL = Math.max(0, pts.findIndex((p) => p.t <= 60));
  const troughR = Math.max(troughL, pts.findIndex((p) => p.t <= 45));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[130px] w-full">
      <defs>
        <linearGradient id="priceFillTripDetail" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#427fb0" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#427fb0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <text x="4" y={pad.t + 4} fontSize="9.5" fill="#9aa2b3">¥{Math.round(max / 1000)}k</text>
      <text x="4" y={pad.t + innerH} fontSize="9.5" fill="#9aa2b3">¥{Math.round(min / 1000)}k</text>
      <rect x={pad.l + troughL * stepX} y={pad.t} width={(troughR - troughL) * stepX} height={innerH} fill="rgba(34,197,94,0.12)" rx="4" />
      <path d={`${path} L ${pad.l + (pts.length - 1) * stepX} ${pad.t + innerH} L ${pad.l} ${pad.t + innerH} Z`} fill="url(#priceFillTripDetail)" />
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

function DecisionHero({
  dest,
  trip,
  maturity,
  lang,
}: {
  dest: Destination;
  trip: Trip;
  maturity: Maturity;
  lang: Lang;
}) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-aurora-900 via-aurora-800 to-ink-900 px-5 py-5 text-white shadow-sm sm:px-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
        {lang === "zh" ? "Aurora 的判断" : "Aurora's call"}
      </div>
      <p className="mt-3 max-w-4xl text-[20px] font-semibold leading-relaxed sm:text-[24px]">
        {getAuroraJudgment(dest, trip, maturity, lang)}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 text-[12px] text-white/78 sm:grid-cols-4">
        <HeroMetric label={lang === "zh" ? "建议窗口" : "Window"} value={formatDateRange(trip.startDate, trip.endDate, lang)} />
        <HeroMetric label={lang === "zh" ? "行程天数" : "Trip days"} value={formatDays(trip.days, lang)} />
        <HeroMetric label={lang === "zh" ? "需要年假" : "PTO needed"} value={formatPto(trip.ptoDays, lang)} />
        <HeroMetric label={lang === "zh" ? "预计预算" : "Budget"} value={`¥${trip.estimatedBudget.toLocaleString()}`} />
      </div>
    </section>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 px-3 py-2">
      <div>{label}</div>
      <div className="mt-1 text-[14px] font-semibold text-white">{value}</div>
    </div>
  );
}

function WindowDecisionSection({
  dest,
  trip,
  maturity,
  lang,
}: {
  dest: Destination;
  trip: Trip;
  maturity: Maturity;
  lang: Lang;
}) {
  const missRate = dest.missRate[maturity];
  const riskLevel = getRiskLevel(missRate);
  const riskCopy = getRiskCopy(riskLevel, lang);
  const riskClass =
    riskLevel === "low"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : riskLevel === "medium"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="rounded-2xl border hairline bg-ink-50/50 p-4 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
              {lang === "zh" ? "Aurora 给你的窗口建议" : "Recommended window"}
            </div>
            <h3 className="mt-1 text-[18px] font-semibold text-ink-900">
              {formatDateRange(trip.startDate, trip.endDate, lang)}
            </h3>
          </div>
          <div className="text-[12px] text-ink-500">
            {lang === "zh" ? "当前可参考宽度" : "Current range"}：{formatDays(getRangeDays(dest, maturity), lang)}
          </div>
        </div>
        <div className="mt-4">
          <WindowBarChart dest={dest} lang={lang} />
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-600">
          {lang === "zh"
            ? "每根柱子代表一天，越高说明越接近这次体验的理想窗口。这里先帮你看清楚“哪几天最值得请假”，不是让你读统计图。"
            : "Each bar is one day. Taller means closer to the ideal timing window, so you can see which days are worth taking PTO for."}
        </p>
      </div>

      <aside className={`rounded-2xl border p-5 ${riskClass}`}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
          {lang === "zh" ? "扑空风险" : "Miss risk"}
        </div>
        <div className="mt-2 flex items-end gap-2">
          <div className="text-[38px] font-semibold leading-none">{Math.round(missRate * 100)}%</div>
          <div className="pb-1 text-[14px] font-semibold">{riskCopy.label}</div>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed">{riskCopy.text}</p>
        <div className="mt-5 rounded-lg bg-white/55 px-3 py-2 text-[11.5px] leading-relaxed">
          {lang === "zh"
            ? "规则：0-15% 为较低，16-35% 为中等，36% 以上为较高。"
            : "Rule: 0-15% is low, 16-35% is medium, and 36%+ is high."}
        </div>
      </aside>
    </section>
  );
}

function SecondaryInfo({
  dest,
  trip,
  maturity,
  warp,
  lang,
}: {
  dest: Destination;
  trip: Trip;
  maturity: Maturity;
  warp: WarpStop;
  lang: Lang;
}) {
  return (
    <section className="mt-5 rounded-2xl border hairline bg-white">
      <div className="border-b hairline px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
          {lang === "zh" ? "其他你需要知道的" : "Other useful signals"}
        </div>
      </div>
      <InfoRow
        icon="💰"
        title={lang === "zh" ? "价格提醒" : "Price signal"}
        text={
          lang === "zh"
            ? "按历史价格看，T-60 到 T-45 通常更适合关注机票和酒店；临近窗口我会再提醒。"
            : "Historically, T-60 to T-45 is the better window to watch flights and hotels."
        }
      >
        <details className="mt-3 rounded-xl bg-ink-50 px-3 py-2">
          <summary className="cursor-pointer text-[11.5px] font-medium text-aurora-800">
            {lang === "zh" ? "看历史价格曲线" : "Show historical price curve"}
          </summary>
          <div className="mt-2">
            <PriceChart dest={dest} warp={warp} />
          </div>
        </details>
      </InfoRow>
      <InfoRow
        icon="🗓"
        title={lang === "zh" ? "请假可行性" : "Leave feasibility"}
        text={
          lang === "zh"
            ? `用 ${trip.ptoDays} 天年假换 ${trip.days} 天行程，借力 ${trip.holidayLeveraged} 天公共假期或周末。`
            : `${trip.ptoDays} PTO days can unlock a ${trip.days}-day trip with ${trip.holidayLeveraged} free days.`
        }
      />
      <InfoRow
        icon="⌁"
        title={lang === "zh" ? "计划成熟度" : "Plan maturity"}
        text={
          lang === "zh"
            ? `当前是 ${maturityLabel(maturity, lang)}。同一份计划会从 Sketch 到 Refining 再到 Ready，信息会越来越细。`
            : `Current state: ${maturityLabel(maturity, lang)}. The same plan matures from Sketch to Refining to Ready.`
        }
      />
      {trip.reminders?.length ? (
        <InfoRow
          icon="🔔"
          title={lang === "zh" ? "提醒安排" : "Reminder schedule"}
          text={
            lang === "zh"
              ? trip.reminders.map((item) => `${item.trigger} ${item.type}`).join(" / ")
              : trip.reminders.map((item) => `${item.trigger} ${item.type}`).join(" / ")
          }
        >
          <details className="mt-3 rounded-xl bg-ink-50 px-3 py-2">
            <summary className="cursor-pointer text-[11.5px] font-medium text-aurora-800">
              {lang === "zh" ? "展开提醒节点" : "Show reminder nodes"}
            </summary>
            <div className="mt-2 space-y-2">
              {trip.reminders.map((reminder) => (
                <div key={`${reminder.trigger}-${reminder.type}`} className="text-[11.5px] leading-relaxed text-ink-650">
                  <span className="font-semibold text-ink-900">{reminder.trigger}</span> · {reminder.date} · {reminder.message}
                </div>
              ))}
            </div>
          </details>
        </InfoRow>
      ) : null}
    </section>
  );
}

function InfoRow({
  icon,
  title,
  text,
  children,
}: {
  icon: string;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-b hairline px-5 py-4 last:border-b-0">
      <div className="flex gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-50 text-[15px]">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-ink-900">{title}</div>
          <div className="mt-1 text-[12.5px] leading-relaxed text-ink-600">{text}</div>
          {children}
        </div>
      </div>
    </div>
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
    <section className="mt-5 rounded-2xl border hairline bg-ink-50/40 p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
            {lang === "zh" ? "请假策略" : "Leave strategy"}
          </div>
          <div className="mt-1 text-[13px] text-ink-600">
            {lang === "zh"
              ? "下面是几种可比较的请假方案，你可以先选最适合沟通和执行的一种。"
              : "Compare a few PTO options and pick the one that is easiest to execute."}
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
              <div className="text-[11px] text-aurora-700">{formatPto(strategy.ptoDays, lang)}</div>
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
            <Metric label={lang === "zh" ? "旅行天数" : "Trip days"} value={formatDays(active.totalDays, lang)} />
            <Metric label={lang === "zh" ? "请年假" : "PTO"} value={formatDays(active.ptoDays, lang)} />
            <Metric label={lang === "zh" ? "节假日/周末" : "Free days"} value={formatDays(active.holidayDates.length, lang)} />
            <Metric label={lang === "zh" ? "冲突" : "Conflicts"} value={`${active.blockedConflicts.length}`} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-ink-500">
            <span><b className="text-aurora-700">■</b> {lang === "zh" ? "请年假" : "PTO"}</span>
            <span><b className="text-emerald-500">■</b> {lang === "zh" ? "公共假日/周末" : "Holiday/weekend"}</span>
            <span><b className="text-rose-500">■</b> {lang === "zh" ? "不可出行冲突" : "Blocked conflict"}</span>
          </div>
          <div className="mt-4 text-[11.5px] leading-relaxed text-ink-600">
            {lang === "zh"
              ? "后续可以把选中的方案保存下来，并接入真实票价、酒店和请假审批提醒。当前先把可比较的请假策略框架搭好。"
              : "Later, the selected option can be saved and connected to pricing, hotel, and approval reminders."}
          </div>
        </div>
      </div>
    </section>
  );
}

function DailyItinerarySection({
  lang,
  dest,
  trip,
}: {
  lang: Lang;
  dest: Destination;
  trip: Trip;
}) {
  const days = trip.dailyPlan?.length ? trip.dailyPlan : fallbackDailyPlan(dest, trip);
  const visible = days.slice(0, 5);

  return (
    <section className="mt-5 rounded-2xl border hairline bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
            {lang === "zh" ? "天粒度行程" : "Day-by-day plan"}
          </div>
          <div className="mt-1 text-[13px] text-ink-600">
            {lang === "zh"
              ? "先把每天要解决的问题列出来；临近出发时再继续细化天气、闭馆和备选方案。"
              : "Start with the daily structure; weather, closures, and backups get sharper near departure."}
          </div>
        </div>
        {days.length > visible.length && (
          <div className="text-[12px] text-ink-500">
            {lang === "zh" ? `先展示 ${visible.length}/${days.length} 天` : `Showing ${visible.length}/${days.length} days`}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {visible.map((day) => (
          <article key={`${day.day}-${day.date}`} className="rounded-xl border hairline bg-ink-50/45 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[14px] font-semibold text-ink-900">
                Day {day.day} · {formatShortDate(day.date)} · {day.dayOfWeek} · {day.city}
              </div>
              {day.weather && <div className="text-[11.5px] text-ink-500">⚠️ {day.weather}</div>}
            </div>
            <ul className="mt-3 space-y-1.5">
              {day.spots.map((spot) => (
                <li key={spot} className="flex gap-2 text-[12.5px] text-ink-750">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-aurora-500" />
                  <span>{spot}</span>
                </li>
              ))}
            </ul>
            {day.notes?.length ? (
              <div className="mt-3 space-y-1">
                {day.notes.map((note) => (
                  <div key={note} className="text-[11.5px] leading-relaxed text-ink-600">
                    💡 {note}
                  </div>
                ))}
              </div>
            ) : null}
            {day.backup && (
              <div className="mt-3 rounded-lg bg-white px-3 py-2 text-[11.5px] leading-relaxed text-ink-650">
                {lang === "zh" ? "备选：" : "Backup: "} {day.backup}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function TripWishlistSection({
  lang,
  dest,
  trip,
}: {
  lang: Lang;
  dest: Destination;
  trip: Trip;
}) {
  const items = trip.tripWishlist?.length ? trip.tripWishlist : fallbackTripWishlist(dest);

  return (
    <section className="mt-5 rounded-2xl border hairline bg-ink-50/40 p-4 sm:p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
        {lang === "zh" ? "本次行程心愿夹" : "Trip wishlist"}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        {items.map((item) => (
          <div key={`${item.name}-${item.day ?? "todo"}`} className="rounded-xl border hairline bg-white px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[13px] font-semibold text-ink-900">{item.name}</div>
                <div className="mt-1 text-[11.5px] text-ink-500">
                  {item.day
                    ? lang === "zh"
                      ? `已加入 Day ${item.day}`
                      : `Added to Day ${item.day}`
                    : lang === "zh"
                    ? "待加入"
                    : "Pending"}
                </div>
              </div>
              <span className="rounded-full bg-aurora-50 px-2 py-1 text-[10.5px] text-aurora-800">
                {item.added === "companion" ? (lang === "zh" ? "小精灵" : "Companion") : item.added === "user" ? (lang === "zh" ? "用户" : "User") : "Aurora"}
              </span>
            </div>
            {item.note && <div className="mt-2 text-[11.5px] leading-relaxed text-ink-600">“{item.note}”</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function TripView({ lang, destinationId, warp, trips, profile, onBack, onOpenPlanner }: Props) {
  const dest = getDestination(destinationId);
  const trip = trips.find((t) => t.destinationId === destinationId);
  if (!dest || !trip) return null;

  const maturity = trip.maturityOverride ?? maturityAt(warp, trip.startMonth);
  const leaveStrategies = generateLeaveStrategies(trip, profile);

  return (
    <section className="animate-fade-in overflow-hidden rounded-2xl border hairline bg-white shadow-[0_1px_2px_rgba(20,30,50,0.04)]">
      <div className="flex items-center justify-between gap-4 border-b hairline px-5 py-5 sm:px-7">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-ink-500 hover:text-ink-900">
          ← {lang === "zh" ? "返回年度视图" : "Back to year view"}
        </button>
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${maturityBg(maturity)} ${maturity !== "ready" ? "animate-pulse-soft" : ""}`} />
          <span className={`text-[11px] ${maturityColor(maturity)}`}>{maturityLabel(maturity, lang)}</span>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-7">
        <div className="mb-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
            {lang === "zh" ? "单次旅行精修" : "Trip refinement"}
          </div>
          <h2 className="mt-1 flex flex-wrap items-center gap-3 text-[26px] font-semibold tracking-tight text-ink-900">
            <span>{dest.flag}</span>
            {getTripDisplayTitle(dest, trip, lang)}
            <span className="text-base font-normal text-ink-500">· {dest.city}, {dest.country}</span>
          </h2>
          <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-ink-600">
            <span className="rounded-full bg-ink-50 px-3 py-1">{formatDateRange(trip.startDate, trip.endDate, lang)}</span>
            <span className="rounded-full bg-ink-50 px-3 py-1">{formatDays(trip.days, lang)}</span>
            <span className="rounded-full bg-ink-50 px-3 py-1">{lang === "zh" ? `需请 ${trip.ptoDays} 天` : `PTO ${trip.ptoDays}d`}</span>
          </div>
        </div>

        <DecisionHero dest={dest} trip={trip} maturity={maturity} lang={lang} />
        <WindowDecisionSection dest={dest} trip={trip} maturity={maturity} lang={lang} />
        <DailyItinerarySection lang={lang} dest={dest} trip={trip} />
        <TripWishlistSection lang={lang} dest={dest} trip={trip} />
        <LeaveStrategyPanel lang={lang} trip={trip} strategies={leaveStrategies} />
        <SecondaryInfo dest={dest} trip={trip} maturity={maturity} warp={warp} lang={lang} />

        <button
          onClick={onOpenPlanner}
          className="group mt-6 flex w-full items-center gap-3 rounded-xl border hairline px-5 py-3 text-left transition hover:bg-ink-50"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-ink-900 text-xs text-white transition group-hover:bg-aurora-700">
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-50 px-3 py-2">
      <div className="text-[10.5px] text-ink-500">{label}</div>
      <div className="mt-0.5 text-[14px] font-semibold text-ink-900">{value}</div>
    </div>
  );
}
