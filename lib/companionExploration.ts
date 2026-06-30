import { COMPANION_LOCATIONS } from "../data/companion";
import type { CompanionState } from "./companion";
import type { WarpStop } from "./time";
import type { WishlistItem } from "./types";

type Coordinates = {
  lat: number;
  lng: number;
};

export type CompanionExplorationSource = "direct-input" | "country-match" | "tag-match" | "random" | "nearby" | "ip-hint";

export type CompanionIpHint = {
  countryCode: string;
  city?: string;
};

export type CompanionFinding = {
  id: string;
  cityId: string;
  cityZh: string;
  cityEn: string;
  countryZh: string;
  countryEn: string;
  source: CompanionExplorationSource;
  distanceKm?: number;
  textZh: string;
  textEn: string;
  photo?: {
    src: string;
    alt: string;
    credit: string;
  };
  tags: string[];
  maturityStage: WarpStop;
  createdAt: number;
  addedToWishlist: boolean;
};

type Location = (typeof COMPANION_LOCATIONS)[number];

type ExplorationMetadata = {
  coordinates: Coordinates;
  tags: string[];
  countryCode: string;
  staged: Record<WarpStop, { zh: string; en: string }>;
};

const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  BE: "Belgium",
  CN: "China",
  FR: "France",
  IS: "Iceland",
  JP: "Japan",
  NL: "Netherlands",
  NO: "Norway",
};

