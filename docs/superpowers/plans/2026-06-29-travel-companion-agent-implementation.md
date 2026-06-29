# Travel Companion Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first Travel Companion Agent that users choose on first visit, see as an active floating companion, chat with immediately, and send to cities or countries.

**Architecture:** Add a separate companion layer beside Aurora's existing annual planner. Static companion/location data lives in `data/companion.ts`, deterministic state and message logic lives in `lib/companion.ts`, and UI is split into onboarding, status, floating bubble, and chat components. `app/page.tsx` owns hydration and persistence in `localStorage`.

**Tech Stack:** Next.js 14.2.5, React 18.3.1, TypeScript 5.5.3, Tailwind CSS 3.4.6, browser `localStorage`, browser `speechSynthesis`.

## Global Constraints

- MVP state is local-only under `aurora.companion.v1`; do not add account auth or backend persistence.
- Do not depend on live LLM calls for P0 chat behavior.
- Do not scrape arbitrary websites for images.
- Character assets and city photos are decoupled; do not create `character x city` image combinations.
- User-triggered migration ignores the normal stay interval.
- Natural migration is day-scale by default and can be accelerated only by a development/test setting.
- The companion must answer user messages immediately and expand the topic.
- The companion must not be silent; use current-city bubbles rather than frequent relocation.
- Uploaded-image custom companion generation is P1 and must not block P0.
- Existing annual planning logic in `lib/planner.ts` must remain unchanged unless integration requires a type import.

---

## File Structure

- Create `data/companion.ts`: preset characters, locations, snippets, city photo candidates, and constants for production/test timing.
- Create `lib/companion.ts`: companion types, state initialization, persistence helpers, migration helpers, intent parsing, reply generation, and TTS helper text selection.
- Create `components/CompanionOnboarding.tsx`: first-visit character picker and P1 upload entry.
- Create `components/CompanionStatus.tsx`: home status strip with current location and latest activity line.
- Create `components/CompanionBubble.tsx`: floating avatar, passive bubble timer, unread indicator.
- Create `components/CompanionChat.tsx`: drawer/bottom sheet chat UI, message input, voice bubble playback, image cards, change-character action.
- Modify `app/page.tsx`: hydrate companion state, persist changes, wire status/bubble/chat/onboarding.
- Modify `components/TopBar.tsx`: add a compact companion settings button if layout remains clean.
- Modify `tailwind.config.ts` only if a new animation is required for typing or bubble entrance.
- Create `public/companion/characters/*`: 3-4 generated character assets.

## Task 1: Companion Data and Types

**Files:**
- Create: `data/companion.ts`
- Create: `lib/companion.ts`

**Interfaces:**
- Produces:
  - `CompanionCharacter`
  - `CompanionLocation`
  - `CompanionMessage`
  - `CompanionState`
  - `COMPANION_STORAGE_KEY`
  - `createDefaultCompanionState(now?: number): CompanionState`
  - `getCharacter(id: string): CompanionCharacter`
  - `getLocation(id: string): CompanionLocation`
  - `getCurrentLocation(state: CompanionState): CompanionLocation`
  - `serializeCompanionState(state: CompanionState): string`
  - `parseCompanionState(raw: string | null, now?: number): CompanionState | null`
- Consumes: no new project interfaces.

- [ ] **Step 1: Add data model skeleton and expect compile failure**

Create `data/companion.ts` with the exports shown below. Use character image paths even before assets exist; the UI has image fallbacks in Task 3.

