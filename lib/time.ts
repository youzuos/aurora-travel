/**
 * 时间快进位置（相对 demo 起点的"位置"，不是真实当下时间）。
 * 在 PRD 第 8 节的 3 段叙事里：
 *   - "year-start": 年初，所有 trip 都 🔴
 *   - "t-90":       距下趟旅行 ~90 天，🔴→🟡
 *   - "t-60":       距下趟 ~60 天，价格 Agent 主动推送，🟡 但价格信号就绪
 *   - "t-14":       距下趟 ~14 天，体验时钟收敛，🟢 ready
 */
export type WarpStop = "year-start" | "t-90" | "t-60" | "t-14";

export const WARP_STOPS: { key: WarpStop; label: string; sub: string }[] = [
  { key: "year-start", label: "年初", sub: "2026-01-05" },
  { key: "t-90", label: "+2 月", sub: "T-90 距樱花" },
  { key: "t-60", label: "+3 月", sub: "T-60 价格信号" },
  { key: "t-14", label: "+4 月", sub: "T-14 峰值锁定" },
];

import type { Maturity } from "./types";

/**
 * 给定 warp 位置 + trip 起飞月，决定该 trip 当下的成熟度。
 * 离当前点越近 → 越成熟。
 *
 * 与 PRD 第 8 节 3 段叙事对齐：
 *  - year-start：所有 trip 均 🔴（远期给概率，不假装精确）
 *  - +2 月 (T-90)：花期最早的一段开始 🟡，远期的仍 🔴
 *  - +3 月 (T-60)：价格 Agent 主动推送，🟡 + 价格信号
 *  - +4 月 (T-14)：体验时钟收敛 → 🟢
 */
export function maturityAt(
  warp: WarpStop,
  tripStartMonth: number
): Maturity {
  const currentMonth: Record<WarpStop, number> = {
    "year-start": -1, // 假想为 2025-12 视角，让所有 trip 都"远期"
    "t-90": 1.5,
    "t-60": 2.5,
    "t-14": 3.5,
  };
  const monthsAhead = tripStartMonth - currentMonth[warp];
  if (monthsAhead <= 1) return "ready";
  if (monthsAhead <= 2.5) return "refining";
  return "sketched";
}

export function maturityColor(m: Maturity) {
  return m === "ready"
    ? "text-emerald-600"
    : m === "refining"
    ? "text-amber-600"
    : "text-rose-500";
}

export function maturityBg(m: Maturity) {
  return m === "ready"
    ? "bg-emerald-500"
    : m === "refining"
    ? "bg-amber-500"
    : "bg-rose-400";
}

export function maturityLabel(m: Maturity) {
  return m === "ready"
    ? "🟢 已就绪"
    : m === "refining"
    ? "🟡 待精修"
    : "🔴 数据更新中";
}

/**
 * 视图顶部的成长指示器：●○○ → ○●○ → ○○●
 * 取所有 trip 成熟度的平均阶段。
 */
export function aggregateStage(
  maturities: Maturity[]
): "sketched" | "refining" | "ready" {
  const score = maturities
    .map((m) => (m === "sketched" ? 0 : m === "refining" ? 1 : 2))
    .reduce((a, b) => a + b, 0);
  const avg = score / Math.max(1, maturities.length);
  if (avg >= 1.5) return "ready";
  if (avg >= 0.7) return "refining";
  return "sketched";
}

export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