const EXPLORATION_METADATA: Record<string, ExplorationMetadata> = {
  kyoto: {
    coordinates: { lat: 35.0116, lng: 135.7681 },
    countryCode: "JP",
    tags: ["blossom", "temple", "river", "quiet", "ancient", "food"],
    staged: {
      "year-start": {
        zh: "我在京都的小巷里走了一圈，这里适合放进一场慢慢看的春天旅行。",
        en: "I wandered through Kyoto lanes. This feels right for a slow spring trip.",
      },
      "t-90": {
        zh: "京都适合留 3 到 4 天，樱花季要更早锁住宿，也可以和大阪、奈良连成一条线。",
        en: "Kyoto fits 3 to 4 days. Blossom season needs early lodging, and it pairs well with Osaka and Nara.",
      },
      "t-30": {
        zh: "我把京都缩小到鸭川、寺门和傍晚小巷，路线可以按早晨拍照、下午散步来排。",
        en: "I narrowed Kyoto to the Kamo River, temple gates, and evening lanes: photos in the morning, wandering after lunch.",
      },
      "t-14": {
        zh: "京都临近出发要准备轻外套和雨具；如果下雨，就把户外散步换成茶屋和室内展。",
        en: "For Kyoto, pack a light layer and rain gear; if it rains, swap walks for teahouses and indoor exhibits.",
      },
    },
  },
  osaka: {
    coordinates: { lat: 34.6937, lng: 135.5023 },
    countryCode: "JP",
    tags: ["food", "neon", "street", "city"],
    staged: {
      "year-start": {
        zh: "大阪很适合把旅行变热闹：灯牌、小吃和夜晚都很有精神。",
        en: "Osaka is good when the trip needs energy: signs, snacks, and nights that stay awake.",
      },
      "t-90": {
        zh: "大阪可以安排 2 到 3 天，和京都、奈良组合时交通压力不大。",
        en: "Osaka works for 2 to 3 days and combines easily with Kyoto and Nara.",
      },
      "t-30": {
        zh: "我建议把道顿堀留给晚上，白天去市场或街区慢慢吃。",
        en: "I would save Dotonbori for evening and spend the day grazing through markets and neighborhoods.",
      },
      "t-14": {
        zh: "大阪临近出发要留一点夜宵预算，也别把最后一班车时间看漏。",
        en: "For Osaka, keep a snack budget and watch the last train time.",
      },
    },
  },
  nara: {
    coordinates: { lat: 34.6851, lng: 135.8048 },
    countryCode: "JP",
    tags: ["park", "quiet", "ancient", "temple"],
    staged: {
      "year-start": {
        zh: "奈良像一段安静的支线，适合放在大城市之间让脚步慢下来。",
        en: "Nara feels like a quiet side chapter between bigger cities.",
      },
      "t-90": {
        zh: "奈良适合从京都或大阪当天往返，也可以留一晚看清晨公园。",
        en: "Nara works as a day trip from Kyoto or Osaka, or one night for a quiet morning park.",
      },
      "t-30": {
        zh: "我把奈良重点放在公园、寺门和黄昏小路，不需要排得太满。",
        en: "I would keep Nara around the park, temple gates, and dusk paths without overpacking the day.",
      },
      "t-14": {
        zh: "奈良要准备好走路的鞋，雨天石阶会滑，行程要留空白。",
        en: "For Nara, bring walking shoes; rainy stone paths get slippery, so leave slack in the day.",
      },
    },
  },
  reykjavik: {
    coordinates: { lat: 64.1466, lng: -21.9426 },
    countryCode: "IS",
    tags: ["aurora", "harbor", "cold", "seaside", "nature"],
    staged: {
      "year-start": {
        zh: "雷克雅未克适合一场追光旅行，城市不大，但夜空很有戏。",
        en: "Reykjavik is right for chasing light: the city is compact, but the sky has drama.",
      },
      "t-90": {
        zh: "这里要提前看极光季、云量和租车路线，预算也要留给城外一日行程。",
        en: "Plan around aurora season, cloud cover, and day trips beyond town; keep budget for excursions.",
      },
      "t-30": {
        zh: "我会把夜晚留给追光，白天安排港口、温泉或城外瀑布。",
        en: "I would keep nights for aurora hunting and days for the harbor, hot springs, or waterfalls.",
      },
      "t-14": {
        zh: "临近出发要确认保暖层、防风外套和当晚云图，极光备选夜不能只留一天。",
        en: "Before leaving, confirm warm layers, windproof outerwear, and cloud maps; do not leave only one aurora night.",
      },
    },
  },
  mohe: {
    coordinates: { lat: 52.9721, lng: 122.5386 },
    countryCode: "CN",
    tags: ["winter", "aurora", "village", "cold"],
    staged: {
      "year-start": {
        zh: "漠河像一张很冷的明信片，适合想看冬天边界感的人。",
        en: "Mohe feels like a very cold postcard, good for anyone who wants the edge of winter.",
      },
      "t-90": {
        zh: "漠河要按低温准备装备，天数不要太短，路上时间也要算进去。",
        en: "Mohe needs cold-weather gear and enough days to absorb the travel time.",
      },
      "t-30": {
        zh: "我会把重点放在北极村、雪夜和热食，路线不要排得太紧。",
        en: "I would focus on Arctic Village, snowy nights, and hot food, with a loose route.",
      },
      "t-14": {
        zh: "临近漠河要查最低温，手套、帽子、暖宝宝和相机电池都要备份。",
        en: "Before Mohe, check the low temperature and pack backup gloves, hat, warmers, and camera batteries.",
      },
    },
  },
  wuhan: {
    coordinates: { lat: 30.5928, lng: 114.3055 },
    countryCode: "CN",
    tags: ["blossom", "lake", "breakfast", "food"],
    staged: {
      "year-start": {
        zh: "武汉适合春天和清晨，湖边、花和早餐能把一天打开。",
        en: "Wuhan works best with spring mornings: lake, blossoms, and breakfast open the day.",
      },
      "t-90": {
        zh: "武汉可以安排 2 到 3 天，花期要看天气，早餐路线值得提前标出来。",
        en: "Wuhan fits 2 to 3 days; bloom timing depends on weather, and breakfast routes are worth marking.",
      },
      "t-30": {
        zh: "我会把东湖和街头早餐放到早上，下午留给慢一点的城市散步。",
        en: "I would put East Lake and street breakfast in the morning, then leave the afternoon for slower city walks.",
      },
      "t-14": {
        zh: "临近武汉要看花期更新和雨具，清晨出门会更容易拍到空一点的湖边。",
        en: "Before Wuhan, check bloom updates and rain gear; early mornings make the lake easier to photograph.",
      },
    },
  },
  changbai: {
    coordinates: { lat: 42.0063, lng: 128.0557 },
    countryCode: "CN",
    tags: ["mountain", "lake", "weather", "snow"],
    staged: {
      "year-start": {
        zh: "长白山适合一场看天气脸色的旅行，山和湖都带一点神秘感。",
        en: "Changbai Mountain suits a weather-watching trip; the mountain and lake both feel secretive.",
      },
      "t-90": {
        zh: "长白山要预留天气机动日，天池不保证每天都能看到。",
        en: "Changbai needs weather buffer days because Tianchi is not visible every day.",
      },
      "t-30": {
        zh: "我会把天池作为核心，但同时准备温泉、林区和山脚备选。",
        en: "I would center Tianchi but prepare hot springs, forests, and foothill backups.",
      },
      "t-14": {
        zh: "临近长白山要确认景区开放、风力和保暖层，别把计划压得太满。",
        en: "Before Changbai, confirm opening status, wind, and warm layers; keep the schedule loose.",
      },
    },
  },
  kanas: {
    coordinates: { lat: 48.7047, lng: 87.0254 },
    countryCode: "CN",
    tags: ["autumn", "forest", "lake", "nature"],
    staged: {
      "year-start": {
        zh: "喀纳斯适合秋天慢慢靠近，颜色像会自己变深。",
        en: "Kanas is best approached slowly in autumn, when the colors seem to deepen by themselves.",
      },
      "t-90": {
        zh: "喀纳斯要提前看黄叶窗口，交通和住宿都不能太晚定。",
        en: "For Kanas, watch the foliage window early; transport and lodging should not be left late.",
      },
      "t-30": {
        zh: "我会把湖边、村落和林间路分开安排，不要一天塞完。",
        en: "I would separate the lake, villages, and forest roads instead of cramming them into one day.",
      },
      "t-14": {
        zh: "临近喀纳斯要查降温和道路情况，早晚温差会提醒你多带一层。",
        en: "Before Kanas, check temperature drops and roads; morning-evening swings call for an extra layer.",
      },
    },
  },
  tromso: {
    coordinates: { lat: 69.6492, lng: 18.9553 },
    countryCode: "NO",
    tags: ["aurora", "harbor", "cold", "seaside", "whale"],
    staged: {
      "year-start": {
        zh: "特罗姆瑟适合把海风和极光放在同一场旅行里。",
        en: "Tromso is good when sea wind and aurora belong in the same trip.",
      },
      "t-90": {
        zh: "这里要提前安排追光团或观鲸，冬季夜晚很长，但好位置也要抢。",
        en: "Book aurora or whale trips early; winter nights are long, but good slots go quickly.",
      },
      "t-30": {
        zh: "我会把码头、缆车和夜间追光分开，避免白天太累影响晚上。",
        en: "I would split the harbor, cable car, and night aurora hunt so the day does not drain the night.",
      },
      "t-14": {
        zh: "临近特罗姆瑟要看云图、风速和集合点，保暖鞋比好看的鞋重要。",
        en: "Before Tromso, check clouds, wind, and pickup points; warm shoes beat pretty shoes.",
      },
    },
  },
  paris: {
    coordinates: { lat: 48.8566, lng: 2.3522 },
    countryCode: "FR",
    tags: ["museum", "cafe", "river", "city", "food"],
    staged: {
      "year-start": {
        zh: "巴黎适合放进一场慢一点的城市散步旅行，河边和咖啡都很会留人。",
        en: "Paris belongs in a slower city-walk trip; the river and cafes know how to make you stay.",
      },
      "t-90": {
        zh: "巴黎适合 3 到 5 天，也能和布鲁塞尔、阿姆斯特丹连成一条线。",
        en: "Paris fits 3 to 5 days and can connect cleanly with Brussels or Amsterdam.",
      },
      "t-30": {
        zh: "我把巴黎缩小到塞纳河两岸、博物馆和傍晚街区，路线会更轻。",
        en: "I narrowed Paris to both banks of the Seine, museums, and evening neighborhoods.",
      },
      "t-14": {
        zh: "临近巴黎要确认预约、交通罢工信息和雨具，傍晚风会有点凉。",
        en: "Before Paris, confirm reservations, transit disruption info, and rain gear; evening wind can be cool.",
      },
    },
  },
  amsterdam: {
    coordinates: { lat: 52.3676, lng: 4.9041 },
    countryCode: "NL",
    tags: ["canal", "bike", "rain", "city", "seaside"],
    staged: {
      "year-start": {
        zh: "阿姆斯特丹适合一场轻快的城市旅行，桥和运河会把路线变柔软。",
        en: "Amsterdam makes a light city trip; bridges and canals soften the route.",
      },
      "t-90": {
        zh: "阿姆斯特丹可以留 2 到 3 天，也适合和布鲁塞尔或巴黎串联。",
        en: "Amsterdam works for 2 to 3 days and pairs with Brussels or Paris.",
      },
      "t-30": {
        zh: "我会把运河、博物馆和雨后街区分成几个半天，骑车别排太满。",
        en: "I would split canals, museums, and post-rain streets into half-days, without overpacking biking.",
      },
      "t-14": {
        zh: "临近阿姆斯特丹要准备防雨外套，热门博物馆预约别拖到最后。",
        en: "Before Amsterdam, pack a rain shell and do not leave major museum bookings too late.",
      },
    },
  },
  brussels: {
    coordinates: { lat: 50.8503, lng: 4.3517 },
    countryCode: "BE",
    tags: ["square", "chocolate", "train", "food", "city"],
    staged: {
      "year-start": {
        zh: "布鲁塞尔像一站甜味中转，适合把欧洲城市线接得更松一点。",
        en: "Brussels feels like a sweet stopover that loosens a European city route.",
      },
      "t-90": {
        zh: "布鲁塞尔适合 1 到 2 天，和巴黎、阿姆斯特丹之间的火车连接很顺。",
        en: "Brussels works for 1 to 2 days, with easy trains to Paris and Amsterdam.",
      },
      "t-30": {
        zh: "我会把广场、巧克力店和火车站附近路线排成轻量的一天。",
        en: "I would make a light day around the square, chocolate shops, and station-side streets.",
      },
      "t-14": {
        zh: "临近布鲁塞尔要确认火车时间和转乘余量，巧克力可以放最后一天买。",
        en: "Before Brussels, confirm train times and transfer buffers; buy chocolate on the last day.",
      },
    },
  },
};