```ts
export const COMPANION_STORAGE_KEY = "aurora.companion.v1";

export const COMPANION_TIMING = {
  productionStayMs: 36 * 60 * 60 * 1000,
  testStayMs: 6 * 60 * 1000,
  productionBubbleMs: 90 * 1000,
  testBubbleMs: 15 * 1000,
} as const;

export const COMPANION_CHARACTERS = [
  {
    id: "mira",
    nameZh: "米拉",
    nameEn: "Mira",
    personalityZh: "喜欢把风声收进围巾里的小旅伴。",
    personalityEn: "A tiny traveler who collects wind inside its scarf.",
    imageSrc: "/companion/characters/mira.png",
    accent: "rose",
    tagsZh: ["好奇", "拍照", "温柔"],
    tagsEn: ["curious", "camera", "gentle"],
  },
  {
    id: "lumo",
    nameZh: "露莫",
    nameEn: "Lumo",
    personalityZh: "背着旧相机，专门寻找发光的夜晚。",
    personalityEn: "Carries an old camera and hunts for glowing nights.",
    imageSrc: "/companion/characters/lumo.png",
    accent: "indigo",
    tagsZh: ["夜行", "勇敢", "极光"],
    tagsEn: ["night", "brave", "aurora"],
  },
  {
    id: "piko",
    nameZh: "皮可",
    nameEn: "Piko",
    personalityZh: "总能在陌生街角闻到好吃的小店。",
    personalityEn: "Always finds something delicious on unfamiliar corners.",
    imageSrc: "/companion/characters/piko.png",
    accent: "amber",
    tagsZh: ["贪吃", "开朗", "街巷"],
    tagsEn: ["foodie", "bright", "streets"],
  },
  {
    id: "nori",
    nameZh: "诺里",
    nameEn: "Nori",
    personalityZh: "慢吞吞但方向感很好，喜欢把票根夹进地图。",
    personalityEn: "Slow but never lost, and keeps ticket stubs inside maps.",
    imageSrc: "/companion/characters/nori.png",
    accent: "emerald",
    tagsZh: ["慢热", "地图", "可靠"],
    tagsEn: ["steady", "maps", "reliable"],
  },
] as const;

export const COMPANION_LOCATIONS = [
  {
    id: "kyoto",
    cityZh: "京都",
    cityEn: "Kyoto",
    countryZh: "日本",
    countryEn: "Japan",
    keywords: ["京都", "kyoto", "日本", "japan", "樱花", "sakura"],
    neighbors: ["osaka", "nara"],
    tags: ["blossom", "temple", "river", "quiet"],
    photos: [
      {
        src: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
        alt: "Kyoto street and traditional architecture",
        credit: "Unsplash city photo",
      },
    ],
    snippetsZh: {
      status: ["我在鸭川边走了一小段，围巾被风吹得一直往后跑。"],
      food: ["我吃了热乎乎的抹茶团子，店主把最后一串留给了我。"],
      people: ["我遇到一位修相机的爷爷，他说旧镜头最会记住春天。"],
      scenery: ["清晨的寺门还没完全打开，石板路上有一点樱花影子。"],
      photo: ["给你看我刚拍的京都，空气像刚洗过一样。"],
      arrival: ["我到京都啦。第一件事是把相机电池充满，怕错过花开的声音。"],
    },
    snippetsEn: {
      status: ["I walked along the Kamo River and the wind kept tugging my scarf backward."],
      food: ["I ate warm matcha dango, and the shopkeeper saved the last skewer for me."],
      people: ["I met an old camera repairman who said old lenses remember spring best."],
      scenery: ["The temple gate was barely open, and blossom shadows sat on the stone path."],
      photo: ["Here is Kyoto through my camera. The air looked freshly washed."],
      arrival: ["I reached Kyoto. First thing: charging my camera battery before the blossoms wake up."],
    },
  },
  {
    id: "osaka",
    cityZh: "大阪",
    cityEn: "Osaka",
    countryZh: "日本",
    countryEn: "Japan",
    keywords: ["大阪", "osaka", "日本", "japan", "章鱼烧", "takoyaki"],
    neighbors: ["kyoto", "nara"],
    tags: ["food", "neon", "street"],
    photos: [
      {
        src: "https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=1200&q=80",
        alt: "Osaka city lights",
        credit: "Unsplash city photo",
      },
    ],
    snippetsZh: {
      status: ["我在道顿堀旁边看霓虹灯，背包上沾了一点章鱼烧酱。"],
      food: ["刚吃了章鱼烧，太烫了，我对着相机吹了半分钟。"],
      people: ["摊主阿姨教我用牙签翻章鱼烧，结果我翻得像在修表。"],
      scenery: ["河面把霓虹灯揉成了彩色的线，像城市在眨眼。"],
      photo: ["这张大阪有点吵，但很开心。"],
      arrival: ["我从京都晃到大阪啦。这里连夜色都像刚出锅。"],
    },
    snippetsEn: {
      status: ["I am beside Dotonbori watching neon lights, with a little takoyaki sauce on my backpack."],
      food: ["I ate takoyaki. It was so hot I blew on it in front of the camera for half a minute."],
      people: ["A stall auntie taught me to flip takoyaki with a pick; I moved like I was repairing a watch."],
      scenery: ["The river twisted the neon into colored threads, like the city was blinking."],
      photo: ["This Osaka photo is loud, but happy."],
      arrival: ["I wandered from Kyoto to Osaka. Even the night feels freshly cooked here."],
    },
  },
  {
    id: "paris",
    cityZh: "巴黎",
    cityEn: "Paris",
    countryZh: "法国",
    countryEn: "France",
    keywords: ["巴黎", "paris", "法国", "france", "法兰西", "咖啡"],
    neighbors: ["brussels", "amsterdam"],
    tags: ["museum", "cafe", "river"],
    photos: [
      {
        src: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
        alt: "Paris skyline with Eiffel Tower",
        credit: "Unsplash city photo",
      },
    ],
    snippetsZh: {
      status: ["我坐在塞纳河边整理照片，旁边的鸽子一直想检查我的背包。"],
      food: ["我吃了羊角包，碎屑掉进围巾里，闻起来像黄油云。"],
      people: ["咖啡店老板问我要不要多坐一会儿，因为今天的光很好。"],
      scenery: ["傍晚的铁塔颜色很轻，像一枚慢慢亮起来的邮票。"],
      photo: ["给你一张巴黎的傍晚，我把风也拍进去了。"],
      arrival: ["我到巴黎啦。第一站是找一张靠窗的小桌子写明信片。"],
    },
    snippetsEn: {
      status: ["I am sorting photos by the Seine while a pigeon keeps inspecting my backpack."],
      food: ["I ate a croissant, and crumbs fell into my scarf. It smells like a butter cloud."],
      people: ["The cafe owner asked if I wanted to sit longer because the light was good today."],
      scenery: ["The tower looked soft at dusk, like a stamp slowly lighting up."],
      photo: ["Here is Paris in the evening. I think I caught the wind too."],
      arrival: ["I reached Paris. First stop: a window table for writing postcards."],
    },
  },
] as const;
```

