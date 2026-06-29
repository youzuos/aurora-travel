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

export interface CompanionMessageOptions {
  incrementUnread?: boolean;
}

type Intent = "status" | "food" | "photo" | "people" | "scenery" | "move" | "unknown";
type SnippetGroup = {
  status: readonly string[];
  food: readonly string[];
  people: readonly string[];
  scenery: readonly string[];
  photo: readonly string[];
  arrival: readonly string[];
};

const DEFAULT_LOCATION_ID = "kyoto";

const SNIPPET_OVERRIDES: Partial<
  Record<
    string,
    {
      zh: Partial<SnippetGroup>;
      en: Partial<SnippetGroup>;
    }
  >
> = {
  kyoto: {
    zh: {
      status: [
        "我沿着鸭川慢慢走，风一直想把围巾往肩后拖。",
        "我刚躲进一条安静的小巷，木窗缝里有一点茶香飘出来。",
        "我在寺门外停了一会，听见扫地的声音比脚步还轻。",
      ],
      food: [
        "我吃了热抹茶团子，竹签还留着一点甜味。",
        "我刚喝了一小杯焙茶，掌心终于从晨风里暖回来。",
        "点心铺给了我一块樱叶饼，甜味像刚落下来的花瓣。",
      ],
      people: [
        "修相机的老爷爷说，旧镜头最懂得记住春天。",
        "借我地图的店员提醒我，傍晚的石板路最适合慢慢走。",
        "河边拍照的学生问我，要不要等风停了再按快门。",
      ],
      scenery: [
        "寺门才刚刚推开一点，石阶上已经落了薄薄一层花影。",
        "天色还没亮透，河面像被谁轻轻铺了一层银灰色的纸。",
        "远处的山线很淡，樱花枝头倒是先把清晨点亮了。",
      ],
      photo: [
        "给你看一张刚醒来的京都，空气像洗过一样干净。",
        "这张京都有一点晨雾，连屋檐都像在轻声说话。",
        "我把京都的风也拍进来了，照片边缘都是很轻的花影。",
      ],
    },
    en: {
      status: [
        "I walked along the Kamo River and the wind kept tugging my scarf backward.",
        "I slipped into a quiet lane just now, and tea drifted out through the wooden windows.",
        "I paused outside a temple gate where the sound of sweeping was softer than footsteps.",
      ],
      food: [
        "I ate warm matcha dango, and the bamboo skewer still tastes a little sweet.",
        "I just had a small cup of hojicha, and my hands finally warmed up from the morning wind.",
        "A sweets shop gave me a sakura mochi, and the sweetness felt like a petal landing on my tongue.",
      ],
      people: [
        "The old camera repairman told me old lenses remember spring best.",
        "A shopkeeper who lent me a map said the stone lanes are best at dusk.",
        "A student by the river asked if I wanted to wait for the wind to settle before taking another photo.",
      ],
      scenery: [
        "The temple gate was only barely open, and blossom shadows had already settled over the stone steps.",
        "The sky was still half-asleep, and the river looked like it had been covered with silver paper.",
        "The mountain line is faint, but the blossoms already found a way to light the morning first.",
      ],
      photo: [
        "Here is Kyoto just waking up. The air looks freshly washed.",
        "This Kyoto frame caught a little morning mist, and even the eaves sound quiet.",
        "I think I caught Kyoto's breeze too. The edges of the photo are all soft blossom shadows.",
      ],
    },
  },
  osaka: {
    zh: {
      status: [
        "我在道顿堀边看霓虹映进水里，背包还沾着一点章鱼烧酱。",
        "我刚从热闹的人群里钻出来，耳边还全是招牌和笑声。",
        "桥上风很大，差点把我手里的纸巾吹进河里。",
      ],
      food: [
        "我吃了刚出炉的章鱼烧，烫得我只能对着它认真吹气。",
        "我刚分到一串炸串，外壳脆得像轻轻一碰就会响。",
        "便利店的冰汽水救了我一命，不然舌头还在和酱汁打架。",
      ],
      people: [
        "摊主阿姨教我怎么翻章鱼烧，我翻得像在修一只会发光的小机器。",
        "隔壁排队的大叔说，越热闹的店越值得多等两分钟。",
        "帮我让路的游客还顺手给我指了一个能拍到河面的角度。",
      ],
      scenery: [
        "整条河像被霓虹扯成了会晃动的彩线，城市一直在眨眼。",
        "招牌亮起来的时候，连晚风都像有了节拍。",
        "桥下的水面一会亮一会暗，像整座城在换频道。",
      ],
      photo: [
        "这张大阪有点吵，但热气和快乐都是真的。",
        "我把大阪的灯拍成了一层糖纸，亮得有点舍不得眨眼。",
        "这张照片里连空气都在冒泡，像夜色刚刚出锅。",
      ],
    },
    en: {
      status: [
        "I am beside Dotonbori watching neon lights, with a little takoyaki sauce on my backpack.",
        "I just squeezed out of a noisy crowd, and the signs are still ringing in my ears.",
        "The wind on the bridge nearly stole the napkin from my hand and dropped it into the river.",
      ],
      food: [
        "I ate takoyaki fresh off the griddle, and it was hot enough to demand a serious cooling ritual.",
        "I just shared a skewer of kushikatsu, and the crust cracked like a tiny firework.",
        "A cold soda from the convenience store saved me, or my tongue would still be arguing with the sauce.",
      ],
      people: [
        "A stall auntie taught me how to flip takoyaki, and I looked like I was repairing a glowing machine.",
        "A man in the next line said the busiest places are usually worth waiting two more minutes for.",
        "A tourist who made room for me also pointed out the best angle for catching the river lights.",
      ],
      scenery: [
        "The whole river looks like neon pulled into bright threads, and the city keeps blinking.",
        "Once the signs light up, even the evening wind seems to find a rhythm.",
        "The water under the bridge keeps changing channels between light and shadow.",
      ],
      photo: [
        "This Osaka frame is loud, but the heat and joy are both real.",
        "I turned Osaka's signs into a layer of candy wrapper light.",
        "Even the air looks fizzy in this one, like the night just came off the stove.",
      ],
    },
  },
  nara: {
    zh: {
      status: [
        "我躲在奈良公园边避雨，镜头上起了一层很薄的雾。",
        "小鹿刚刚认真闻了闻我的相机带，好像在检查我是不是新来的。",
        "我坐在石灯笼旁边等风停，叶子掉下来都很有礼貌。",
      ],
      food: [
        "我吃了热团子，甜味从掌心一直暖到围巾边。",
        "刚喝了一口热茶，雨天一下就没有那么湿冷了。",
        "小铺子的米饼有点焦香，咬下去的时候像踩碎一小片秋天。",
      ],
      people: [
        "卖团子的阿姨说，下雨天的小鹿会比平时更爱靠近人。",
        "帮我撑了一会伞的游客提醒我，傍晚的公园会更安静。",
        "寺门口的管理员看我蹲太久，还笑着指了条不那么湿的小路。",
      ],
      scenery: [
        "湿润的苔藓把石灯笼都变得很安静，连树叶落下都听得见。",
        "雨丝把公园织得很轻，小鹿走过去像在云上留脚印。",
        "木檐下的影子很深，远一点的树线却柔软得像刚泡开的茶。",
      ],
      photo: [
        "给你看一张下雨的奈良，连小鹿都走得比平时慢一点。",
        "这张奈良安静得像一口没被打扰过的深呼吸。",
        "我把雨里的石灯笼拍下来了，整张照片都很轻。",
      ],
    },
    en: {
      status: [
        "I am hiding from the rain near Nara Park, and my camera lens has fogged up a little.",
        "A deer just inspected my camera strap like it was checking whether I belong here.",
        "I sat by a stone lantern to wait for the wind to settle, and even falling leaves sounded polite.",
      ],
      food: [
        "I ate warm dango, and the sweetness warmed everything from my hands to the edge of my scarf.",
        "I just had a sip of hot tea, and the rainy air feels less damp now.",
        "The rice cracker from a tiny stall was a little smoky, like biting into a small piece of autumn.",
      ],
      people: [
        "A dango auntie told me the deer get extra clingy on rainy days.",
        "A traveler who shared an umbrella said the park grows quieter near evening.",
        "The attendant at the temple gate laughed at how long I had been crouching there and pointed me to a drier path.",
      ],
      scenery: [
        "The damp moss makes the stone lanterns feel extra quiet, and you can hear leaves land.",
        "Rain threads the park together so lightly that the deer look like they are leaving hoofprints on a cloud.",
        "The shadows under the eaves are deep, but the line of trees farther out is soft like tea just opening.",
      ],
      photo: [
        "Here is rainy Nara. Even the deer are walking slower than usual.",
        "This Nara frame feels like one long uninterrupted breath.",
        "I caught the stone lanterns in the rain, and the whole photo turned feather-light.",
      ],
    },
  },
  paris: {
    zh: {
      status: [
        "我边整理塞纳河边的照片边躲鸽子，它们总觉得我的背包里藏了面包。",
        "我刚换到靠窗的位置，玻璃上映着一点金色的傍晚。",
        "桥上的风有点凉，我只好把围巾又绕了一圈。",
      ],
      food: [
        "我吃了一个可颂，碎屑掉进围巾里，闻起来像一小朵黄油云。",
        "刚刚那杯咖啡有点苦，但和窗边的光线特别配。",
        "我分到一块巧克力挞，甜味在舌尖停得比街灯还久。",
      ],
      people: [
        "咖啡馆老板问我要不要再坐一会，因为今天的光线刚刚好。",
        "在桥边画画的人说，傍晚的河水会把城市画得更温柔一点。",
        "路过的邮差看我写明信片，认真推荐了一个更安静的邮筒。",
      ],
      scenery: [
        "傍晚的铁塔像慢慢亮起来的邮票，天边还留着一点玫瑰色。",
        "河面把桥洞和晚霞拉成很长的倒影，像城市在伸懒腰。",
        "街角的灯刚亮，石墙就先学会了发光。",
      ],
      photo: [
        "这是巴黎黄昏版，风像一张刚写完的明信片。",
        "我把巴黎的晚光折进这张照片里了，边缘都是柔软的金色。",
        "这张照片里连塞纳河都很轻，像怕惊动正在亮起的街灯。",
      ],
    },
    en: {
      status: [
        "I am sorting photos by the Seine while the pigeons keep assuming my backpack hides bread.",
        "I just moved to a window table, and the glass is catching a little gold from the evening.",
        "The wind on the bridge turned cool, so I wrapped my scarf one more time.",
      ],
      food: [
        "I ate a croissant, and crumbs fell into my scarf. It smelled like a small butter cloud.",
        "The coffee I just had was a little bitter, but it matched the window light perfectly.",
        "I shared a slice of chocolate tart, and the sweetness lingered longer than the streetlamps.",
      ],
      people: [
        "The cafe owner asked if I wanted to stay longer because the light was just right today.",
        "A painter on the bridge said the river softens the whole city near dusk.",
        "A postman noticed me writing postcards and pointed out a quieter mailbox around the corner.",
      ],
      scenery: [
        "The tower at dusk looks like a stamp slowly lighting up, with a little rose color still in the sky.",
        "The river stretches the arches and sunset into long reflections, like the city is waking from a nap.",
        "The corner lamps only just switched on, but the stone walls already learned how to glow.",
      ],
      photo: [
        "This is Paris at dusk, and the wind feels like a postcard I just finished writing.",
        "I folded the last light of Paris into this frame, and the edges stayed soft and gold.",
        "Even the Seine looks feather-light here, like it does not want to disturb the streetlamps as they wake up.",
      ],
    },
  },
};

