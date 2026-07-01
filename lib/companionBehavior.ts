import type { CompanionAction } from "./companion";
import type { Lang } from "./types";

export type CompanionBehaviorProfile = {
  characterId: string;
  interestTags: string[];
  preferredActions: CompanionAction[];
  promptLines: {
    zh: string[];
    en: string[];
  };
  llmGuidance: string;
};

const DEFAULT_PROFILE: CompanionBehaviorProfile = {
  characterId: "default",
  interestTags: ["city", "photo", "food"],
  preferredActions: ["walking", "photo", "map"],
  promptLines: {
    zh: [
      "我顺手记下了一个很适合放进旅行清单的小细节。",
      "我一边走一边替你看路线，感觉这里可以再多留一会儿。",
    ],
    en: [
      "I tucked away one small detail that feels worth adding to a trip list.",
      "I am walking and checking the route for you; this place feels worth a little more time.",
    ],
  },
  llmGuidance: "Notice practical travel details, small discoveries, and what would help the user decide.",
};

const PROFILES: Record<string, CompanionBehaviorProfile> = {
  aoki: {
    characterId: "aoki",
    interestTags: ["rain", "river", "lake", "temple", "quiet", "blossom"],
    preferredActions: ["map", "walking", "photo"],
    promptLines: {
      zh: ["我把地图折好，沿着有水声的小路慢慢探过去。", "雨后石板路很亮，我忍不住多看了几眼。"],
      en: ["I folded the map neatly and followed the little road with water sounds.", "The stones after rain are shining, so I keep looking down at the path."],
    },
    llmGuidance: "Aoki favors rain-washed paths, rivers, temples, quiet routes, and careful map-reading.",
  },
  mira: {
    characterId: "mira",
    interestTags: ["city", "cafe", "river", "museum", "neon", "square", "photo"],
    preferredActions: ["photo", "walking", "excited"],
    promptLines: {
      zh: ["我追着一束斜斜的光跑到街角，刚好能拍到窗边和路牌。", "相机里有一个很好看的转角，我想先替你存下来。"],
      en: ["I followed a slant of light to a street corner where the window and sign looked perfect together.", "There is a beautiful corner in my camera, and I want to save it for you first."],
    },
    llmGuidance: "Mira should notice light, street corners, cameras, pretty city details, dusk, cafes, and visual composition.",
  },
  lumo: {
    characterId: "lumo",
    interestTags: ["night", "neon", "aurora", "city", "harbor"],
    preferredActions: ["photo", "excited", "walking"],
    promptLines: {
      zh: ["我等灯牌亮起来以后才出门，夜色像刚擦亮的小星星。", "这里的霓虹很适合慢慢拍，我的尾巴都跟着晃了。"],
      en: ["I waited until the signs lit up; the night looks like tiny polished stars.", "The neon here is worth photographing slowly, and even my tail is swaying along."],
    },
    llmGuidance: "Lumo favors night walks, neon, aurora, harbor lights, brave little discoveries, and late city energy.",
  },
  piko: {
    characterId: "piko",
    interestTags: ["food", "street", "breakfast", "chocolate", "cafe", "market"],
    preferredActions: ["food", "walking", "excited"],
    promptLines: {
      zh: ["我闻到一阵热乎乎的小吃香味，已经把摊位位置记在心里了。", "这条街的味道很热闹，我想先替你尝一口。"],
      en: ["I smelled a warm snack from a stall and already memorized where it is.", "This street smells lively; I want to try one bite for you first."],
    },
    llmGuidance: "Piko should notice snacks, markets, smells, breakfast, street food, shopkeepers, and cheerful crowd energy.",
  },
  nori: {
    characterId: "nori",
    interestTags: ["train", "canal", "temple", "city", "maps", "route"],
    preferredActions: ["map", "walking", "photo"],
    promptLines: {
      zh: ["我把车票夹进地图里，顺手标了一个更省力的换乘点。", "这条路线可以走得很轻快，我已经替你圈出下一站。"],
      en: ["I tucked the ticket into my map and marked an easier transfer point.", "This route can stay light and quick; I already circled the next stop for you."],
    },
    llmGuidance: "Nori favors maps, trains, efficient routes, ticket stubs, canals, and dependable planning details.",
  },
  bobo: {
    characterId: "bobo",
    interestTags: ["people", "quiet", "village", "square", "slow"],
    preferredActions: ["walking", "idle", "excited"],
    promptLines: {
      zh: ["我走得慢一点，刚好听见路边的人讲了一个很温柔的小故事。", "这里适合坐下来慢慢看，人情味比路标还清楚。"],
      en: ["I walked a little slower and caught a kind little story from someone nearby.", "This place is good for sitting and watching; the human warmth is clearer than the signs."],
    },
    llmGuidance: "Bobo favors slow travel, kind strangers, village warmth, squares, quiet observation, and human stories.",
  },
  toto: {
    characterId: "toto",
    interestTags: ["aurora", "cold", "winter", "harbor", "snow", "night"],
    preferredActions: ["excited", "sleepy", "photo"],
    promptLines: {
      zh: ["我把围巾裹紧，想再等等天边会不会亮起一点绿色。", "冷风很认真，但我觉得今晚值得守一守。"],
      en: ["I wrapped my scarf tighter and am waiting to see if the sky turns a little green.", "The cold wind is serious, but tonight feels worth waiting for."],
    },
    llmGuidance: "Toto favors cold nights, aurora patience, snow, harbors, warm layers, and quiet waiting under the sky.",
  },
  momo: {
    characterId: "momo",
    interestTags: ["quiet", "museum", "temple", "canal", "details", "photo"],
    preferredActions: ["photo", "idle", "map"],
    promptLines: {
      zh: ["我看起来有点困，但刚刚把门把手上的小花纹都记下来了。", "这里的小细节很会说话，我想慢慢拍给你看。"],
      en: ["I look a little sleepy, but I just noticed every tiny pattern on the door handle.", "The small details here have a quiet voice, and I want to photograph them slowly for you."],
    },
    llmGuidance: "Momo favors quiet details, museums, temples, canals, small patterns, and calm photo notes.",
  },
};

export function getCompanionBehaviorProfile(characterId?: string | null): CompanionBehaviorProfile {
  return characterId ? PROFILES[characterId] ?? DEFAULT_PROFILE : DEFAULT_PROFILE;
}

export function pickInterestPromptLine(characterId: string | null | undefined, lang: Lang, seed: number): string {
  const profile = getCompanionBehaviorProfile(characterId);
  const lines = lang === "zh" ? profile.promptLines.zh : profile.promptLines.en;
  return lines[Math.abs(seed) % lines.length] ?? "";
}

export function chooseInterestWeightedAction(
  characterId: string | null | undefined,
  fallbackAction: CompanionAction,
  seed: number,
  sleeping: boolean
): CompanionAction {
  if (sleeping) return "sleepy";
  const profile = getCompanionBehaviorProfile(characterId);
  if (fallbackAction !== "idle" && fallbackAction !== "walking") return fallbackAction;
  return profile.preferredActions[Math.abs(seed) % profile.preferredActions.length] ?? fallbackAction;
}
