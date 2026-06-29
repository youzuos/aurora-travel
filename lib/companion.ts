import {
  COMPANION_CHARACTERS,
  COMPANION_LOCATIONS,
  COMPANION_STORAGE_KEY,
  COMPANION_TIMING,
} from "@/data/companion";
import type { Lang } from "@/lib/types";

export { COMPANION_STORAGE_KEY, COMPANION_TIMING };

export type CompanionCharacter = (typeof COMPANION_CHARACTERS)[number];
export type CompanionLocation = (typeof COMPANION_LOCATIONS)[number];
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
}

const DEFAULT_LOCATION_ID = "kyoto";

function makeId(prefix: string, now: number) {
  return `${prefix}-${now}-${Math.random().toString(36).slice(2, 8)}`;
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


type Intent = "status" | "food" | "photo" | "people" | "scenery" | "move" | "unknown";

function normalizeInput(input: string) {
  return input.trim().toLowerCase();
}

function pickByCursor<T>(items: readonly T[], cursor: number): T {
  return items[Math.abs(cursor) % items.length];
}

function detectIntent(input: string): Intent {
  const value = normalizeInput(input);
  if (/(go to|visit|travel|move|去|去往|带我去|送我去|前往)/i.test(value)) return "move";
  if (/(food|eat|drink|restaurant|餐|吃|喝|午餐|晚餐|小吃|美食)/i.test(value)) return "food";
  if (/(photo|picture|image|show me|拍|照片|图片|相片|拍照|景点)/i.test(value)) return "photo";
  if (/(people|meet|met|person|认识|遇见|遇到|朋友)/i.test(value)) return "people";
  if (/(scenery|view|see|景色|风景|景点|风光|夜景)/i.test(value)) return "scenery";
  if (/(where|what are you doing|status|现在|当前|在哪|还好吗|在做什么|更新)/i.test(value) || value.length <= 8)
    return "status";
  return "unknown";
}

function findLocationFromInput(input: string): CompanionLocation | null {
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

function chooseNextLocation(state: CompanionState): CompanionLocation {
  const current = getCurrentLocation(state);
  const neighbor = current.neighbors[0];
  return neighbor ? getLocation(neighbor) : COMPANION_LOCATIONS[0];
}

export function selectCharacter(state: CompanionState, characterId: string, now = Date.now()): CompanionState {
  const character = getCharacter(characterId);
  const location = getCurrentLocation(state);
  const arrival = createAgentMessage(
    "text",
    `${character.nameZh} 已到达。${location.snippetsZh.arrival[0]}`,
    `${character.nameEn} has arrived. ${location.snippetsEn.arrival[0]}`,
    now
  );
  return {
    ...state,
    selectedCharacterId: character.id,
    onboardingCompleted: true,
    lastActiveAt: now,
    messageHistory: [arrival],
    unreadCount: 0,
  };
}

export function getStatusLine(state: CompanionState, lang: Lang): string {
  const location = getCurrentLocation(state);
  const snippets = lang === "zh" ? location.snippetsZh.status : location.snippetsEn.status;
  return pickByCursor(snippets, state.statusCursor);
}

export function maybeAdvanceCompanionLocation(state: CompanionState, now = Date.now()): CompanionState {
  const stayMs = state.testMode ? COMPANION_TIMING.testStayMs : COMPANION_TIMING.productionStayMs;
  if (now - state.lastMovedAt < stayMs) return { ...state, lastActiveAt: now };
  const next = chooseNextLocation(state);
  const arrival = createAgentMessage("text", next.snippetsZh.arrival[0], next.snippetsEn.arrival[0], now);
  return {
    ...state,
    currentLocationId: next.id,
    lastMovedAt: now,
    lastActiveAt: now,
    statusCursor: state.statusCursor + 1,
    messageHistory: [...state.messageHistory, arrival].slice(-60),
    unreadCount: Math.min(3, state.unreadCount + 1),
  };
}

function messageForIntent(
  intent: Exclude<Intent, "move">,
  location: CompanionLocation,
  now: number,
  cursor: number
) {
  const zh = location.snippetsZh;
  const en = location.snippetsEn;
  if (intent === "photo") {
    const photo = pickByCursor(location.photos as ReadonlyArray<{ src: string; alt: string; credit: string }>, cursor);
    return createAgentMessage("image", zh.photo[0], en.photo[0], now, {
      image: {
        src: photo.src,
        alt: photo.alt,
        credit: photo.credit,
        captionZh: zh.photo[0],
        captionEn: en.photo[0],
      },
    });
  }
  if (intent === "food") return createAgentMessage("mixed", zh.food[0], en.food[0], now);
  if (intent === "people") return createAgentMessage("text", zh.people[0], en.people[0], now);
  if (intent === "scenery") return createAgentMessage("voice", zh.scenery[0], en.scenery[0], now, { voiceDurationSec: 8 });
  if (intent === "status") return createAgentMessage("text", zh.status[0], en.status[0], now);
  return createAgentMessage(
    "text",
    `${zh.status[0]} 还想听我讲些吃的、见到的人，还是给你来张照片吗？`,
    `${en.status[0]} I can share food notes, people I met, or a photo if you want.`,
    now
  );
}

function expandInteractiveReply(message: CompanionMessage, intent: Exclude<Intent, "move">): CompanionMessage {
  if (intent === "photo" || intent === "unknown") return message;

  const followUps: Record<Exclude<Intent, "move" | "photo" | "unknown">, { zh: string; en: string }> = {
    status: {
      zh: "我还可以给你讲刚遇到的人，或者拍一张现在看到的景色。",
      en: "I can also tell you about someone I just met, or send a photo of what I am seeing.",
    },
    food: {
      zh: "你要不要听听店里的人，还是让我拍一张吃的给你看？",
      en: "Do you want to hear about the people in the shop, or should I send a food photo?",
    },
    people: {
      zh: "我有点想继续跟着这条街走下去，也许还会碰到新的故事。",
      en: "I kind of want to keep following this street; it feels like there may be another story ahead.",
    },
    scenery: {
      zh: "如果你想看，我可以把这一幕也拍成一张照片发给你。",
      en: "If you want, I can also turn this view into a photo card for you.",
    },
  };

  const followUp = followUps[intent];
  return {
    ...message,
    textZh: `${message.textZh} ${followUp.zh}`,
    textEn: `${message.textEn} ${followUp.en}`,
  };
}

export function generateCompanionReply(
  input: string,
  state: CompanionState,
  lang: Lang,
  now = Date.now()
): { state: CompanionState; messages: CompanionMessage[] } {
  const userMessage = createUserMessage(input, now);
  const intent = detectIntent(input);
  if (intent === "move") {
    const target = findLocationFromInput(input);
    if (target) {
      const depart = createAgentMessage(
        "text",
        `我明白了，我会先收好相机，马上前往${target.cityZh}。`,
        `Got it. I am heading to ${target.cityEn} right away.`,
        now + 250
      );
      const arrival = createAgentMessage("text", target.snippetsZh.arrival[0], target.snippetsEn.arrival[0], now + 900);
      return {
        state: {
          ...state,
          currentLocationId: target.id,
          lastMovedAt: now,
          lastActiveAt: now,
          statusCursor: state.statusCursor + 1,
          messageHistory: [...state.messageHistory, userMessage, depart, arrival].slice(-60),
          unreadCount: 0,
        },
        messages: [userMessage, depart, arrival],
      };
    }
    const fallback = createAgentMessage(
      "text",
      "先告诉我具体城市或国家名，我会马上出发。",
      "Tell me a city or country name and I can head there right away.",
      now + 300
    );
    return {
      state: {
        ...state,
        lastActiveAt: now,
        messageHistory: [...state.messageHistory, userMessage, fallback].slice(-60),
      },
      messages: [userMessage, fallback],
    };
  }

  const location = getCurrentLocation(state);
  const reply = expandInteractiveReply(messageForIntent(intent, location, now + 450, state.statusCursor), intent);
  return {
    state: {
      ...state,
      lastActiveAt: now,
      statusCursor: state.statusCursor + 1,
      messageHistory: [...state.messageHistory, userMessage, reply].slice(-60),
      unreadCount: 0,
    },
    messages: [userMessage, reply],
  };
}

export function addPassiveCompanionMessage(
  state: CompanionState,
  lang: Lang,
  now = Date.now()
): { state: CompanionState; message: CompanionMessage } {
  const location = getCurrentLocation(state);
  const message = messageForIntent("status", location, now, state.statusCursor);
  return {
    state: {
      ...state,
      lastActiveAt: now,
      statusCursor: state.statusCursor + 1,
      messageHistory: [...state.messageHistory, message].slice(-60),
      unreadCount: Math.min(3, state.unreadCount + 1),
    },
    message,
  };
}


