import {
  COMPANION_CHARACTERS,
  COMPANION_LOCATIONS,
  COMPANION_STORAGE_KEY,
  COMPANION_TIMING,
} from "../data/companion";
import { chooseInterestWeightedAction } from "./companionBehavior";
import type { Lang } from "./types";

export { COMPANION_STORAGE_KEY, COMPANION_TIMING };

export type CompanionCharacter = (typeof COMPANION_CHARACTERS)[number];
export type CompanionLocation = (typeof COMPANION_LOCATIONS)[number];
export type CompanionAction = "idle" | "walking" | "photo" | "food" | "map" | "sleepy" | "excited";
export type CompanionMessageKind = "text" | "voice" | "image" | "mixed";
export type CompanionMessageSender = "user" | "agent";

export interface CompanionImagePayload {
  src: string;
  alt: string;
  credit: string;
  captionZh: string;
  captionEn: string;
}

export interface CompanionMessage {
  id: string;
  sender: CompanionMessageSender;
  kind: CompanionMessageKind;
  textZh: string;
  textEn: string;
  createdAt: number;
  image?: CompanionImagePayload;
  voiceDurationSec?: number;
}

export interface CompanionState {
  selectedCharacterId: string | null;
  currentLocationId: string;
  lastMovedAt: number;
  lastActiveAt: number;
  messageHistory: CompanionMessage[];
  unreadCount: number;
  onboardingCompleted: boolean;
  testMode: boolean;
  statusCursor: number;
  visualAction: CompanionAction;
}

export type CompanionIntent = "status" | "food" | "photo" | "people" | "scenery" | "move" | "unknown";
type Intent = CompanionIntent;
const DEFAULT_LOCATION_ID = "kyoto";
const VALID_VISUAL_ACTIONS: readonly CompanionAction[] = [
  "idle",
  "walking",
  "photo",
  "food",
  "map",
  "sleepy",
  "excited",
];

const VAGUE_DESTINATION_RULES: ReadonlyArray<{
  patterns: readonly RegExp[];
  tags: readonly string[];
}> = [
  {
    patterns: [/\bsea(side)?\b/i, /\bocean\b/i, /\bharbou?r\b/i, /\bport\b/i, /\bpier\b/i],
    tags: ["harbor", "canal", "river"],
  },
  {
    patterns: [/\bmountain(s)?\b/i, /\blake\b/i, /\bsnow(y)?\b/i, /\bforest\b/i],
    tags: ["mountain", "lake", "forest", "snow"],
  },
  {
    patterns: [/\baurora\b/i, /\bnorthern lights\b/i, /\bpolar\b/i, /\bnight sky\b/i, /\bstars?\b/i],
    tags: ["aurora", "cold", "night"],
  },
  {
    patterns: [/\bautumn\b/i, /\bforest\b/i, /\bfall\b/i],
    tags: ["autumn", "forest"],
  },
  {
    patterns: [/\bfood\b/i, /\bsnack\b/i, /\bmarket\b/i, /\bcafe\b/i, /\bdessert\b/i, /\bchocolate\b/i],
    tags: ["food", "market", "cafe", "chocolate"],
  },
  {
    patterns: [/\bquiet\b/i, /\bhidden\b/i, /\bslow\b/i, /\btemple\b/i, /\bblossom\b/i, /\bsakura\b/i],
    tags: ["quiet", "hidden", "slow", "temple", "blossom"],
  },
];

function makeId(prefix: string, now: number) {
  return `${prefix}-${now}`;
}

export function getCharacter(id: string): CompanionCharacter {
  return COMPANION_CHARACTERS.find((item) => item.id === id) ?? COMPANION_CHARACTERS[0];
}

export function getLocation(id: string): CompanionLocation {
  return COMPANION_LOCATIONS.find((item) => item.id === id) ?? COMPANION_LOCATIONS[0];
}

export function getCurrentLocation(state: CompanionState): CompanionLocation {
  return getLocation(state.currentLocationId);
}

