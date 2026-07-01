import {
  getCompanionAction,
  getCompanionLocalTimeInfo,
  getCurrentLocation,
  type CompanionAction,
  type CompanionLocation,
  type CompanionState,
} from "./companion";

export type CompanionSceneKind =
  | "heritage"
  | "city"
  | "cafe"
  | "forest"
  | "waterfront"
  | "mountain"
  | "aurora"
  | "sleepy";

export interface CompanionScene {
  kind: CompanionSceneKind;
  sceneClassName: `scene-${CompanionSceneKind}`;
  locationClassName: `location-${CompanionLocation["id"]}`;
  className: string;
  photoSrc: string;
  pixelPhotoSrc: string;
  labelZh: string;
  labelEn: string;
}

const SCENE_COPY: Record<CompanionSceneKind, { zh: string; en: string }> = {
  heritage: { zh: "古城小路", en: "Old town lanes" },
  city: { zh: "城市街景", en: "City streets" },
  cafe: { zh: "街角餐厅", en: "Corner cafe" },
  forest: { zh: "森林旅途", en: "Forest trail" },
  waterfront: { zh: "水边街景", en: "Waterfront" },
  mountain: { zh: "山间天气", en: "Mountain weather" },
  aurora: { zh: "极光夜色", en: "Aurora night" },
  sleepy: { zh: "旅店夜晚", en: "Inn at night" },
};

function hasAnyTag(tags: readonly string[], candidates: readonly string[]) {
  return candidates.some((tag) => tags.includes(tag));
}

function sceneFromLocationTags(tags: readonly string[], action: CompanionAction, hour: number): CompanionSceneKind {
  if (action === "sleepy") return "sleepy";
  if (action === "food") return "cafe";
  if (hasAnyTag(tags, ["aurora", "winter", "cold", "whale"])) return hour >= 18 || hour <= 5 ? "aurora" : "mountain";
  if (hasAnyTag(tags, ["forest", "autumn", "park", "deer"])) return "forest";
  if (hasAnyTag(tags, ["mountain", "weather"])) return "mountain";
  if (hasAnyTag(tags, ["temple", "blossom", "quiet", "museum", "square"])) return "heritage";
  if (hasAnyTag(tags, ["harbor", "river", "canal", "lake"])) return "waterfront";
  return "city";
}

function toPixelPhotoSrc(src: string) {
  try {
    const url = new URL(src);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", "240");
    url.searchParams.set("q", "60");
    return url.toString();
  } catch {
    return src.replace(/([?&])w=\d+/i, "$1w=240").replace(/([?&])q=\d+/i, "$1q=60");
  }
}

export function getCompanionScene(state: CompanionState, now = Date.now()): CompanionScene {
  const location = getCurrentLocation(state);
  const action = getCompanionAction(state, now);
  const timeInfo = getCompanionLocalTimeInfo(state, now);
  const kind = sceneFromLocationTags(location.tags, action, timeInfo.hour);
  const copy = SCENE_COPY[kind];
  const photo = location.photos[0];
  const photoSrc = photo?.src ?? "";

  return {
    kind,
    sceneClassName: `scene-${kind}`,
    locationClassName: `location-${location.id}`,
    className: `scene-${kind} location-${location.id}`,
    photoSrc,
    pixelPhotoSrc: toPixelPhotoSrc(photoSrc),
    labelZh: copy.zh,
    labelEn: copy.en,
  };
}
