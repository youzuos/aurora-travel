import { DESTINATIONS } from "@/data/destinations";
import { addDays } from "@/lib/calendar";
import type {
  AgentFinding,
  DeferredTrip,
  Destination,
  GeneratedPlan,
  PlanProfile,
  Trip,
  WishlistItem,
  WishlistPriorityLabel,
} from "@/lib/types";

export const PRIORITY_SCORE: Record<WishlistPriorityLabel, 1 | 2 | 3> = {
  必去: 3,
  想去: 2,
  随缘: 1,
};

const KEYWORDS: Record<string, string[]> = {
  "kyoto-sakura": ["京都", "日本", "樱花", "sakura", "cherry", "kyoto", "japan"],
  "wuhan-sakura": ["武汉", "东湖", "樱花", "wuhan", "cherry"],
  "iceland-aurora": ["冰岛", "极光", "aurora", "northern", "iceland"],
  "mohe-aurora": ["漠河", "北极村", "极光", "mohe"],
  "xinjiang-poplar": ["新疆", "胡杨", "喀纳斯", "秋色", "poplar", "xinjiang", "kanas"],
  "changbai-tianchi": ["长白山", "天池", "changbai", "tianchi"],
  "hokkaido-powder": ["北海道", "粉雪", "滑雪", "hokkaido", "niseko", "snow"],
  "norway-whale": ["挪威", "观鲸", "鲸", "norway", "whale", "tromso"],
};

const HOLIDAY_LEVERAGE: Record<number, { pto: number; holiday: number; note: string; noteEn: string }> = {
  1: { pto: 4, holiday: 3, note: "元旦前后可拼短假。", noteEn: "New Year can support a short bridge." },
  2: { pto: 6, holiday: 2, note: "春节尾段适合远途。", noteEn: "Late Spring Festival works for long-haul trips." },
  3: { pto: 2, holiday: 1, note: "适合短途赏花。", noteEn: "Good for short blossom trips." },
  4: { pto: 3, holiday: 3, note: "清明可覆盖花期窗口。", noteEn: "Qingming can cover bloom windows." },
  5: { pto: 3, holiday: 2, note: "劳动节窗口拥挤，需要控制预算。", noteEn: "Labor Day is crowded, budget carefully." },
  6: { pto: 1, holiday: 3, note: "端午适合国内短途。", noteEn: "Dragon Boat works for domestic short trips." },
  7: { pto: 3, holiday: 0, note: "暑期主要消耗年假。", noteEn: "Summer mostly consumes PTO." },
  8: { pto: 3, holiday: 0, note: "暑期价格偏高，适合刚需目的地。", noteEn: "Summer is pricier; use only when needed." },
  9: { pto: 2, holiday: 1, note: "中秋可做秋季短途。", noteEn: "Mid-Autumn supports short autumn trips." },
  10: { pto: 4, holiday: 3, note: "国庆窗口强，但价格竞争激烈。", noteEn: "National Day is strong but expensive." },
  11: { pto: 4, holiday: 0, note: "冬季远途需要完整年假。", noteEn: "Winter long-haul requires pure PTO." },
  12: { pto: 4, holiday: 0, note: "年底适合低峰错峰。", noteEn: "Year-end can work for off-peak travel." },
};

export function createWishlistItem(
  label: string,
  priorityLabel: WishlistPriorityLabel = "想去",
  source: WishlistItem["source"] = "user"
): WishlistItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: label.trim(),
    priorityLabel,
    priorityScore: PRIORITY_SCORE[priorityLabel],
    source,
  };
}

