"use client";

import { DESTINATIONS, getDestination } from "@/data/destinations";
import { INITIAL_TRIPS } from "@/data/plan";
import {
  maturityAt,
  maturityBg,
  maturityColor,
  maturityLabel,
  type WarpStop,
} from "@/lib/time";
import type { Destination, Maturity, Trip } from "@/lib/types";

interface Props {
  destinationId: string;
  warp: WarpStop;
  onBack: () => void;
  onOpenChat: () => void;
}

function PeakChart({
  dest,
  maturity,
}: {
  dest: Destination;
  maturity: Maturity;
}) {
  const W = 560;
  const H = 130;
  const pad = { l: 14, r: 14, t: 14, b: 22 };
  const pts = dest.peakCurve;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const stepX = innerW / (pts.length - 1);

  const peakIdx = pts.reduce(
    (best, p, i) => (p.p > pts[best].p ? i : best),
    0
  );
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

  const area = `${path} L ${pad.l + (pts.length - 1) * stepX} ${
    pad.t + innerH
  } L ${pad.l} ${pad.t + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[130px]">
      <defs>
        <linearGradient id="peakFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#427fb0" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#427fb0" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* confidence band */}
      <rect
        x={pad.l + lo * stepX}
        y={pad.t}
        width={(hi - lo) * stepX}
        height={innerH}
        fill={
          maturity === "ready"
            ? "rgba(34,197,94,0.10)"
            : maturity === "refining"
            ? "rgba(234,179,8,0.10)"
            : "rgba(244,114,114,0.08)"
        }
        rx="6"
      />
      <path d={area} fill="url(#peakFill)" />
      <path d={path} fill="none" stroke="#306694" strokeWidth="1.6" />
      {/* peak marker */}
      <line
        x1={pad.l + peakIdx * stepX}
        x2={pad.l + peakIdx * stepX}
        y1={pad.t}
        y2={pad.t + innerH}
        stroke="#306694"
        strokeWidth="1"
        strokeDasharray="2 3"
        opacity="0.55"
      />
      <circle
        cx={pad.l + peakIdx * stepX}
        cy={pad.t + innerH * (1 - pts[peakIdx].p)}
        r="3"
        fill="#306694"
      />
      {/* x-axis labels */}
      <text
        x={pad.l + lo * stepX}
        y={H - 6}
        fontSize="9.5"
        fill="#737c8e"
      >
        {pts[lo].date.slice(5)}
      </text>
      <text
        x={pad.l + peakIdx * stepX}
        y={H - 6}
        fontSize="9.5"
        fill="#306694"
        fontWeight="600"
        textAnchor="middle"
      >
        peak {pts[peakIdx].date.slice(5)}
      </text>
      <text
        x={pad.l + hi * stepX}
        y={H - 6}
        fontSize="9.5"
        fill="#737c8e"
        textAnchor="end"
      >
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
      const y =
        pad.t + innerH * (1 - (p.price - min) / Math.max(1, max - min));
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  // current cursor along the price curve based on warp
  const tNow: Record<WarpStop, number> = {
    "year-start": 300,
    "t-90": 90,
    "t-60": 60,
    "t-14": 14,
  };
  const cursor = pts.findIndex((p) => p.t <= tNow[warp]);
  const cursorX = pad.l + Math.max(0, cursor) * stepX;
  const cursorPrice = pts[Math.max(0, cursor)].price;

  // trough zone (T-60~45)
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
      {/* y-axis price gridlines */}
      <text x="4" y={pad.t + 4} fontSize="9.5" fill="#9aa2b3">
        ¥{Math.round(max / 1000)}k
      </text>
      <text x="4" y={pad.t + innerH} fontSize="9.5" fill="#9aa2b3">
        ¥{Math.round(min / 1000)}k
      </text>
      {/* trough zone */}
      <rect
        x={pad.l + troughL * stepX}
        y={pad.t}
        width={(troughR - troughL) * stepX}
        height={innerH}
        fill="rgba(34,197,94,0.12)"
        rx="4"
      />
      <text
        x={pad.l + ((troughL + troughR) / 2) * stepX}
        y={pad.t + 11}
        fontSize="9"
        fill="#157f3e"
        textAnchor="middle"
        fontWeight="600"
      >
        ◀ 锁价窗口 T-60~45 ▶
      </text>
      <path d={`${path} L ${pad.l + (pts.length - 1) * stepX} ${pad.t + innerH} L ${pad.l} ${pad.t + innerH} Z`} fill="url(#priceFill)" />
      <path d={path} fill="none" stroke="#306694" strokeWidth="1.6" />
      {/* cursor */}
      <line
        x1={cursorX}
        x2={cursorX}
        y1={pad.t}
        y2={pad.t + innerH}
        stroke="#1c1f26"
        strokeWidth="1"
      />
      <circle cx={cursorX} cy={pad.t + 6} r="3.2" fill="#1c1f26" />
      <text
        x={cursorX + 6}
        y={pad.t + 10}
        fontSize="10"
        fill="#1c1f26"
        fontWeight="600"
      >
        ¥{cursorPrice.toLocaleString()}
      </text>
      {/* x-axis */}
      <text x={pad.l} y={H - 6} fontSize="9.5" fill="#737c8e">
        T-365
      </text>
      <text
        x={pad.l + innerW}
        y={H - 6}
        fontSize="9.5"
        fill="#737c8e"
        textAnchor="end"
      >
        T-0
      </text>
    </svg>
  );
}

function HolidayLeverage({ trip }: { trip: Trip }) {
  const total = trip.days;
  const pto = trip.ptoDays;
  const holiday = trip.holidayLeveraged;
  const ptoPct = (pto / total) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500 font-medium">
          拼假杠杆
        </div>
        <div className="text-[12px] text-ink-700">
          {pto} 天 PTO ×{" "}
          <span className="text-emerald-700 font-semibold">
            {(total / pto).toFixed(1)}
          </span>{" "}
          = {total} 天假期
        </div>
      </div>
      <div className="flex h-7 rounded-lg overflow-hidden border hairline">
        <div
          className="bg-aurora-600 text-white text-[10.5px] grid place-items-center font-medium"
          style={{ width: `${ptoPct}%` }}
        >
          PTO · {pto}d
        </div>
        <div
          className="bg-emerald-100 text-emerald-800 text-[10.5px] grid place-items-center font-medium"
          style={{ width: `${100 - ptoPct}%` }}
        >
          法定假期 · {holiday}d
        </div>
      </div>
    </div>
  );
}

export default function TripView({
  destinationId,
  warp,
  onBack,
  onOpenChat,
}: Props) {
  const dest = getDestination(destinationId);
  const trip = INITIAL_TRIPS.find((t) => t.destinationId === destinationId);
  if (!dest || !trip) return null;
  const m = maturityAt(warp, trip.startMonth);
  const missRate = dest.missRate[m];

  return (
    <div className="rounded-2xl border hairline bg-white shadow-[0_1px_2px_rgba(20,30,50,0.04)] overflow-hidden animate-fade-in">
      <div className="px-7 py-5 border-b hairline flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-[12px] text-ink-500 hover:text-ink-900 flex items-center gap-1.5"
        >
          ← Back to Year View
        </button>
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${maturityBg(m)} ${
              m !== "ready" ? "animate-pulse-soft" : ""
            }`}
          />
          <span className={`text-[11px] ${maturityColor(m)}`}>
            {maturityLabel(m)}
          </span>
        </div>
      </div>

      <div className="px-7 py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-ink-500">
              Trip View
            </div>
            <h2 className="text-[26px] font-semibold tracking-tight text-ink-900 mt-1 flex items-center gap-3">
              <span>{dest.flag}</span>
              {dest.experience}
              <span className="text-base font-normal text-ink-500">
                · {dest.city}, {dest.country}
              </span>
            </h2>
            <div className="text-[12.5px] text-ink-600 mt-1.5 max-w-xl">
              {dest.story}
            </div>
          </div>
          {dest.liveData && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border hairline bg-emerald-50 text-emerald-700 text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75" />
                <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              NOAA SWPC · live Kp data
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Peak window */}
          <div className="rounded-xl border hairline p-4 bg-ink-50/40">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500 font-medium">
                体验时钟 · 峰值概率
              </div>
              <div className="text-[11px] text-ink-500">
                区间宽度{" "}
                <span className="text-ink-900 font-semibold">
                  {m === "ready"
                    ? dest.confirmedRangeDays
                    : m === "refining"
                    ? dest.refinedRangeDays
                    : dest.remoteRangeDays}{" "}
                  天
                </span>
              </div>
            </div>
            <PeakChart dest={dest} maturity={m} />
            <div className="mt-2 text-[11.5px] text-ink-600 flex items-center justify-between">
              <span>
                {m === "sketched"
                  ? "远期 · 给概率，不给精确日期"
                  : m === "refining"
                  ? "区间正在收窄"
                  : "峰值锁定 · 可下单"}
              </span>
              <span className="text-rose-500">
                扑空率{" "}
                <span className="font-semibold">
                  {(missRate * 100).toFixed(0)}%
                </span>
              </span>
            </div>
          </div>

          {/* Price curve */}
          <div className="rounded-xl border hairline p-4 bg-ink-50/40">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500 font-medium">
                订票时钟 · 历史价格
              </div>
              <div className="text-[11px] text-ink-500">
                3 年均值 · 预置数据
              </div>
            </div>
            <PriceChart dest={dest} warp={warp} />
            <div className="mt-2 text-[11.5px] text-ink-600">
              {warp === "year-start" || warp === "t-90"
                ? "T-60~45 是历史价格谷底，等价格 Agent 提醒"
                : warp === "t-60"
                ? "✦ 价格 Agent：接近 3 年最低，建议 7 天内锁价"
                : "T-14 后价格陡升，已在锁价窗口内"}
            </div>
          </div>

          <div className="rounded-xl border hairline p-4 bg-ink-50/40">
            <HolidayLeverage trip={trip} />
            <div className="mt-3 text-[11.5px] text-ink-600">
              假期 Agent 把法定假期组合成最划算请假 — 强本地化壁垒。
            </div>
          </div>

          <div className="rounded-xl border hairline p-4 bg-ink-50/40">
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500 font-medium">
              成熟度时间线
            </div>
            <div className="mt-3 flex items-center gap-3">
              <StagePill stage="sketched" active={m === "sketched"} />
              <span className="text-ink-300">→</span>
              <StagePill stage="refining" active={m === "refining"} />
              <span className="text-ink-300">→</span>
              <StagePill stage="ready" active={m === "ready"} />
            </div>
            <div className="mt-3 text-[11.5px] text-ink-600">
              同一份计划，三种细节层级 — 不让你「选模式」。
            </div>
          </div>
        </div>

        {/* embedded chat hint */}
        <button
          onClick={onOpenChat}
          className="mt-6 w-full rounded-xl border hairline px-5 py-3 text-left hover:bg-ink-50 transition flex items-center gap-3 group"
        >
          <span className="h-7 w-7 rounded-md bg-ink-900 text-white text-xs grid place-items-center group-hover:bg-aurora-700 transition">
            ✦
          </span>
          <span className="text-[12.5px] text-ink-600">
            想改这趟？例如：「我想把出发提前到清明前一周」、「再加上新疆胡杨」…
          </span>
          <span className="ml-auto text-[11px] text-ink-400">
            Chat · Cmd+K
          </span>
        </button>
      </div>
    </div>
  );
}

function StagePill({
  stage,
  active,
}: {
  stage: Maturity;
  active: boolean;
}) {
  const label =
    stage === "sketched"
      ? "🔴 Sketched"
      : stage === "refining"
      ? "🟡 Refining"
      : "🟢 Ready";
  return (
    <span
      className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
        active
          ? "bg-aurora-700 text-white border-aurora-700"
          : "bg-white text-ink-500 border-ink-200"
      }`}
    >
      {label}
    </span>
  );
}
