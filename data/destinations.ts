import type { Destination } from "@/lib/types";

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
    pts.push({ date: d.toISOString().slice(0, 10), p: Math.round(p * 1000) / 1000 });
  }
  return pts;
}

function buildPriceCurve(min: number, max: number, troughT = 50) {
  const pts: { t: number; price: number }[] = [];
  for (let t = 365; t >= 0; t -= 5) {
    const farFactor = 1 / (1 + Math.exp(-(t - troughT - 60) / 30));
    const nearFactor = 1 / (1 + Math.exp((t - 14) / 6));
    const dipFactor =
      1 -
      Math.exp(-((t - troughT) * (t - troughT)) / (2 * 30 * 30)) * 0.45;
    const base = min + (max - min) * (farFactor * 0.6 + dipFactor * 0.4);
    pts.push({ t, price: Math.round(base + (max - min) * 0.55 * nearFactor) });
  }
  return pts;
}

export const DESTINATIONS: Destination[] = [
  {
    id: "iceland-aurora",
    flag: "🇮🇸",
    city: "Reykjavik",
    country: "Iceland",
    experience: "冰岛极光",
    experienceEn: "Iceland northern lights",
    experienceEmoji: "🌌",
    peakMonth: 2,
    bestMonths: [1, 2, 3, 10, 11, 12],
    remoteRangeDays: 35,
    refinedRangeDays: 12,
    confirmedRangeDays: 3,
    peakCurve: buildPeakCurve(2026, 2, 18, 10, 60),
    priceCurve: buildPriceCurve(5800, 11200, 55),
    missRate: { sketched: 0.42, refining: 0.21, ready: 0.07 },
    story: "极光体验依赖云量、太阳活动和夜间天气，适合持续追踪并临近收敛。",
    storyEn: "Aurora trips depend on cloud cover, solar activity, and night weather, so the window should narrow over time.",
    tint: "indigo",
    liveData: true,
  },
  {
    id: "kyoto-sakura",
    flag: "🇯🇵",
    city: "Kyoto",
    country: "Japan",
    experience: "京都樱花",
    experienceEn: "Kyoto cherry blossoms",
    experienceEmoji: "🌸",
    peakMonth: 4,
    bestMonths: [3, 4],
    remoteRangeDays: 28,
    refinedRangeDays: 9,
    confirmedRangeDays: 4,
    peakCurve: buildPeakCurve(2026, 4, 2, 6, 50),
    priceCurve: buildPriceCurve(3200, 6800, 50),
    missRate: { sketched: 0.36, refining: 0.14, ready: 0.05 },
    story: "花期每年受气温影响，远期只给概率区间，临近再锁定精确窗口。",
    storyEn: "Bloom timing shifts with temperature, so far-out planning should show probability first.",
    tint: "rose",
  },
  {
    id: "xinjiang-poplar",
    flag: "🇨🇳",
    city: "Kanas",
    country: "China",
    experience: "新疆胡杨秋色",
    experienceEn: "Xinjiang poplar autumn",
    experienceEmoji: "🍂",
    peakMonth: 10,
    bestMonths: [9, 10],
    remoteRangeDays: 22,
    refinedRangeDays: 10,
    confirmedRangeDays: 5,
    peakCurve: buildPeakCurve(2026, 10, 18, 7, 50),
    priceCurve: buildPriceCurve(2600, 4900, 55),
    missRate: { sketched: 0.32, refining: 0.15, ready: 0.06 },
    story: "秋色窗口短，且容易和国庆预算、请假资源竞争。",
    storyEn: "The autumn color window is short and often competes with National Day budgets and PTO.",
    tint: "amber",
  },
  {
    id: "changbai-tianchi",
    flag: "🇨🇳",
    city: "Changbai Mountain",
    country: "China",
    experience: "长白山天池",
    experienceEn: "Changbai Mountain Tianchi",
    experienceEmoji: "🏔️",
    peakMonth: 7,
    bestMonths: [6, 7, 8, 9],
    remoteRangeDays: 30,
    refinedRangeDays: 12,
    confirmedRangeDays: 5,
    peakCurve: buildPeakCurve(2026, 7, 22, 9, 55),
    priceCurve: buildPriceCurve(1600, 3100, 45),
    missRate: { sketched: 0.65, refining: 0.42, ready: 0.28 },
    story: "天池受天气影响很大，需要把备选坡口和补偿玩法提前放进计划。",
    storyEn: "Tianchi is weather-sensitive, so backup routes and activities should be planned early.",
    tint: "emerald",
  },
  {
    id: "mohe-aurora",
    flag: "🇨🇳",
    city: "Mohe",
    country: "China",
    experience: "漠河北极村极光",
    experienceEn: "Mohe aurora",
    experienceEmoji: "🌃",
    peakMonth: 11,
    bestMonths: [11, 12, 1],
    remoteRangeDays: 40,
    refinedRangeDays: 14,
    confirmedRangeDays: 3,
    peakCurve: buildPeakCurve(2026, 11, 20, 12, 60),
    priceCurve: buildPriceCurve(2100, 4200, 50),
    missRate: { sketched: 0.55, refining: 0.31, ready: 0.12 },
    story: "冬季窗口清晰，但低温、交通和无长假约束需要提前评估。",
    storyEn: "The winter window is clear, but low temperatures, transport, and limited holidays need early evaluation.",
    tint: "aurora",
    liveData: true,
  },
  {
    id: "wuhan-sakura",
    flag: "🇨🇳",
    city: "Wuhan",
    country: "China",
    experience: "武汉东湖樱花",
    experienceEn: "Wuhan East Lake blossoms",
    experienceEmoji: "🌸",
    peakMonth: 3,
    bestMonths: [3],
    remoteRangeDays: 26,
    refinedRangeDays: 8,
    confirmedRangeDays: 3,
    peakCurve: buildPeakCurve(2026, 3, 22, 5, 45),
    priceCurve: buildPriceCurve(900, 2400, 35),
    missRate: { sketched: 0.48, refining: 0.18, ready: 0.06 },
    story: "短途赏花容错率低，适合把机票价格和花期预报一起看。",
    storyEn: "A short blossom trip has little room for error, so forecasts and airfare should be tracked together.",
    tint: "rose",
  },
  {
    id: "hokkaido-powder",
    flag: "🇯🇵",
    city: "Niseko",
    country: "Japan",
    experience: "北海道粉雪",
    experienceEn: "Hokkaido powder snow",
    experienceEmoji: "❄️",
    peakMonth: 1,
    bestMonths: [1, 2],
    remoteRangeDays: 50,
    refinedRangeDays: 18,
    confirmedRangeDays: 7,
    peakCurve: buildPeakCurve(2026, 1, 20, 14, 60),
    priceCurve: buildPriceCurve(3800, 7200, 60),
    missRate: { sketched: 0.22, refining: 0.1, ready: 0.04 },
    story: "雪季窗口较宽，但酒店与机票越临近越贵。",
    storyEn: "The snow window is wider, but hotels and flights rise quickly as departure approaches.",
    tint: "aurora",
  },
  {
    id: "norway-whale",
    flag: "🇳🇴",
    city: "Tromso",
    country: "Norway",
    experience: "挪威观鲸",
    experienceEn: "Norway whale watching",
    experienceEmoji: "🐋",
    peakMonth: 11,
    bestMonths: [11, 12, 1],
    remoteRangeDays: 40,
    refinedRangeDays: 16,
    confirmedRangeDays: 7,
    peakCurve: buildPeakCurve(2026, 11, 25, 13, 60),
    priceCurve: buildPriceCurve(7200, 12800, 60),
    missRate: { sketched: 0.4, refining: 0.18, ready: 0.08 },
    story: "观鲸与极光常竞争同一冬季长假窗口，需要组合优化取舍。",
    storyEn: "Whale watching and aurora trips often compete for the same winter holiday window.",
    tint: "ink",
  },
];

export function getDestination(id: string) {
  return DESTINATIONS.find((d) => d.id === id);
}
