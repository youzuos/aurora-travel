import type { Lang, PlanProfile, Trip } from "@/lib/types";

export type CalendarMark = "holiday" | "workday" | "blocked" | "pto" | "trip";

export interface HolidayItem {
  date: string;
  name: string;
  nameEn: string;
  type: "holiday" | "workday";
}

export interface CalendarDay {
  date: string;
  day: number;
  month: number;
  weekday: number;
  inMonth: boolean;
  isWeekend: boolean;
  holiday?: HolidayItem;
  blocked?: boolean;
}

export interface LeaveStrategy {
  id: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  startDate: string;
  endDate: string;
  tripDates: string[];
  ptoDates: string[];
  holidayDates: string[];
  blockedConflicts: string[];
  totalDays: number;
  ptoDays: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Seeded MVP data. Replace this module with an official/API calendar source later.
export const PUBLIC_HOLIDAYS_2026: HolidayItem[] = [
  ...range("2026-01-01", "2026-01-03", "元旦", "New Year", "holiday"),
  ...range("2026-02-15", "2026-02-23", "春节", "Spring Festival", "holiday"),
  ...range("2026-04-04", "2026-04-06", "清明节", "Qingming", "holiday"),
  ...range("2026-05-01", "2026-05-05", "劳动节", "Labor Day", "holiday"),
  ...range("2026-06-19", "2026-06-21", "端午节", "Dragon Boat", "holiday"),
  ...range("2026-09-25", "2026-09-27", "中秋节", "Mid-Autumn", "holiday"),
  ...range("2026-10-01", "2026-10-07", "国庆节", "National Day", "holiday"),
  ...["2026-01-04", "2026-02-14", "2026-02-28", "2026-05-09", "2026-09-20", "2026-10-10"].map(
    (date) => ({
      date,
      name: "调休工作日",
      nameEn: "Adjusted workday",
      type: "workday" as const,
    })
  ),
];

export const HOLIDAY_MAP = new Map(PUBLIC_HOLIDAYS_2026.map((item) => [item.date, item]));

export function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: string, days: number) {
  const next = parseDate(date);
  next.setDate(next.getDate() + days);
  return formatDate(next);
}

export function dateRange(startDate: string, endDate: string) {
  const out: string[] = [];
  for (let t = parseDate(startDate).getTime(); t <= parseDate(endDate).getTime(); t += DAY_MS) {
    out.push(formatDate(new Date(t)));
  }
  return out;
}

export function buildMonthCalendar(year: number, month: number, blockedDates: string[] = []) {
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const blocked = new Set(blockedDates);

  return Array.from({ length: 42 }, (_, index): CalendarDay => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = formatDate(date);
    const weekday = date.getDay();
    const holiday = HOLIDAY_MAP.get(iso);
    const isWeekend = weekday === 0 || weekday === 6;
    return {
      date: iso,
      day: date.getDate(),
      month: date.getMonth() + 1,
      weekday,
      inMonth: date.getMonth() + 1 === month,
      isWeekend,
      holiday,
      blocked: blocked.has(iso),
    };
  });
}

export function deriveTripDates(trip: Trip) {
  if (trip.startDate && trip.endDate) return dateRange(trip.startDate, trip.endDate);
  const start = `2026-${String(trip.startMonth).padStart(2, "0")}-10`;
  return dateRange(start, addDays(start, trip.days - 1));
}

export function generateLeaveStrategies(trip: Trip, profile: PlanProfile | null): LeaveStrategy[] {
  const blocked = new Set(profile?.unavailableDates ?? []);
  const baseStart = trip.startDate ?? `2026-${String(trip.startMonth).padStart(2, "0")}-10`;

  return [
    buildStrategy("peak", baseStart, trip.days, blocked),
    buildStrategy("front-load", addDays(baseStart, -2), trip.days, blocked),
    buildStrategy("holiday-bridge", nearestHolidayBridge(baseStart), trip.days, blocked),
  ];
}

export function calendarLabel(lang: Lang, date: string) {
  const holiday = HOLIDAY_MAP.get(date);
  if (!holiday) return "";
  return lang === "zh" ? holiday.name : holiday.nameEn;
}

function buildStrategy(id: string, startDate: string, days: number, blocked: Set<string>): LeaveStrategy {
  const tripDates = dateRange(startDate, addDays(startDate, days - 1));
  const holidayDates: string[] = [];
  const ptoDates: string[] = [];
  const blockedConflicts: string[] = [];

  tripDates.forEach((date) => {
    const info = HOLIDAY_MAP.get(date);
    const weekday = parseDate(date).getDay();
    const weekend = weekday === 0 || weekday === 6;
    const freeDay = info?.type === "holiday" || (weekend && info?.type !== "workday");

    if (blocked.has(date)) blockedConflicts.push(date);
    if (freeDay) holidayDates.push(date);
    else ptoDates.push(date);
  });

  const titleMap = {
    peak: ["峰值优先", "Peak-first"],
    "front-load": ["提前出发", "Leave earlier"],
    "holiday-bridge": ["假期拼接", "Holiday bridge"],
  } as const;
  const [title, titleEn] = titleMap[id as keyof typeof titleMap] ?? titleMap.peak;

  return {
    id,
    title,
    titleEn,
    summary: `${startDate} 出发，覆盖 ${tripDates.length} 天，其中请年假 ${ptoDates.length} 天。`,
    summaryEn: `Depart ${startDate}, cover ${tripDates.length} days with ${ptoDates.length} PTO day(s).`,
    startDate,
    endDate: tripDates[tripDates.length - 1],
    tripDates,
    ptoDates,
    holidayDates,
    blockedConflicts,
    totalDays: tripDates.length,
    ptoDays: ptoDates.length,
  };
}

function nearestHolidayBridge(baseStart: string) {
  const base = parseDate(baseStart).getTime();
  const candidates = PUBLIC_HOLIDAYS_2026.filter((item) => item.type === "holiday")
    .map((item) => item.date)
    .sort((a, b) => Math.abs(parseDate(a).getTime() - base) - Math.abs(parseDate(b).getTime() - base));
  return candidates[0] ?? baseStart;
}

function range(startDate: string, endDate: string, name: string, nameEn: string, type: HolidayItem["type"]) {
  return dateRange(startDate, endDate).map((date) => ({ date, name, nameEn, type }));
}