const VAGUE_DESTINATION_RULES: ReadonlyArray<{
  patterns: readonly RegExp[];
  tags: readonly string[];
}> = [
  {
    patterns: [/(海边|大海|海|港口|码头)/u, /\bsea(side)?\b/i, /\bharbou?r\b/i, /\bport\b/i, /\bpier\b/i],
    tags: ["harbor", "canal", "river"],
  },
  {
    patterns: [/(山|雪山|湖)/u, /\bmountain(s)?\b/i, /\blake\b/i, /\bsnow(y)?\b/i],
    tags: ["mountain", "lake"],
  },
  {
    patterns: [/(极光|夜空)/u, /\baurora\b/i, /\bnight sky\b/i, /\bstars?\b/i],
    tags: ["aurora"],
  },
  {
    patterns: [/(秋天|森林)/u, /\bautumn\b/i, /\bforest\b/i, /\bfall\b/i],
    tags: ["autumn", "forest"],
  },
  {
    patterns: [/(吃的|美食|甜点)/u, /\bfood\b/i, /\bcafe\b/i, /\bdessert\b/i, /\bchocolate\b/i],
    tags: ["food", "cafe", "chocolate"],
  },
  {
    patterns: [/(安静|寺庙|樱花)/u, /\bquiet\b/i, /\btemple\b/i, /\bblossom\b/i, /\bsakura\b/i],
    tags: ["quiet", "temple", "blossom"],
  },
];

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
    if (existingIds.has(message.id)) continue;
    merged.push(message);
    existingIds.add(message.id);
  }

  return merged.slice(-60);
}