export function normalizeWishlistItems(profile: PlanProfile): WishlistItem[] {
  if (profile.wishlistItems?.length) {
    return profile.wishlistItems
      .filter((item) => item.label.trim())
      .map((item) => ({
        ...item,
        priorityScore: PRIORITY_SCORE[item.priorityLabel] ?? item.priorityScore ?? 2,
      }));
  }

  return profile.wishlist
    .split(/[,\n，、；;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((label, index) => ({
      id: `legacy-${index}`,
      label,
      priorityLabel: "想去" as const,
      priorityScore: 2 as const,
      source: "legacy" as const,
    }));
}

function minPrice(dest: Destination) {
  return Math.min(...dest.priceCurve.map((p) => p.price));
}

function scorePhraseForDestination(phrase: string, dest: Destination) {
  const lower = phrase.toLowerCase();
  const keywordScore = (KEYWORDS[dest.id] ?? []).reduce(
    (score, keyword) => score + (lower.includes(keyword.toLowerCase()) ? 1 : 0),
    0
  );
  const nameScore =
    lower.includes(dest.city.toLowerCase()) ||
    lower.includes(dest.country.toLowerCase()) ||
    lower.includes(dest.experience.toLowerCase()) ||
    lower.includes(dest.experienceEn.toLowerCase())
      ? 2
      : 0;
  return keywordScore + nameScore;
}

function matchWishlistItem(item: WishlistItem) {
  return DESTINATIONS.map((dest) => ({ dest, score: scorePhraseForDestination(item.label, dest) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.dest;
}

function bestMonth(dest: Destination, profile: PlanProfile) {
  if (!profile.unavailableMonths.includes(dest.peakMonth)) return dest.peakMonth;
  return dest.bestMonths.find((m) => !profile.unavailableMonths.includes(m)) ?? dest.peakMonth;
}

function buildTrip(dest: Destination, item: WishlistItem, priority: number, profile: PlanProfile): Trip {
  const month = bestMonth(dest, profile);
  const leverage = HOLIDAY_LEVERAGE[month] ?? HOLIDAY_LEVERAGE[7];
  const days = Math.max(3, Math.min(9, leverage.pto + leverage.holiday));
  const peakPoint = dest.peakCurve.reduce((best, point) => (point.p > best.p ? point : best), dest.peakCurve[0]);
  const startDate = addDays(peakPoint.date, -Math.floor(days / 2));
  const budget = Math.min(Math.max(minPrice(dest), Math.round(profile.averageTripBudget * 0.86)), profile.averageTripBudget);

  return {
    destinationId: dest.id,
    startMonth: month,
    startDate,
    endDate: addDays(startDate, days - 1),
    days,
    ptoDays: leverage.pto,
    holidayLeveraged: leverage.holiday,
    priority,
    estimatedBudget: budget,
    reason: `${dest.experience} 的适宜窗口在 ${month} 月，${leverage.note}`,
    reasonEn: `${dest.experienceEn} is strongest around month ${month}. ${leverage.noteEn}`,
    wishlistLabel: item.label,
    wishlistPriorityLabel: item.priorityLabel,
    wishlistPriorityScore: item.priorityScore,
  };
}

export function generateLocalPlan(profile: PlanProfile): GeneratedPlan {
  const wishlistItems = normalizeWishlistItems(profile);
  const matched = wishlistItems
    .map((item, inputOrder) => ({ item, inputOrder, dest: matchWishlistItem(item) }))
    .filter((candidate): candidate is { item: WishlistItem; inputOrder: number; dest: Destination } => Boolean(candidate.dest))
    .sort((a, b) => b.item.priorityScore - a.item.priorityScore || a.inputOrder - b.inputOrder);

  const trips: Trip[] = [];
  const deferredTrips: DeferredTrip[] = [];
  let usedPto = 0;
  let usedBudget = 0;

  matched.forEach((candidate, index) => {
    const trip = buildTrip(candidate.dest, candidate.item, index + 1, profile);
    const fitsCount = trips.length < profile.tripCount;
    const fitsPto = usedPto + trip.ptoDays <= profile.ptoDays;
    const fitsBudget = usedBudget + trip.estimatedBudget <= profile.annualBudget;

    if (fitsCount && fitsPto && fitsBudget) {
      trips.push(trip);
      usedPto += trip.ptoDays;
      usedBudget += trip.estimatedBudget;
      return;
    }

    deferredTrips.push({
      ...trip,
      deferToYear: 2027,
      deferReason: !fitsCount
        ? "超过计划旅行次数，低优先级心愿先放入下一年度候选池。"
        : !fitsPto
        ? "年假资源不足，低优先级心愿先推迟到 2027。"
        : "年度预算不足，建议等待淡季价格或拆成短途替代。",
      deferReasonEn: !fitsCount
        ? "It exceeds the planned trip count, so lower-priority wishes move to next year's candidate pool first."
        : !fitsPto
        ? "PTO is insufficient, so lower-priority wishes move to 2027 first."
        : "Annual budget is insufficient; wait for off-peak pricing or choose a shorter substitute.",
    });
  });

  const findings: AgentFinding[] = [
    {
      agent: "timing",
      text: `已识别 ${matched.length} 个心愿体验，并按优先级、适宜月份和天气不确定性排序。`,
      textEn: `Identified ${matched.length} wish experiences and ranked them by priority, season, and weather uncertainty.`,
    },
    {
      agent: "holiday",
      text: `计划使用 ${usedPto}/${profile.ptoDays} 天年假，并记录 ${profile.unavailableDates?.length ?? 0} 个不可出行日期。`,
      textEn: `The plan uses ${usedPto}/${profile.ptoDays} PTO days and records ${profile.unavailableDates?.length ?? 0} blocked dates.`,
    },
    {
      agent: "price",
      text: `预计花费 ¥${usedBudget.toLocaleString()} / ¥${profile.annualBudget.toLocaleString()}，单次预算用于过滤过贵方案。`,
      textEn: `Estimated spend is ¥${usedBudget.toLocaleString()} / ¥${profile.annualBudget.toLocaleString()}, with per-trip budget as a hard filter.`,
    },
    {
      agent: "combined",
      text: deferredTrips.length
        ? `${deferredTrips.length} 个低优先级或资源冲突心愿被推迟到 2027。`
        : "所有核心心愿都能在今年资源内完成。",
      textEn: deferredTrips.length
        ? `${deferredTrips.length} lower-priority or resource-conflicting wish item(s) moved to 2027.`
        : "All core wishes fit within this year's constraints.",
    },
  ];

  return {
    profile: {
      ...profile,
      wishlistItems,
      wishlist: wishlistItems.map((item) => item.label).join("、"),
      unavailableDates: profile.unavailableDates ?? [],
      unavailableDateNotes: profile.unavailableDateNotes ?? [],
    },
    trips,
    deferredTrips,
    findings,
    generatedBy: "local",
  };
}