export function createAgentMessage(
  kind: CompanionMessageKind,
  textZh: string,
  textEn: string,
  now = Date.now(),
  extra: Partial<CompanionMessage> = {}
): CompanionMessage {
  return {
    id: makeId("agent", now),
    sender: "agent",
    kind,
    textZh,
    textEn,
    createdAt: now,
    ...extra,
  };
}

export function createUserMessage(text: string, now = Date.now()): CompanionMessage {
  return {
    id: makeId("user", now),
    sender: "user",
    kind: "text",
    textZh: text,
    textEn: text,
    createdAt: now,
  };
}

export function createDefaultCompanionState(now = Date.now()): CompanionState {
  return {
    selectedCharacterId: null,
    currentLocationId: DEFAULT_LOCATION_ID,
    lastMovedAt: now,
    lastActiveAt: now,
    messageHistory: [],
    unreadCount: 0,
    onboardingCompleted: false,
    testMode: false,
    statusCursor: 0,
    visualAction: "idle",
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function parseCompanionState(raw: string | null, now = Date.now()): CompanionState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isObject(parsed)) return null;
    const base = createDefaultCompanionState(now);
    const selectedCharacterId =
      typeof parsed.selectedCharacterId === "string" ? parsed.selectedCharacterId : base.selectedCharacterId;
    const currentLocationId =
      typeof parsed.currentLocationId === "string" ? parsed.currentLocationId : base.currentLocationId;
    return {
      ...base,
      selectedCharacterId,
      currentLocationId: getLocation(currentLocationId).id,
      lastMovedAt: typeof parsed.lastMovedAt === "number" ? parsed.lastMovedAt : base.lastMovedAt,
      lastActiveAt: typeof parsed.lastActiveAt === "number" ? parsed.lastActiveAt : base.lastActiveAt,
      messageHistory: Array.isArray(parsed.messageHistory)
        ? (parsed.messageHistory as CompanionMessage[]).slice(-60)
        : [],
      unreadCount: typeof parsed.unreadCount === "number" ? Math.min(3, Math.max(0, parsed.unreadCount)) : 0,
      onboardingCompleted: Boolean(parsed.onboardingCompleted && selectedCharacterId),
      testMode: Boolean(parsed.testMode),
      statusCursor: typeof parsed.statusCursor === "number" ? parsed.statusCursor : 0,
      visualAction: isCompanionAction(parsed.visualAction) ? parsed.visualAction : "idle",
    };
  } catch {
    return null;
  }
}

export function serializeCompanionState(state: CompanionState): string {
  return JSON.stringify({
    ...state,
    messageHistory: state.messageHistory.slice(-60),
    unreadCount: Math.min(3, Math.max(0, state.unreadCount)),
  });
}

export function textFor(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

function normalizeInput(input: string) {
  return input.trim().toLowerCase();
}

function pickByCursor<T>(items: readonly T[], cursor: number): T {
  return items[Math.abs(cursor) % items.length];
}

function appendMessages(history: readonly CompanionMessage[], messages: readonly CompanionMessage[]) {
  const existingIds = new Set(history.map((message) => message.id));
  const merged = [...history];

  for (const message of messages) {
    if (existingIds.has(message.id)) {
      const index = merged.findIndex((item) => item.id === message.id);
      if (index >= 0) merged[index] = message;
      continue;
    }
    merged.push(message);
    existingIds.add(message.id);
  }

  return merged.slice(-60);
}

export function appendCompanionMessages(history: readonly CompanionMessage[], messages: readonly CompanionMessage[]) {
  return appendMessages(history, messages);
}

function isCompanionAction(value: unknown): value is CompanionAction {
  return typeof value === "string" && VALID_VISUAL_ACTIONS.includes(value as CompanionAction);
}

function getLocationClock(location: CompanionLocation, now: number) {
  const fallback = new Date(now);
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: location.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(fallback);
    const hourPart = parts.find((part) => part.type === "hour")?.value;
    const minutePart = parts.find((part) => part.type === "minute")?.value;
    const hour = hourPart ? Number(hourPart) % 24 : fallback.getHours();
    const minute = minutePart ? Number(minutePart) : fallback.getMinutes();
    return {
      hour,
      minute,
      displayTime: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    };
  } catch {
    const hour = fallback.getHours();
    const minute = fallback.getMinutes();
    return {
      hour,
      minute,
      displayTime: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    };
  }
}