Run: `npm run build`

Expected: FAIL because no code imports these files yet is acceptable at this step only if TypeScript reports no syntax errors in changed files. If the build passes, continue; this step is a compile-safety check.

- [ ] **Step 2: Add core companion types and state helpers**

Create `lib/companion.ts` with these types and helpers.

```ts
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
```

- [ ] **Step 3: Run compile verification**

Run: `npm run build`

Expected: PASS or fail only on existing unrelated project issues. If TypeScript reports errors in `data/companion.ts` or `lib/companion.ts`, fix those files before continuing.

- [ ] **Step 4: Commit**

```bash
git add data/companion.ts lib/companion.ts
git commit -m "feat: add companion data model"
```

## Task 2: Travel Logic and Reply Generation

**Files:**
- Modify: `lib/companion.ts`
- Modify: `data/companion.ts`

**Interfaces:**
- Consumes: Task 1 companion types and data.
- Produces:
  - `selectCharacter(state: CompanionState, characterId: string, now?: number): CompanionState`
  - `getStatusLine(state: CompanionState, lang: Lang): string`
  - `maybeAdvanceCompanionLocation(state: CompanionState, now?: number): CompanionState`
  - `generateCompanionReply(input: string, state: CompanionState, lang: Lang, now?: number): { state: CompanionState; messages: CompanionMessage[] }`
  - `addPassiveCompanionMessage(state: CompanionState, lang: Lang, now?: number): { state: CompanionState; message: CompanionMessage }`

- [ ] **Step 1: Add failing imports in `app/page.tsx`**

Temporarily add this import near other imports to verify the new API is absent before implementation:

```ts
import { generateCompanionReply, maybeAdvanceCompanionLocation } from "@/lib/companion";
```

Run: `npm run build`

Expected: FAIL with missing exports `generateCompanionReply` and `maybeAdvanceCompanionLocation`.

Remove the temporary import before implementing the functions if the build failure has been observed.

- [ ] **Step 2: Implement selection, status, migration, and replies**

Append these functions to `lib/companion.ts`.

```ts
type Intent = "status" | "food" | "photo" | "people" | "scenery" | "move" | "unknown";

function normalizeInput(input: string) {
  return input.trim().toLowerCase();
}

function pickByCursor<T>(items: readonly T[], cursor: number): T {
  return items[Math.abs(cursor) % items.length];
}

function detectIntent(input: string): Intent {
  const value = normalizeInput(input);
  if (/(去|出发|换|travel|go to|visit|move)/i.test(input)) return "move";
  if (/(吃|喝|food|eat|drink|餐|饭|咖啡)/i.test(input)) return "food";
  if (/(照片|图片|拍|photo|picture|image|show me)/i.test(input)) return "photo";
  if (/(遇到|谁|人|people|meet|met)/i.test(input)) return "people";
  if (/(风景|看到|景色|scenery|see|view)/i.test(input)) return "scenery";
  if (/(干嘛|做什么|where|what are you doing|在干什么)/i.test(input) || value.length <= 8) return "status";
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
    `${character.nameZh} 把相机挂好啦。${location.snippetsZh.arrival[0]}`,
    `${character.nameEn} has clipped on the camera. ${location.snippetsEn.arrival[0]}`,
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

function messageForIntent(intent: Exclude<Intent, "move">, location: CompanionLocation, now: number, cursor: number) {
  const zh = location.snippetsZh;
  const en = location.snippetsEn;
  if (intent === "photo") {
    const photo = pickByCursor(location.photos, cursor);
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
    `${zh.status[0]} 你想听我讲吃的、遇到的人，还是看一张照片？`,
    `${en.status[0]} Do you want food notes, someone I met, or a photo?`,
    now
  );
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
        `收到，我把围巾系紧，现在就去${target.cityZh}。`,
        `Got it. I am tightening my scarf and heading to ${target.cityEn}.`,
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
      "我先把这个地方钉在地图上。你告诉我城市名或国家名，我就能立刻出发。",
      "I pinned that place on my map. Tell me the city or country name and I can leave right away.",
      now + 300
    );
    return {
      state: { ...state, lastActiveAt: now, messageHistory: [...state.messageHistory, userMessage, fallback].slice(-60) },
      messages: [userMessage, fallback],
    };
  }

  const location = getCurrentLocation(state);
  const reply = messageForIntent(intent, location, now + 450, state.statusCursor);
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
```

