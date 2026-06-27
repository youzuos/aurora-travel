import type { Destination } from "@/lib/types";

/**
 * 围绕峰值日生成对称概率曲线（高斯近似），用于花期/极光区间概率可视化。
 */
function buildPeakCurve(
  year: number,
  peakMonth: number,
  peakDay: number,
  sigmaDays: number,
  spanDays = 60
) {
  const peak = new Date(Date.UTC(year, peakMonth - 1, peakDay));
  const pts: { date: string; p: number }[] = [];
  for (let offset = -spanDays / 2; offset <= spanDays / 2; offset++) {
    const d = new Date(peak);
    d.setUTCDate(d.getUTCDate() + offset);
    const p = Math.exp(-(offset * offset) / (2 * sigmaDays * sigmaDays));
    pts.push({
      date: d.toISOString().slice(0, 10),
      p: Math.round(p * 1000) / 1000,
    });
  }
  return pts;
}

/**
 * 价格曲线：模拟真实机票"先贵→T-60～45 触底→T-7 再回升"形态。
 * 输入历史最低价、最高价、谷底位置（days before departure）。
 */
function buildPriceCurve(min: number, max: number, troughT = 50) {
  const pts: { t: number; price: number }[] = [];
  for (let t = 365; t >= 0; t -= 5) {
    // Two regimes: far-future plateau higher, then dip at troughT, then climb steeply <T-14
    const farFactor = 1 / (1 + Math.exp(-(t - troughT - 60) / 30)); // 0→1 as t grows past trough
    const nearFactor = 1 / (1 + Math.exp((t - 14) / 6)); // 0→1 as t shrinks below 14
    const dipFactor =
      1 -
      Math.exp(-((t - troughT) * (t - troughT)) / (2 * 30 * 30)) * 0.45;
    const base = min + (max - min) * (farFactor * 0.6 + dipFactor * 0.4);
    const price = Math.round(base + (max - min) * 0.55 * nearFactor);
    pts.push({ t, price });
  }
  return pts;
}

export const DESTINATIONS: Destination[] = [
  {
    id: "iceland-aurora",
    flag: "🇮🇸",
    city: "Reykjavík",
    country: "Iceland",
    experience: "Northern Lights",
    experienceEmoji: "🌌",
    peakMonth: 2,
    remoteRangeDays: 35,
    refinedRangeDays: 12,
    confirmedRangeDays: 3,
    peakCurve: buildPeakCurve(2026, 2, 18, 10, 60),
    priceCurve: buildPriceCurve(5800, 11200, 55),
    missRate: { sketched: 0.42, refining: 0.21, ready: 0.07 },
    story: "国际共鸣最高，NOAA SWPC 数据可现场拉真实 Kp 值。",
    tint: "indigo",
    liveData: true,
  },
  {
    id: "mohe-aurora",
    flag: "🇨🇳",
    city: "漠河",
    country: "China",
    experience: "极光 · 北极村",
    experienceEmoji: "🌠",
    peakMonth: 11,
    remoteRangeDays: 40,
    refinedRangeDays: 14,
    confirmedRangeDays: 3,
    peakCurve: buildPeakCurve(2026, 11, 20, 12, 60),
    priceCurve: buildPriceCurve(2100, 4200, 50),
    missRate: { sketched: 0.55, refining: 0.31, ready: 0.12 },
    story: "用户原话：「11/12 月没有长假期，想去漠河看极光」——本土原型案例。",
    tint: "aurora",
    liveData: true,
  },
  {
    id: "kyoto-sakura",
    flag: "🇯🇵",
    city: "京都",
    country: "Japan",
    experience: "樱花满开",
    experienceEmoji: "🌸",
    peakMonth: 4,
    remoteRangeDays: 28,
    refinedRangeDays: 9,
    confirmedRangeDays: 4,
    peakCurve: buildPeakCurve(2026, 4, 2, 6, 50),
    priceCurve: buildPriceCurve(3200, 6800, 50),
    missRate: { sketched: 0.36, refining: 0.14, ready: 0.05 },
    story: "国际知名度高，气象厅历史花期数据稳定。",
    tint: "rose",
  },
  {
    id: "wuhan-sakura",
    flag: "🇨🇳",
    city: "武汉",
    country: "China",
    experience: "东湖樱花",
    experienceEmoji: "🌸",
    peakMonth: 3,
    remoteRangeDays: 26,
    refinedRangeDays: 8,
    confirmedRangeDays: 3,
    peakCurve: buildPeakCurve(2026, 3, 22, 5, 45),
    priceCurve: buildPriceCurve(900, 2400, 35),
    missRate: { sketched: 0.48, refining: 0.18, ready: 0.06 },
    story: "调研真实故事：「5 天假飞武汉看樱花，到了发现花期已经过了」——HOOK。",
    tint: "rose",
  },
  {
    id: "xinjiang-poplar",
    flag: "🇨🇳",
    city: "新疆 · 喀纳斯",
    country: "China",
    experience: "胡杨秋色",
    experienceEmoji: "🍂",
    peakMonth: 10,
    remoteRangeDays: 22,
    refinedRangeDays: 10,
    confirmedRangeDays: 5,
    peakCurve: buildPeakCurve(2026, 10, 18, 7, 50),
    priceCurve: buildPriceCurve(2600, 4900, 55),
    missRate: { sketched: 0.32, refining: 0.15, ready: 0.06 },
    story: "用户对话原句：「我想加上新疆胡杨」——Chat 持续修改入口。",
    tint: "amber",
  },
  {
    id: "hokkaido-powder",
    flag: "🇯🇵",
    city: "北海道",
    country: "Japan",
    experience: "粉雪 · Niseko",
    experienceEmoji: "❄️",
    peakMonth: 1,
    remoteRangeDays: 50,
    refinedRangeDays: 18,
    confirmedRangeDays: 7,
    peakCurve: buildPeakCurve(2026, 1, 20, 14, 60),
    priceCurve: buildPriceCurve(3800, 7200, 60),
    missRate: { sketched: 0.22, refining: 0.1, ready: 0.04 },
    story: "雪期窗口宽，可靠预测更早；展示「不同体验时钟」的好对比。",
    tint: "aurora",
  },
  {
    id: "changbai-tianchi",
    flag: "🇨🇳",
    city: "长白山",
    country: "China",
    experience: "天池",
    experienceEmoji: "🏔️",
    peakMonth: 7,
    remoteRangeDays: 30,
    refinedRangeDays: 12,
    confirmedRangeDays: 5,
    peakCurve: buildPeakCurve(2026, 7, 22, 9, 55),
    priceCurve: buildPriceCurve(1600, 3100, 45),
    missRate: { sketched: 0.65, refining: 0.42, ready: 0.28 },
    story: "用户原话：「南北西三个坡都上了，愣是上不去天池」——扑空率展示用例。",
    tint: "emerald",
  },
  {
    id: "norway-whale",
    flag: "🇳🇴",
    city: "Tromsø",
    country: "Norway",
    experience: "看鲸",
    experienceEmoji: "🐋",
    peakMonth: 11,
    remoteRangeDays: 40,
    refinedRangeDays: 16,
    confirmedRangeDays: 7,
    peakCurve: buildPeakCurve(2026, 11, 25, 13, 60),
    priceCurve: buildPriceCurve(7200, 12800, 60),
    missRate: { sketched: 0.4, refining: 0.18, ready: 0.08 },
    story: "可选目的地：与冰岛极光竞争同一年假窗口，组合优化的取舍样本。",
    tint: "ink",
  },
];

export function getDestination(id: string) {
  return DESTINATIONS.find((d) => d.id === id);
}
