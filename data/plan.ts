import type { DeferredTrip, Trip } from "@/lib/types";

export const DEFAULT_PTO_DAYS = 12;
export const DEFAULT_BUDGET_CNY = 28000;

export const DEMO_TRIPS: Trip[] = [
  {
    destinationId: "kyoto-sakura",
    startMonth: 4,
    days: 6,
    ptoDays: 3,
    holidayLeveraged: 3,
    priority: 1,
    estimatedBudget: 4200,
    reason: "清明前后可用较少年假覆盖花期窗口。",
    reasonEn: "The Qingming window can cover the bloom season with limited PTO.",
  },
  {
    destinationId: "changbai-tianchi",
    startMonth: 7,
    days: 4,
    ptoDays: 1,
    holidayLeveraged: 3,
    priority: 3,
    estimatedBudget: 2100,
    reason: "端午小长假可以做一次低成本补充旅行。",
    reasonEn: "A small Dragon Boat holiday window can support a low-cost trip.",
  },
  {
    destinationId: "iceland-aurora",
    startMonth: 2,
    days: 8,
    ptoDays: 6,
    holidayLeveraged: 2,
    priority: 2,
    estimatedBudget: 7600,
    reason: "冬季极光窗口适合用春节尾段拼假。",
    reasonEn: "The winter aurora window works with a Spring Festival PTO extension.",
  },
];

export const DEMO_DEFERRED_TRIPS: DeferredTrip[] = [
  {
    destinationId: "xinjiang-poplar",
    startMonth: 10,
    days: 5,
    ptoDays: 5,
    holidayLeveraged: 0,
    priority: 4,
    estimatedBudget: 3600,
    reason: "秋色窗口短，但与国庆预算和假期资源竞争。",
    reasonEn: "The autumn window is short but competes with National Day resources.",
    deferToYear: 2027,
    deferReason: "剩余年假不足，且年度预算已接近上限。",
    deferReasonEn: "Remaining PTO is insufficient and the annual budget is close to the cap.",
  },
];