- [ ] **Step 3: Run compile verification**

Run: `npm run build`

Expected: PASS or fail only on pre-existing unrelated code. If failure mentions `lib/companion.ts`, fix before continuing.

- [ ] **Step 4: Commit**

```bash
git add data/companion.ts lib/companion.ts
git commit -m "feat: add companion travel logic"
```

## Task 3: Onboarding and Home Status UI

**Files:**
- Create: `components/CompanionOnboarding.tsx`
- Create: `components/CompanionStatus.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes:
  - `CompanionState`
  - `COMPANION_CHARACTERS`
  - `getCurrentLocation`
  - `getStatusLine`
  - `selectCharacter`
- Produces:
  - First-visit modal
  - Home status strip

- [ ] **Step 1: Create onboarding component**

Create `components/CompanionOnboarding.tsx`.

```tsx
"use client";

import { COMPANION_CHARACTERS } from "@/data/companion";
import type { CompanionState } from "@/lib/companion";
import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  state: CompanionState;
  onSelect: (characterId: string) => void;
}

function copy(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export default function CompanionOnboarding({ lang, state, onSelect }: Props) {
  if (state.onboardingCompleted) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/92 px-4 backdrop-blur-md">
      <div className="w-full max-w-5xl rounded-2xl border hairline bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-aurora-700">
              Travel Companion
            </div>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-ink-900">
              {copy(lang, "选择一个会替你流浪的小旅伴", "Choose a tiny traveler to wander for you")}
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-600">
              {copy(
                lang,
                "它会在城市里遇见人、拍照片、发语音，也会在你指定目的地时立刻出发。",
                "It will meet people, take photos, send voice notes, and leave immediately when you name a destination."
              )}
            </p>
          </div>
          <div className="rounded-full border hairline bg-ink-50 px-3 py-1.5 text-[11px] text-ink-500">
            {copy(lang, "本地保存，可随时修改", "Saved locally, editable anytime")}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COMPANION_CHARACTERS.map((character) => (
            <button
              key={character.id}
              onClick={() => onSelect(character.id)}
              className="group rounded-xl border hairline bg-white p-3 text-left transition hover:border-aurora-300 hover:bg-aurora-50/50"
            >
              <div className="aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-aurora-50 to-ink-100">
                <img
                  src={character.imageSrc}
                  alt={copy(lang, character.nameZh, character.nameEn)}
                  className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="mt-3 text-[15px] font-semibold text-ink-900">
                {copy(lang, character.nameZh, character.nameEn)}
              </div>
              <div className="mt-1 min-h-[38px] text-[12px] leading-relaxed text-ink-600">
                {copy(lang, character.personalityZh, character.personalityEn)}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(lang === "zh" ? character.tagsZh : character.tagsEn).map((tag) => (
                  <span key={tag} className="rounded-full bg-ink-50 px-2 py-1 text-[10.5px] text-ink-500">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 p-4">
          <div className="text-[13px] font-semibold text-ink-800">
            {copy(lang, "进阶：上传图片生成专属旅伴", "Advanced: upload an image to inspire a custom companion")}
          </div>
          <p className="mt-1 text-[12px] text-ink-500">
            {copy(
              lang,
              "这条路径会作为 P1 接入真实生成。当前版本先保证现成旅伴稳定可用。",
              "This path is P1 for real generation. This version keeps preset companions stable first."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create status component**

Create `components/CompanionStatus.tsx`.

```tsx
"use client";

import { getCharacter, getCurrentLocation, getStatusLine, type CompanionState } from "@/lib/companion";
import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  state: CompanionState;
  onOpen: () => void;
}

export default function CompanionStatus({ lang, state, onOpen }: Props) {
  if (!state.onboardingCompleted || !state.selectedCharacterId) return null;
  const character = getCharacter(state.selectedCharacterId);
  const location = getCurrentLocation(state);
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border hairline bg-white px-4 py-3 text-left shadow-[0_1px_2px_rgba(20,30,50,0.04)] transition hover:border-aurora-200 hover:bg-aurora-50/40"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-ink-50">
        <img src={character.imageSrc} alt={lang === "zh" ? character.nameZh : character.nameEn} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-aurora-700">
          <span>{lang === "zh" ? "小旅伴近况" : "Companion update"}</span>
          <span className="h-1 w-1 rounded-full bg-aurora-300" />
          <span>{lang === "zh" ? location.cityZh : location.cityEn}</span>
        </div>
        <div className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-700">
          {getStatusLine(state, lang)}
        </div>
      </div>
      <div className="hidden rounded-full bg-ink-900 px-3 py-1.5 text-[11px] font-medium text-white sm:block">
        {lang === "zh" ? "聊聊" : "Chat"}
      </div>
    </button>
  );
}
```

- [ ] **Step 3: Wire state in `app/page.tsx`**

Modify `app/page.tsx` imports:

```ts
import CompanionOnboarding from "@/components/CompanionOnboarding";
import CompanionStatus from "@/components/CompanionStatus";
import {
  COMPANION_STORAGE_KEY,
  createDefaultCompanionState,
  maybeAdvanceCompanionLocation,
  parseCompanionState,
  selectCharacter,
  serializeCompanionState,
  type CompanionState,
} from "@/lib/companion";
```

Add state near other `useState` calls:

```ts
const [companionState, setCompanionState] = useState<CompanionState>(() => createDefaultCompanionState());
const [companionChatOpen, setCompanionChatOpen] = useState(false);
```

Add hydration in the first `useEffect` after language/plan hydration:

```ts
const savedCompanion = parseCompanionState(window.localStorage.getItem(COMPANION_STORAGE_KEY));
setCompanionState(maybeAdvanceCompanionLocation(savedCompanion ?? createDefaultCompanionState()));
```

Add persistence effect:

```ts
useEffect(() => {
  window.localStorage.setItem(COMPANION_STORAGE_KEY, serializeCompanionState(companionState));
}, [companionState]);
```

Add handler:

```ts
function chooseCompanion(characterId: string) {
  setCompanionState((state) => selectCharacter(state, characterId));
}
```

Render `CompanionStatus` after the main hero `section` and before `TimeWarp`:

```tsx
<CompanionStatus lang={lang} state={companionState} onOpen={() => setCompanionChatOpen(true)} />
```

Render onboarding before closing `</main>`:

```tsx
<CompanionOnboarding lang={lang} state={companionState} onSelect={chooseCompanion} />
```

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS. If the build fails because `companionChatOpen` is unused, keep it for Task 4 by rendering a temporary no-op expression:

```tsx
{companionChatOpen && null}
```

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/CompanionOnboarding.tsx components/CompanionStatus.tsx
git commit -m "feat: add companion onboarding and status"
```

## Task 4: Floating Companion and Chat Drawer

**Files:**
- Create: `components/CompanionBubble.tsx`
- Create: `components/CompanionChat.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes:
  - `CompanionState`
  - `addPassiveCompanionMessage`
  - `generateCompanionReply`
  - `getCharacter`
  - `getCurrentLocation`
- Produces:
  - Floating companion button and passive bubbles
  - Chat UI with text, voice, image, and mixed message rendering

- [ ] **Step 1: Create floating bubble**

Create `components/CompanionBubble.tsx`.

```tsx
"use client";

import { useEffect, useState } from "react";
import {
  COMPANION_TIMING,
  addPassiveCompanionMessage,
  getCharacter,
  getCurrentLocation,
  type CompanionMessage,
  type CompanionState,
} from "@/lib/companion";
import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  state: CompanionState;
  chatOpen: boolean;
  onOpen: () => void;
  onStateChange: (state: CompanionState) => void;
}

export default function CompanionBubble({ lang, state, chatOpen, onOpen, onStateChange }: Props) {
  const [bubble, setBubble] = useState<CompanionMessage | null>(null);
  const character = state.selectedCharacterId ? getCharacter(state.selectedCharacterId) : null;
  const location = getCurrentLocation(state);

  useEffect(() => {
    if (!state.onboardingCompleted || chatOpen) return;
    const intervalMs = state.testMode ? COMPANION_TIMING.testBubbleMs : COMPANION_TIMING.productionBubbleMs;
    const timer = window.setInterval(() => {
      const result = addPassiveCompanionMessage(state, lang);
      setBubble(result.message);
      onStateChange(result.state);
      window.setTimeout(() => setBubble(null), 7000);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [chatOpen, lang, onStateChange, state]);

  if (!state.onboardingCompleted || !character) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex max-w-[calc(100vw-2.5rem)] flex-col items-end gap-2">
      {bubble && (
        <button
          onClick={onOpen}
          className="max-w-[280px] rounded-2xl border hairline bg-white px-4 py-3 text-left text-[12.5px] leading-relaxed text-ink-700 shadow-xl"
        >
          {lang === "zh" ? bubble.textZh : bubble.textEn}
        </button>
      )}
      <button
        onClick={onOpen}
        className="flex items-center gap-3 rounded-2xl border hairline bg-white p-2 pr-3 shadow-xl transition hover:scale-[1.02]"
      >
        <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-ink-50">
          <img src={character.imageSrc} alt={lang === "zh" ? character.nameZh : character.nameEn} className="h-full w-full object-cover" />
          <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
        </div>
        <div className="hidden min-w-0 text-left sm:block">
          <div className="text-[12px] font-semibold text-ink-900">
            {lang === "zh" ? character.nameZh : character.nameEn}
          </div>
          <div className="truncate text-[11px] text-ink-500">
            {lang === "zh" ? location.cityZh : location.cityEn}
          </div>
        </div>
        {state.unreadCount > 0 && (
          <div className="grid h-5 min-w-5 place-items-center rounded-full bg-aurora-700 px-1.5 text-[10px] font-semibold text-white">
            {state.unreadCount}
          </div>
        )}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create chat drawer**

Create `components/CompanionChat.tsx`.

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  generateCompanionReply,
  getCharacter,
  getCurrentLocation,
  type CompanionMessage,
  type CompanionState,
} from "@/lib/companion";
import type { Lang } from "@/lib/types";

interface Props {
  open: boolean;
  lang: Lang;
  state: CompanionState;
  onClose: () => void;
  onStateChange: (state: CompanionState) => void;
  onChangeCharacter: () => void;
}

function messageText(message: CompanionMessage, lang: Lang) {
  return lang === "zh" ? message.textZh : message.textEn;
}

function speak(text: string, lang: Lang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "zh" ? "zh-CN" : "en-US";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

export default function CompanionChat({ open, lang, state, onClose, onStateChange, onChangeCharacter }: Props) {
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const character = state.selectedCharacterId ? getCharacter(state.selectedCharacterId) : null;
  const location = getCurrentLocation(state);
  const messages = useMemo(() => state.messageHistory.slice(-40), [state.messageHistory]);

  useEffect(() => {
    if (!open) return;
    onStateChange({ ...state, unreadCount: 0 });
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing]);

  if (!open || !character) return null;

  function send() {
    const text = draft.trim();
    if (!text || typing) return;
    setDraft("");
    const result = generateCompanionReply(text, state, lang);
    const userOnlyState = {
      ...result.state,
      messageHistory: [...state.messageHistory, result.messages[0]].slice(-60),
    };
    onStateChange(userOnlyState);
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      onStateChange(result.state);
    }, 520);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-end bg-ink-900/20 p-0 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div
        className="flex h-[86vh] w-full flex-col overflow-hidden rounded-t-2xl border hairline bg-white shadow-2xl sm:h-[min(760px,calc(100vh-2rem))] sm:max-w-[420px] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b hairline px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <img src={character.imageSrc} alt={lang === "zh" ? character.nameZh : character.nameEn} className="h-10 w-10 rounded-xl object-cover" />
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-ink-900">
                  {lang === "zh" ? character.nameZh : character.nameEn}
                </div>
                <div className="truncate text-[11px] text-ink-500">
                  {lang === "zh" ? `正在${location.cityZh}旅行` : `Traveling in ${location.cityEn}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onChangeCharacter} className="rounded-full border hairline px-3 py-1.5 text-[11px] text-ink-600 hover:bg-ink-50">
                {lang === "zh" ? "换形象" : "Change"}
              </button>
              <button onClick={onClose} className="text-xl leading-none text-ink-400 hover:text-ink-900">
                ×
              </button>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ink-50/50 px-4 py-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                message.sender === "user" ? "bg-ink-900 text-white" : "border hairline bg-white text-ink-800"
              }`}>
                {message.image && (
                  <div className="mb-2 overflow-hidden rounded-xl bg-ink-100">
                    <img src={message.image.src} alt={message.image.alt} className="aspect-[4/3] w-full object-cover" />
                    <div className="px-3 py-2 text-[10.5px] text-ink-500">{message.image.credit}</div>
                  </div>
                )}
                {message.kind === "voice" ? (
                  <button
                    onClick={() => speak(messageText(message, lang), lang)}
                    className="mb-1 flex w-full items-center gap-2 rounded-full bg-aurora-50 px-3 py-2 text-left text-[12px] text-aurora-800"
                  >
                    <span>▶</span>
                    <span>{message.voiceDurationSec ?? 8}s</span>
                  </button>
                ) : null}
                <div>{messageText(message, lang)}</div>
              </div>
            </div>
          ))}
          {typing && <div className="text-[12px] text-ink-400">{lang === "zh" ? "小旅伴正在打字..." : "Companion is typing..."}</div>}
        </div>

        <div className="border-t hairline bg-white p-3">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") send();
              }}
              placeholder={lang === "zh" ? "问它在干嘛，或说：去巴黎" : "Ask what it is doing, or say: go to Paris"}
              className="min-w-0 flex-1 rounded-xl border hairline bg-ink-50 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-aurora-200"
            />
            <button onClick={send} disabled={!draft.trim() || typing} className="rounded-xl bg-ink-900 px-4 py-2 text-[12px] font-medium text-white disabled:opacity-40">
              {lang === "zh" ? "发送" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire bubble and chat in `app/page.tsx`**

Add imports:

```ts
import CompanionBubble from "@/components/CompanionBubble";
import CompanionChat from "@/components/CompanionChat";
```

Render near the existing `ChatOverlay`:

```tsx
<CompanionBubble
  lang={lang}
  state={companionState}
  chatOpen={companionChatOpen}
  onOpen={() => setCompanionChatOpen(true)}
  onStateChange={setCompanionState}
/>
<CompanionChat
  open={companionChatOpen}
  lang={lang}
  state={companionState}
  onClose={() => setCompanionChatOpen(false)}
  onStateChange={setCompanionState}
  onChangeCharacter={() => {
    setCompanionChatOpen(false);
    setCompanionState((state) => ({ ...state, onboardingCompleted: false }));
  }}
/>
```

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS. Fix any unused import, missing export, or JSX type error in changed files.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/CompanionBubble.tsx components/CompanionChat.tsx
git commit -m "feat: add companion bubble and chat"
```

## Task 5: Character Assets and Photo Fallback Polish

**Files:**
- Create: `public/companion/characters/mira.png`
- Create: `public/companion/characters/lumo.png`
- Create: `public/companion/characters/piko.png`
- Create: `public/companion/characters/nori.png`
- Modify: `components/CompanionOnboarding.tsx`
- Modify: `components/CompanionBubble.tsx`
- Modify: `components/CompanionChat.tsx`

**Interfaces:**
- Consumes: character image paths from `data/companion.ts`.
- Produces: visible character assets and graceful fallback if an image fails.

- [ ] **Step 1: Generate four character assets**

Use the built-in image generation path. Generate one square PNG per prompt, then copy final selected files to `public/companion/characters/`.

Prompt for `mira.png`:

```text
Use case: stylized-concept
Asset type: app companion avatar
Primary request: a cute anthropomorphic fantasy creature travel companion named Mira, anime-inspired, original character, wearing a small scarf, carrying a tiny backpack and a compact camera
Style/medium: polished anime illustration, soft clean shapes, app-ready character art
Composition/framing: centered full-body character, square composition, generous padding
Color palette: warm rose, cream, soft ink accents
Constraints: original character, no text, no watermark, no existing IP, no realistic human face
Avoid: dark horror mood, complex background, logos
```

Prompt for `lumo.png`:

```text
Use case: stylized-concept
Asset type: app companion avatar
Primary request: a cute anthropomorphic fantasy creature travel companion named Lumo, anime-inspired, original character, night-traveler mood, wearing a scarf, carrying a small backpack and old camera
Style/medium: polished anime illustration, soft clean shapes, app-ready character art
Composition/framing: centered full-body character, square composition, generous padding
Color palette: indigo, pale aurora green, silver accents
Constraints: original character, no text, no watermark, no existing IP, no realistic human face
Avoid: dark horror mood, complex background, logos
```

Prompt for `piko.png`:

```text
Use case: stylized-concept
Asset type: app companion avatar
Primary request: a cute anthropomorphic fantasy creature travel companion named Piko, anime-inspired, cheerful food-loving traveler, wearing a scarf, carrying a small backpack and compact camera
Style/medium: polished anime illustration, soft clean shapes, app-ready character art
Composition/framing: centered full-body character, square composition, generous padding
Color palette: amber, coral, soft white, ink accents
Constraints: original character, no text, no watermark, no existing IP, no realistic human face
Avoid: dark horror mood, complex background, logos
```

Prompt for `nori.png`:

```text
Use case: stylized-concept
Asset type: app companion avatar
Primary request: a cute anthropomorphic fantasy creature travel companion named Nori, anime-inspired, calm map-loving traveler, wearing a scarf, carrying a small backpack, compact camera, and folded map
Style/medium: polished anime illustration, soft clean shapes, app-ready character art
Composition/framing: centered full-body character, square composition, generous padding
Color palette: emerald, mist blue, warm grey
Constraints: original character, no text, no watermark, no existing IP, no realistic human face
Avoid: dark horror mood, complex background, logos
```

- [ ] **Step 2: Add image fallback styling**

If generated assets are not ready during local development, components already hide broken images. Improve the fallback by wrapping images in containers with visible character initials. In each component that renders a character image, keep the parent gradient background and avoid layout shift by fixed `h/w` or `aspect-square` sizing.

Use this pattern for each image:

```tsx
<div className="relative h-14 w-14 overflow-hidden rounded-xl bg-gradient-to-br from-aurora-100 to-ink-100">
  <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-aurora-800">
    {(lang === "zh" ? character.nameZh : character.nameEn).slice(0, 1)}
  </span>
  <img
    src={character.imageSrc}
    alt={lang === "zh" ? character.nameZh : character.nameEn}
    className="relative h-full w-full object-cover"
    onError={(event) => {
      event.currentTarget.style.display = "none";
    }}
  />
</div>
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add public/companion/characters components/CompanionOnboarding.tsx components/CompanionBubble.tsx components/CompanionChat.tsx
git commit -m "feat: add companion character assets"
```

## Task 6: TopBar Settings Entry and Test Controls

**Files:**
- Modify: `components/TopBar.tsx`
- Modify: `app/page.tsx`
- Modify: `components/CompanionChat.tsx`

**Interfaces:**
- Consumes: `CompanionState`.
- Produces:
  - A compact way to reopen companion settings/change character.
  - A non-public test acceleration control reachable from the chat drawer.

- [ ] **Step 1: Update `TopBar` props and button**

Modify `components/TopBar.tsx` props:

```ts
interface Props {
  lang: Lang;
  onOpenPlanner: () => void;
  onToggleLanguage: () => void;
  onOpenCompanion: () => void;
}
```

Change function signature:

```ts
export default function TopBar({ lang, onOpenPlanner, onToggleLanguage, onOpenCompanion }: Props) {
```

Add this button before the planner button:

```tsx
<button
  onClick={onOpenCompanion}
  className="inline-flex items-center gap-1.5 rounded-full border hairline bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-50"
>
  <span className="text-sm leading-none">✦</span>
  <span className="hidden sm:inline">{lang === "zh" ? "旅伴" : "Companion"}</span>
</button>
```

- [ ] **Step 2: Pass prop from `app/page.tsx`**

Update `TopBar` usage:

```tsx
<TopBar
  lang={lang}
  onOpenPlanner={() => openPlanner()}
  onToggleLanguage={() => setLang((value) => (value === "zh" ? "en" : "zh"))}
  onOpenCompanion={() => setCompanionChatOpen(true)}
/>
```

- [ ] **Step 3: Add test-mode toggle in chat drawer**

In `components/CompanionChat.tsx`, add a small button in the header controls before "Change":

```tsx
<button
  onClick={() => onStateChange({ ...state, testMode: !state.testMode })}
  className="rounded-full border hairline px-3 py-1.5 text-[11px] text-ink-600 hover:bg-ink-50"
  title={lang === "zh" ? "切换迁移和冒泡测试速度" : "Toggle accelerated companion timing"}
>
  {state.testMode ? (lang === "zh" ? "测试快" : "Fast") : (lang === "zh" ? "正常" : "Normal")}
</button>
```

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/TopBar.tsx components/CompanionChat.tsx
git commit -m "feat: add companion controls"
```

## Task 7: End-to-End Verification and Polish

**Files:**
- Modify only files from Tasks 1-6 if verification finds defects.

**Interfaces:**
- Consumes: completed P0 implementation.
- Produces: verified demo-ready companion flow.

- [ ] **Step 1: Run production build**

Run: `npm run build`

Expected: PASS with Next.js build completing successfully.

- [ ] **Step 2: Start local dev server**

Run: `npm run dev`

Expected: dev server prints a local URL, usually `http://localhost:3000`.

- [ ] **Step 3: Manual first-visit test**

In browser devtools, clear localStorage keys:

```js
localStorage.removeItem("aurora.companion.v1");
```

Reload.

Expected:

- Onboarding modal appears.
- Selecting a companion closes modal.
- Home status appears.
- Floating companion appears.
- Refresh keeps selected companion.

- [ ] **Step 4: Manual chat response test**

Open companion chat and send these messages:

```text
你在干嘛
吃了什么
发张照片
去巴黎
去一个海边城市
```

Expected:

- Each message gets a reply after a short typing state.
- Replies answer the message and add a topic.
- Photo request displays an image card.
- `去巴黎` changes current city to Paris and sends departure + arrival.
- Unknown/vague destination keeps conversation alive.

- [ ] **Step 5: Manual voice fallback test**

Send:

```text
你看到什么风景
```

Expected:

- At least one voice-style response can be played with browser `speechSynthesis`.
- If playback is blocked by browser policy, transcript remains visible and UI does not break.

- [ ] **Step 6: Manual passive activity test**

Enable fast test mode in the chat drawer. Close the drawer and wait 20 seconds.

Expected:

- Floating bubble appears.
- It describes current city.
- Unread count increases but caps at 3.
- Opening chat clears unread count.

- [ ] **Step 7: Layout checks**

Check viewport widths:

```text
390x844
768x1024
1440x900
```

Expected:

- Onboarding cards fit without text overlap.
- Floating bubble does not block primary Year View controls.
- Chat drawer is bottom sheet on mobile and side drawer on desktop.
- TopBar remains readable.

- [ ] **Step 8: Commit verification fixes**

If files changed during verification:

```bash
git add app components data lib public
git commit -m "fix: polish companion agent flow"
```

If no files changed, do not create an empty commit.

## Deferred Beyond P0

These items remain outside the implementation sequence above:

- Real uploaded-image-to-companion generation API.
- Persistent user accounts.
- Live LLM chat.
- Live legal image API integration.
- Large location library expansion.

## Self-Review Checklist

- Spec coverage: P0 companion selection, status, floating bubble, immediate chat, user-triggered migration, passive activity, TTS, photo card, persistence, and test acceleration are each covered by Tasks 1-7.
- P1 upload generation is represented as a visible advanced entry and is explicitly deferred beyond P0.
- Type consistency: component props use `CompanionState`, `Lang`, and functions exported from `lib/companion.ts`.
- Storage key is consistently `aurora.companion.v1`.
- No task changes `lib/planner.ts`.

