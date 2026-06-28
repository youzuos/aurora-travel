import type { Lang, Maturity } from "./types";

export type WarpStop = "year-start" | "t-90" | "t-30" | "t-14";

export const WARP_STOPS: Record<
  Lang,
  { key: WarpStop; label: string; sub: string; current: string }[]
> = {
  zh: [
    { key: "year-start", label: "年初", sub: "模糊概率区间", current: "当前位置：年初（所有行程仍在 sketch 阶段）" },
    { key: "t-90", label: "出发前 3 月", sub: "开始精修", current: "当前位置：出发前 3 月（最近行程开始收敛）" },
    { key: "t-30", label: "出发前 1 月", sub: "价格与体验校准", current: "当前位置：出发前 1 月（价格信号变得可用）" },
    { key: "t-14", label: "T-14", sub: "精准窗口", current: "当前位置：T-14（距离最近行程 14 天）" },
  ],
  en: [
    { key: "year-start", label: "Year start", sub: "Broad range", current: "Current: year start (all trips are still sketched)" },
    { key: "t-90", label: "3 mo before", sub: "Refinement starts", current: "Current: 3 months before departure (nearest trip begins to narrow)" },
    { key: "t-30", label: "1 mo before", sub: "Price and timing sync", current: "Current: 1 month before departure (price signals become useful)" },
    { key: "t-14", label: "T-14", sub: "Precise window", current: "Current: T-14 (14 days before nearest trip)" },
  ],
};

export const MONTH_LABELS: Record<Lang, string[]> = {
  zh: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export function maturityAt(warp: WarpStop, tripStartMonth: number): Maturity {
  const currentMonth: Record<WarpStop, number> = {
    "year-start": -1,
    "t-90": 1.5,
    "t-30": 2.6,
    "t-14": 3.6,
  };
  const monthsAhead = tripStartMonth - currentMonth[warp];
  if (monthsAhead <= 1) return "ready";
  if (monthsAhead <= 2.5) return "refining";
  return "sketched";
}

export function maturityColor(m: Maturity) {
  if (m === "ready") return "text-emerald-600";
  if (m === "refining") return "text-orange-600";
  return "text-amber-600";
}

export function maturityBg(m: Maturity) {
  if (m === "ready") return "bg-emerald-500";
  if (m === "refining") return "bg-orange-500";
  return "bg-amber-400";
}

export function maturityLabel(m: Maturity, lang: Lang) {
  if (lang === "en") {
    if (m === "ready") return "Ready";
    if (m === "refining") return "Refining";
    return "Sketch";
  }
  if (m === "ready") return "Ready";
  if (m === "refining") return "Refining";
  return "Sketch";
}

export function maturityCounts(tripMonths: number[], warp: WarpStop) {
  return tripMonths.reduce(
    (counts, month) => {
      counts[maturityAt(warp, month)] += 1;
      return counts;
    },
    { sketched: 0, refining: 0, ready: 0 } as Record<Maturity, number>
  );
}

export function aggregateStage(maturities: Maturity[]): Maturity {
  const score = maturities
    .map<number>((m) => (m === "sketched" ? 0 : m === "refining" ? 1 : 2))
    .reduce((a, b) => a + b, 0);
  const avg = score / Math.max(1, maturities.length);
  if (avg >= 1.5) return "ready";
  if (avg >= 0.7) return "refining";
  return "sketched";
}