export type CompanionExplorationOptions = {
  now?: number;
  warp?: WarpStop;
  mode?: "input" | "nearby" | "random";
  ipHint?: CompanionIpHint | null;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function getLocation(id: string): Location {
  return COMPANION_LOCATIONS.find((location) => location.id === id) ?? COMPANION_LOCATIONS[0];
}

function getCurrentLocation(state: CompanionState): Location {
  return getLocation(state.currentLocationId);
}

function metadataFor(location: Location) {
  return EXPLORATION_METADATA[location.id];
}

function countryNamesForCode(countryCode: string) {
  const countryEn = COUNTRY_CODE_TO_NAME[countryCode.toUpperCase()];
  return countryEn ? [countryEn.toLowerCase()] : [];
}

function seededIndex(length: number, seed: number) {
  if (length <= 1) return 0;
  const value = Math.abs(Math.imul(seed || 1, 2654435761));
  return value % length;
}

function cityMatches(location: Location, value: string) {
  return normalize(location.cityEn) === value || normalize(location.cityZh) === value;
}

function countryMatches(location: Location, value: string) {
  const meta = metadataFor(location);
  return (
    normalize(location.countryEn) === value ||
    normalize(location.countryZh) === value ||
    meta.countryCode.toLowerCase() === value ||
    countryNamesForCode(value).includes(normalize(location.countryEn))
  );
}

const TAG_ALIASES: Record<string, string[]> = {
  seaside: ["seaside", "harbor", "canal", "river", "lake"],
  sea: ["seaside", "harbor", "canal", "river", "lake"],
  beach: ["seaside", "harbor"],
  "海边": ["seaside", "harbor", "canal", "river", "lake"],
  "海": ["seaside", "harbor"],
  food: ["food", "cafe", "chocolate", "breakfast"],
  "美食": ["food", "cafe", "chocolate", "breakfast"],
  "吃": ["food", "cafe", "chocolate", "breakfast"],
  snow: ["snow", "winter", "cold"],
  "雪": ["snow", "winter", "cold"],
  aurora: ["aurora"],
  "极光": ["aurora"],
  blossom: ["blossom"],
  sakura: ["blossom"],
  "樱花": ["blossom"],
  mountain: ["mountain", "snow"],
  "雪山": ["mountain", "snow"],
  ancient: ["ancient", "temple", "quiet"],
  "古城": ["ancient", "temple", "quiet"],
  "小众": ["quiet", "nature", "village"],
};

function tagsFromInput(input: string) {
  const value = normalize(input);
  const directTags = new Set<string>();

  for (const [alias, tags] of Object.entries(TAG_ALIASES)) {
    if (value.includes(alias)) {
      tags.forEach((tag) => directTags.add(tag));
    }
  }

  return [...directTags];
}

function locationScoreForTags(location: Location, tags: string[]) {
  const locationTags = new Set(metadataFor(location).tags);
  return tags.filter((tag) => locationTags.has(tag)).length;
}

function distanceKm(a: Coordinates, b: Coordinates) {
  const radiusKm = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(radiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function pickPhoto(location: Location, seed: number) {
  const photos = location.photos as ReadonlyArray<{ src: string; alt: string; credit: string }>;
  return photos[seededIndex(photos.length, seed)];
}

function createFinding(location: Location, source: CompanionExplorationSource, options: Required<Pick<CompanionExplorationOptions, "now" | "warp">> & { distanceKm?: number }) {
  const meta = metadataFor(location);
  const staged = meta.staged[options.warp];
  return {
    id: `finding-${location.id}-${options.now}`,
    cityId: location.id,
    cityZh: location.cityZh,
    cityEn: location.cityEn,
    countryZh: location.countryZh,
    countryEn: location.countryEn,
    source,
    distanceKm: options.distanceKm,
    textZh: staged.zh,
    textEn: staged.en,
    photo: pickPhoto(location, options.now),
    tags: meta.tags,
    maturityStage: options.warp,
    createdAt: options.now,
    addedToWishlist: false,
  } satisfies CompanionFinding;
}

function chooseRandom(locations: Location[], currentId: string, seed: number) {
  const candidates = locations.filter((location) => location.id !== currentId);
  return candidates[seededIndex(candidates.length, seed)] ?? locations[0];
}

function chooseByIpHint(ipHint: CompanionIpHint | null | undefined, currentId: string, seed: number) {
  if (!ipHint?.countryCode) return null;
  const countryNames = countryNamesForCode(ipHint.countryCode);
  const candidates = COMPANION_LOCATIONS.filter((location) => {
    const meta = metadataFor(location);
    return (
      meta.countryCode.toLowerCase() === ipHint.countryCode.toLowerCase() ||
      countryNames.includes(normalize(location.countryEn))
    );
  });
  return candidates.length ? chooseRandom(candidates, currentId, seed) : null;
}

function chooseNearby(current: Location) {
  const currentMeta = metadataFor(current);
  const ranked = COMPANION_LOCATIONS.filter((location) => location.id !== current.id)
    .map((location) => ({
      location,
      distanceKm: distanceKm(currentMeta.coordinates, metadataFor(location).coordinates),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return ranked[0];
}

export function resolveCompanionExploration(
  input: string,
  state: CompanionState,
  options: CompanionExplorationOptions = {}
): CompanionFinding {
  const now = options.now ?? Date.now();
  const warp = options.warp ?? "year-start";
  const current = getCurrentLocation(state);

  if (options.mode === "nearby") {
    const nearby = chooseNearby(current);
    return createFinding(nearby.location, "nearby", { now, warp, distanceKm: nearby.distanceKm });
  }

  const value = normalize(input);
  if (value) {
    const city = COMPANION_LOCATIONS.find((location) => cityMatches(location, value));
    if (city) return createFinding(city, "direct-input", { now, warp });

    const countryCandidates = COMPANION_LOCATIONS.filter((location) => countryMatches(location, value));
    if (countryCandidates.length) {
      return createFinding(chooseRandom(countryCandidates, current.id, now), "country-match", { now, warp });
    }

    const tags = tagsFromInput(input);
    const tagged = COMPANION_LOCATIONS.map((location) => ({
      location,
      score: locationScoreForTags(location, tags),
    }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
    if (tagged.length) return createFinding(tagged[seededIndex(Math.min(3, tagged.length), now)].location, "tag-match", { now, warp });
  }

  const ipLocation = chooseByIpHint(options.ipHint, current.id, now);
  if (ipLocation) return createFinding(ipLocation, "ip-hint", { now, warp });

  return createFinding(chooseRandom([...COMPANION_LOCATIONS], current.id, now), "random", { now, warp });
}

export function companionFindingToWishlistItem(finding: CompanionFinding): WishlistItem {
  return {
    id: `companion-${finding.id}`,
    label: finding.cityEn,
    priorityLabel: "鎯冲幓" as WishlistItem["priorityLabel"],
    priorityScore: 2,
    source: "companion",
  };
}

function cleanHeaderValue(value: string | null) {
  if (!value) return "";
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

export function getIpLocationHintFromHeaders(headers: Headers): CompanionIpHint | null {
  const countryCode =
    cleanHeaderValue(headers.get("x-vercel-ip-country")) ||
    cleanHeaderValue(headers.get("cf-ipcountry")) ||
    cleanHeaderValue(headers.get("x-country-code"));
  const city = cleanHeaderValue(headers.get("x-vercel-ip-city")) || cleanHeaderValue(headers.get("x-city"));

  if (!/^[a-z]{2}$/i.test(countryCode)) return null;
  return city ? { countryCode: countryCode.toUpperCase(), city } : { countryCode: countryCode.toUpperCase() };
}
