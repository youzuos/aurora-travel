import type { Trip } from "@/lib/types";

/**
 * 用户的 2026 年初心愿初稿：
 * 12 天年假 + 法定假期，4 个心愿（樱花/极光/胡杨/天池）+ 1 个候选（鲸）。
 * 综合 Agent 在 act-3 给出权衡：保京都樱花 + 冰岛极光，胡杨挪到次年，长白山放进端午小窗口。
 */
export const INITIAL_TRIPS: Trip[] = [
  {
    destinationId: "kyoto-sakura",
    startMonth: 4,
    days: 6,
    ptoDays: 3,
    holidayLeveraged: 3, // clear-tomb 拼假
    priority: 1,
  },
  {
    destinationId: "changbai-tianchi",
    startMonth: 6,
    days: 4,
    ptoDays: 1,
    holidayLeveraged: 3, // 端午
    priority: 3,
  },
  {
    destinationId: "iceland-aurora",
    startMonth: 2,
    days: 8,
    ptoDays: 6,
    holidayLeveraged: 2, // 春节尾
    priority: 2,
  },
];

/**
 * 综合 Agent 权衡之后被「挪到次年」的心愿，UI 上灰显示。
 */
export const DEFERRED_TRIPS: Trip[] = [
  {
    destinationId: "xinjiang-poplar",
    startMonth: 10,
    days: 5,
    ptoDays: 5,
    holidayLeveraged: 0,
    priority: 4,
  },
];

export const TOTAL_PTO = 12;
export const BUDGET_CNY = 28000;
