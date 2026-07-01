export type Lang = "zh" | "en";

export type Maturity = "sketched" | "refining" | "ready";

export type WishlistPriorityLabel = "必去" | "想去" | "随缘";

export interface WishlistItem {
  id: string;
  label: string;
  priorityLabel: WishlistPriorityLabel;
  priorityScore: 1 | 2 | 3;
  source: "user" | "inspiration" | "legacy" | "companion";
}

export interface PeakProbabilityPoint {
  date: string;
  p: number;
}

export interface PriceCurvePoint {
  t: number;
  price: number;
}

export interface Destination {
  id: string;
  flag: string;
  city: string;
  country: string;
  experience: string;
  experienceEn: string;
  experienceEmoji: string;
  peakMonth: number;
  bestMonths: number[];
  remoteRangeDays: number;
  refinedRangeDays: number;
  confirmedRangeDays: number;
  peakCurve: PeakProbabilityPoint[];
  priceCurve: PriceCurvePoint[];
  missRate: { sketched: number; refining: number; ready: number };
  story: string;
  storyEn: string;
  tint: "aurora" | "ink" | "rose" | "amber" | "emerald" | "indigo";
  liveData?: boolean;
}

export interface Trip {
  destinationId: string;
  id?: string;
  title?: string;
  cityCode?: string;
  destinations?: string[];
  startMonth: number;
  startDate?: string;
  endDate?: string;
  days: number;
  ptoDays: number;
  holidayLeveraged: number;
  publicHolidaysUsed?: string[];
  priority: number;
  estimatedBudget: number;
  maturityOverride?: Maturity;
  hitProbability?: number;
  reason: string;
  reasonEn: string;
  wishlistLabel?: string;
  wishlistPriorityLabel?: WishlistPriorityLabel;
  wishlistPriorityScore?: 1 | 2 | 3;
  dailyPlan?: DailyPlanDay[];
  tripWishlist?: TripWishlistItem[];
  reminders?: TripReminder[];
}

export interface DeferredTrip extends Trip {
  deferToYear: number;
  deferReason: string;
  deferReasonEn: string;
}

export interface PlanProfile {
  ptoDays: number;
  annualBudget: number;
  tripCount: number;
  wishlist: string;
  wishlistItems?: WishlistItem[];
  averageTripBudget: number;
  unavailableMonths: number[];
  unavailableDates?: string[];
  unavailableDateNotes?: DateNote[];
}

export interface DateNote {
  id: string;
  date: string;
  label: string;
  source: "user" | "history";
}

export interface DailyPlanDay {
  day: number;
  date: string;
  dayOfWeek: string;
  city: string;
  spots: string[];
  weather?: string;
  notes?: string[];
  backup?: string | null;
}

export interface TripWishlistItem {
  name: string;
  added: "user" | "companion" | "system";
  day?: number;
  note?: string;
}

export interface TripReminder {
  trigger: string;
  date: string;
  type: string;
  message: string;
}

export interface AgentFinding {
  agent: "timing" | "holiday" | "price" | "combined";
  text: string;
  textEn: string;
}

export interface AgentStep {
  agent: "timing" | "holiday" | "price" | "combined";
  text: string;
  evidence?: string;
  dwellMs: number;
}

export interface GeneratedPlan {
  profile: PlanProfile;
  trips: Trip[];
  deferredTrips: DeferredTrip[];
  findings: AgentFinding[];
  generatedBy: "local" | "llm";
}
