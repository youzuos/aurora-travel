export type Maturity = "sketched" | "refining" | "ready";

export type ClockKind = "experience" | "price";

export interface PeakProbabilityPoint {
  /** ISO date, e.g. "2026-03-22" */
  date: string;
  /** 0–1 probability of the peak experience happening on this date */
  p: number;
}

export interface PriceCurvePoint {
  /** days before departure */
  t: number;
  /** historical avg price in CNY */
  price: number;
}

export interface Destination {
  id: string;
  flag: string;
  city: string;
  country: string;
  experience: string;
  experienceEmoji: string;
  /** central month index (1–12) of peak season */
  peakMonth: number;
  /** width of remote-range in days when shown at T-∞ */
  remoteRangeDays: number;
  /** width of refined-range in days at ~T-60 */
  refinedRangeDays: number;
  /** the eventual confirmed window in days at T-14 */
  confirmedRangeDays: number;
  /** probability curve across days near peakMonth */
  peakCurve: PeakProbabilityPoint[];
  /** historical price curve (CNY round-trip), indexed by days-before-departure */
  priceCurve: PriceCurvePoint[];
  /** miss/扑空 rate at remote / refined / confirmed phases */
  missRate: { sketched: number; refining: number; ready: number };
  /** 1-line story hook for demo (from PRD) */
  story: string;
  /** ribbon color (we keep the brand monochrome, so this just tints the band slightly) */
  tint: "aurora" | "ink" | "rose" | "amber" | "emerald" | "indigo";
  /** uses live NOAA data? */
  liveData?: boolean;
}

export interface Trip {
  destinationId: string;
  /** start month index 1–12, year 2026 */
  startMonth: number;
  /** length in days */
  days: number;
  /** PTO days used (vs holidays leveraged) */
  ptoDays: number;
  /** holiday days leveraged via 拼假 */
  holidayLeveraged: number;
  /** monotonic priority for the 组合优化 narrative */
  priority: number;
}

export type ViewMode = "year" | "trip";

export interface AgentStep {
  /** Which agent this step belongs to */
  agent: "timing" | "holiday" | "price" | "combined";
  /** Plain-language thinking content */
  text: string;
  /** Optional structured data the panel can render */
  evidence?: string;
  /** ms to dwell on this step during playback */
  dwellMs: number;
}