export function getCompanionLocalTimeInfo(state: CompanionState, now = Date.now()) {
  const location = getCurrentLocation(state);
  const { hour, minute, displayTime } = getLocationClock(location, now);
  const sleeping = hour >= 22 || hour < 7;
  const meal = hour >= 7 && hour < 10 ? "breakfast" : hour >= 11 && hour < 14 ? "lunch" : hour >= 18 && hour < 21 ? "dinner" : "snack";

  return {
    hour,
    minute,
    displayTime,
    sleeping,
    meal,
    labelZh: `${location.cityZh} ${displayTime}`,
    labelEn: `${location.cityEn} ${displayTime}`,
  };
}

function actionForIntent(intent: Intent, state: CompanionState, now: number): CompanionAction {
  const timeInfo = getCompanionLocalTimeInfo(state, now);
  if (timeInfo.sleeping && intent !== "move") return "sleepy";
  if (intent === "move") return "map";
  if (intent === "photo") return "photo";
  if (intent === "food") return timeInfo.sleeping ? "sleepy" : "food";
  if (intent === "people" || intent === "scenery") return "excited";
  return chooseInterestWeightedAction(state.selectedCharacterId, "idle", state.statusCursor, timeInfo.sleeping);
}

function passiveIntentForState(state: CompanionState, now: number): Exclude<Intent, "move"> {
  const timeInfo = getCompanionLocalTimeInfo(state, now);
  if (timeInfo.sleeping) return "status";
  if (timeInfo.meal === "breakfast" || timeInfo.meal === "lunch" || timeInfo.meal === "dinner") return "food";
  if (state.statusCursor % 5 === 2) return "photo";
  if (state.statusCursor % 5 === 4) return "scenery";
  return "status";
}

export function getCompanionAction(state: CompanionState, now = Date.now()): CompanionAction {
  const { sleeping, meal } = getCompanionLocalTimeInfo(state, now);
  const inactiveMs = now - state.lastActiveAt;
  if (inactiveMs > 8 * 60 * 60 * 1000 || sleeping) return "sleepy";
  if (
    (meal === "breakfast" || meal === "lunch" || meal === "dinner") &&
    (state.visualAction === "idle" || state.visualAction === "walking" || state.visualAction === "excited")
  ) {
    return "food";
  }
  return state.visualAction;
}

function getLocationSnippets(location: CompanionLocation) {
  return {
    zh: location.snippetsZh,
    en: location.snippetsEn,
  };
}

function detectIntent(input: string): Intent {
  const value = normalizeInput(input);
  const containsAny = (phrases: readonly string[]) => phrases.some((phrase) => value.includes(phrase));

  if (containsAny(["go to", "visit", "travel", "move", "\u53bb", "\u65c5\u884c", "\u51fa\u53d1", "\u6362\u4e2a\u5730\u65b9"])) return "move";
  if (containsAny(["food", "eat", "drink", "restaurant", "cafe", "\u5403", "\u559d", "\u996d", "\u9910", "\u7f8e\u98df", "\u5496\u5561"])) return "food";
  if (containsAny(["photo", "picture", "image", "show me", "\u7167\u7247", "\u56fe\u7247", "\u62cd"])) return "photo";
  if (containsAny(["people", "meet", "met", "person", "\u4eba", "\u9047\u5230", "\u5f53\u5730\u4eba"])) return "people";
  if (containsAny(["scenery", "view", "see", "\u98ce\u666f", "\u666f\u8272", "\u770b\u5230", "\u6d77", "\u5c71"])) return "scenery";
  if (containsAny(["where", "what are you doing", "status", "\u5728\u54ea", "\u505a\u4ec0\u4e48", "\u72b6\u6001"]) || value.length <= 8) {
    return "status";
  }
  return "unknown";
}
export function detectCompanionIntent(input: string): CompanionIntent {
  return detectIntent(input);
}