function nextUnreadCount(unreadCount: number, incrementUnread: boolean) {
  return incrementUnread ? Math.min(3, unreadCount + 1) : unreadCount;
}

function getLocationSnippets(location: CompanionLocation) {
  const override = SNIPPET_OVERRIDES[location.id];
  if (!override) {
    return {
      zh: location.snippetsZh,
      en: location.snippetsEn,
    };
  }

  return {
    zh: {
      ...location.snippetsZh,
      ...override.zh,
    },
    en: {
      ...location.snippetsEn,
      ...override.en,
    },
  };
}

function detectIntent(input: string): Intent {
  const value = normalizeInput(input);
  if (/(go to|visit|travel|move|去|去往|带我去|送我去|前往)/i.test(value)) return "move";
  if (/(food|eat|drink|restaurant|餐|吃|喝|午餐|晚餐|小吃|美食|甜点)/i.test(value)) return "food";
  if (/(photo|picture|image|show me|拍|照片|图片|相片|拍照|景点)/i.test(value)) return "photo";
  if (/(people|meet|met|person|认识|遇见|遇到|朋友)/i.test(value)) return "people";
  if (/(scenery|view|see|景色|风景|风光|夜景)/i.test(value)) return "scenery";
  if (/(where|what are you doing|status|现在|当前|在哪|还好吗|在做什么|更新)/i.test(value) || value.length <= 8) {
    return "status";
  }
  return "unknown";
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

function chooseNextLocation(state: CompanionState): CompanionLocation {
  const current = getCurrentLocation(state);
  const neighbor = current.neighbors[0];
  return neighbor ? getLocation(neighbor) : COMPANION_LOCATIONS[0];
}

export function selectCharacter(state: CompanionState, characterId: string, now = Date.now()): CompanionState {
  const character = getCharacter(characterId);
  const location = getCurrentLocation(state);
  const snippets = getLocationSnippets(location);
  const arrival = createAgentMessage(
    "text",
    `${character.nameZh} 已到达。${snippets.zh.arrival[0]}`,
    `${character.nameEn} has arrived. ${snippets.en.arrival[0]}`,
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
  const snippets = lang === "zh" ? getLocationSnippets(location).zh.status : getLocationSnippets(location).en.status;
  return pickByCursor(snippets, state.statusCursor);
}

export function maybeAdvanceCompanionLocation(
  state: CompanionState,
  now = Date.now(),
  options: CompanionMessageOptions = {}
): CompanionState {
  const { incrementUnread = true } = options;
  const stayMs = state.testMode ? COMPANION_TIMING.testStayMs : COMPANION_TIMING.productionStayMs;
  if (now - state.lastMovedAt < stayMs) return { ...state, lastActiveAt: now };

  const next = chooseNextLocation(state);
  const nextSnippets = getLocationSnippets(next);
  const arrival = createAgentMessage("text", nextSnippets.zh.arrival[0], nextSnippets.en.arrival[0], now);

  return {
    ...state,
    currentLocationId: next.id,
    lastMovedAt: now,
    lastActiveAt: now,
    statusCursor: state.statusCursor + 1,
    messageHistory: appendMessages(state.messageHistory, [arrival]),
    unreadCount: nextUnreadCount(state.unreadCount, incrementUnread),
  };
}

function messageForIntent(
  intent: Exclude<Intent, "move">,
  location: CompanionLocation,
  now: number,
  cursor: number
) {
  const { zh, en } = getLocationSnippets(location);
  if (intent === "photo") {
    const photo = pickByCursor(location.photos as ReadonlyArray<{ src: string; alt: string; credit: string }>, cursor);
    const captionZh = pickByCursor(zh.photo, cursor);
    const captionEn = pickByCursor(en.photo, cursor);
    return createAgentMessage("image", captionZh, captionEn, now, {
      image: {
        src: photo.src,
        alt: photo.alt,
        credit: photo.credit,
        captionZh,
        captionEn,
      },
    });
  }
  if (intent === "food") return createAgentMessage("mixed", pickByCursor(zh.food, cursor), pickByCursor(en.food, cursor), now);
  if (intent === "people") return createAgentMessage("text", pickByCursor(zh.people, cursor), pickByCursor(en.people, cursor), now);
  if (intent === "scenery") {
    return createAgentMessage("voice", pickByCursor(zh.scenery, cursor), pickByCursor(en.scenery, cursor), now, {
      voiceDurationSec: 8,
    });
  }
  if (intent === "status") {
    return createAgentMessage("text", pickByCursor(zh.status, cursor), pickByCursor(en.status, cursor), now);
  }

  const statusZh = pickByCursor(zh.status, cursor);
  const statusEn = pickByCursor(en.status, cursor);
  return createAgentMessage(
    "text",
    `${statusZh} 还想听我讲些吃的、见到的人，还是给你来张照片吗？`,
    `${statusEn} I can share food notes, people I met, or a photo if you want.`,
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
      const targetSnippets = getLocationSnippets(target);
      const depart = createAgentMessage(
        "text",
        `我明白了，我会先收好相机，马上前往${target.cityZh}。`,
        `Got it. I am heading to ${target.cityEn} right away.`,
        now + 250
      );
      const arrival = createAgentMessage("text", targetSnippets.zh.arrival[0], targetSnippets.en.arrival[0], now + 900);
      return {
        state: {
          ...state,
          currentLocationId: target.id,
          lastMovedAt: now,
          lastActiveAt: now,
          statusCursor: state.statusCursor + 1,
          messageHistory: appendMessages(state.messageHistory, [userMessage, depart, arrival]),
          unreadCount: 0,
        },
        messages: [userMessage, depart, arrival],
      };
    }

    const fallback = createAgentMessage(
      "text",
      "先告诉我更具体一点的城市、国家，或者告诉我想去海边、山里、看极光之类的地方，我就能马上出发。",
      "Tell me a city, a country, or a place like the seaside, mountains, or aurora, and I can head there right away.",
      now + 300
    );
    return {
      state: {
        ...state,
        lastActiveAt: now,
        messageHistory: appendMessages(state.messageHistory, [userMessage, fallback]),
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
      messageHistory: appendMessages(state.messageHistory, [userMessage, reply]),
      unreadCount: 0,
    },
    messages: [userMessage, reply],
  };
}

export function addPassiveCompanionMessage(
  state: CompanionState,
  lang: Lang,
  now = Date.now(),
  options: CompanionMessageOptions = {}
): { state: CompanionState; message: CompanionMessage } {
  const { incrementUnread = true } = options;
  const location = getCurrentLocation(state);
  const message = messageForIntent("status", location, now, state.statusCursor);
  return {
    state: {
      ...state,
      lastActiveAt: now,
      statusCursor: state.statusCursor + 1,
      messageHistory: appendMessages(state.messageHistory, [message]),
      unreadCount: nextUnreadCount(state.unreadCount, incrementUnread),
    },
    message,
  };
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