function findLocationByKeyword(input: string): CompanionLocation | null {
  const value = normalizeInput(input);
  return (
    COMPANION_LOCATIONS.find((location) =>
      location.keywords.some((keyword) => value.includes(keyword.toLowerCase()))
    ) ??
    COMPANION_LOCATIONS.find(
      (location) =>
        value.includes(location.cityEn.toLowerCase()) ||
        value.includes(location.countryEn.toLowerCase()) ||
        value.includes(location.cityZh) ||
        value.includes(location.countryZh)
    ) ??
    null
  );
}

function findLocationByTags(input: string): CompanionLocation | null {
  const rule = VAGUE_DESTINATION_RULES.find(({ patterns }) => patterns.some((pattern) => pattern.test(input)));
  if (!rule) return null;

  for (const tag of rule.tags) {
    const match = COMPANION_LOCATIONS.find((location) => (location.tags as readonly string[]).includes(tag));
    if (match) return match;
  }

  return (
    COMPANION_LOCATIONS.find((location) =>
      rule.tags.some((tag) => (location.tags as readonly string[]).includes(tag))
    ) ?? null
  );
}

function findLocationFromInput(input: string): CompanionLocation | null {
  return findLocationByKeyword(input) ?? findLocationByTags(input) ?? null;
}

export function findCompanionLocationFromInput(input: string): CompanionLocation | null {
  return findLocationFromInput(input);
}

function chooseNextLocation(state: CompanionState): CompanionLocation {
  const current = getCurrentLocation(state);
  const neighbor = current.neighbors[0];
  return neighbor ? getLocation(neighbor) : COMPANION_LOCATIONS[0];
}

export function advanceCompanionLocationWithoutMessage(
  state: CompanionState,
  now = Date.now()
): { state: CompanionState; moved: boolean } {
  const stayMs = state.testMode ? COMPANION_TIMING.testStayMs : COMPANION_TIMING.productionStayMs;
  if (now - state.lastMovedAt < stayMs) {
    return { state: { ...state, lastActiveAt: now }, moved: false };
  }

  const next = chooseNextLocation(state);
  return {
    state: {
      ...state,
      currentLocationId: next.id,
      lastMovedAt: now,
      lastActiveAt: now,
      statusCursor: state.statusCursor + 1,
      visualAction: "excited",
    },
    moved: true,
  };
}

export function getPassiveCompanionIntent(state: CompanionState, now = Date.now()): Exclude<CompanionIntent, "move"> {
  return passiveIntentForState(state, now);
}

export function getCompanionVisualActionForIntent(intent: CompanionIntent, state: CompanionState, now = Date.now()) {
  return actionForIntent(intent, state, now);
}

export function selectCharacter(state: CompanionState, characterId: string, now = Date.now()): CompanionState {
  const character = getCharacter(characterId);
  return {
    ...state,
    selectedCharacterId: character.id,
    onboardingCompleted: true,
    lastActiveAt: now,
    messageHistory: [],
    unreadCount: 0,
    visualAction: "excited",
  };
}

export function getStatusLine(state: CompanionState, lang: Lang): string {
  const location = getCurrentLocation(state);
  const snippets = lang === "zh" ? getLocationSnippets(location).zh.status : getLocationSnippets(location).en.status;
  return pickByCursor(snippets, state.statusCursor);
}

export function mergeGeneratedReplyState(
  latestState: CompanionState,
  baseState: CompanionState,
  plannedState: CompanionState,
  replyMessages: readonly CompanionMessage[]
): CompanionState {
  const statusDelta = Math.max(0, plannedState.statusCursor - baseState.statusCursor);
  const locationChanged =
    baseState.currentLocationId !== plannedState.currentLocationId || baseState.lastMovedAt !== plannedState.lastMovedAt;

  return {
    ...latestState,
    currentLocationId: locationChanged ? plannedState.currentLocationId : latestState.currentLocationId,
    lastMovedAt: locationChanged ? plannedState.lastMovedAt : latestState.lastMovedAt,
    lastActiveAt: Math.max(latestState.lastActiveAt, plannedState.lastActiveAt),
    statusCursor: latestState.statusCursor + statusDelta,
    messageHistory: appendMessages(latestState.messageHistory, replyMessages),
  };
}



