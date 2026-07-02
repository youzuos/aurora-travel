import type { CompanionAction } from "@/lib/companion";
import type { Lang } from "@/lib/types";

export type CompanionTouchZone = "head" | "camera" | "backpack" | "hand";
export type CompanionInteractionKind = "hover" | "wave" | "pat" | "camera" | "bag";

export type CompanionInteractionContext = {
  cityName?: string;
  localHour?: number;
  meal?: string;
  currentAction?: CompanionAction;
};

export type CompanionTouchReaction = {
  zone: CompanionTouchZone;
  interaction: CompanionInteractionKind;
  action: CompanionAction;
  text: string;
  durationMs: number;
};

type KnownMeal = "breakfast" | "lunch" | "dinner" | "snack";

const MEAL_LABEL_ZH: Record<KnownMeal, string> = {
  breakfast: "早饭",
  lunch: "午饭",
  dinner: "晚饭",
  snack: "小吃",
};

const MEAL_LABEL_EN: Record<KnownMeal, string> = {
  breakfast: "breakfast",
  lunch: "lunch",
  dinner: "dinner",
  snack: "snack",
};

function pick<T>(items: T[], seed: number) {
  return items[Math.abs(seed) % items.length];
}

function isNight(hour: number | undefined) {
  return typeof hour === "number" && (hour >= 19 || hour < 6);
}

function isMeal(meal: CompanionInteractionContext["meal"]) {
  return meal === "breakfast" || meal === "lunch" || meal === "dinner";
}

function normalizeMeal(meal: CompanionInteractionContext["meal"]): KnownMeal {
  return isMeal(meal) ? meal : "snack";
}

function cityPrefix(lang: Lang, cityName?: string) {
  if (!cityName) return "";
  return lang === "zh" ? `${cityName}的` : `${cityName}'s `;
}

export function resolveCompanionTouchReaction(
  zone: CompanionTouchZone,
  lang: Lang,
  context: CompanionInteractionContext = {},
  seed = 0
): CompanionTouchReaction {
  const city = cityPrefix(lang, context.cityName);
  const meal = normalizeMeal(context.meal);
  const mealZh = MEAL_LABEL_ZH[meal];
  const mealEn = MEAL_LABEL_EN[meal];

  if (zone === "head") {
    return {
      zone,
      interaction: "pat",
      action: "sleepy",
      text: pick(
        lang === "zh" ? ["摸摸头收到", "我会乖乖探路", "有点舒服"] : ["Pat received", "I'll scout carefully", "That feels nice"],
        seed
      ),
      durationMs: 1500,
    };
  }

  if (zone === "camera") {
    const nightLines =
      lang === "zh"
        ? [`咔嚓，${city}夜色收好了`, `我拍到${city}灯光啦`, `${city}光亮起来了`]
        : [`Click, I saved ${city}night light`, `I caught ${city}lights`, `${city}light just switched on`];
    const dayLines =
      lang === "zh"
        ? [`咔嚓，${city}光收好了`, `我拍到${city}街角啦`, `${city}这一束光很好看`]
        : [`Click, I saved ${city}light`, `I caught a ${city}corner`, `This ${city}patch of light is lovely`];

    return {
      zone,
      interaction: "camera",
      action: "photo",
      text: pick(isNight(context.localHour) ? nightLines : dayLines, seed),
      durationMs: 1300,
    };
  }

  if (zone === "backpack") {
    const wantsFood = isMeal(context.meal) || context.currentAction === "food";
    return {
      zone,
      interaction: "bag",
      action: wantsFood ? "food" : "map",
      text: pick(
        wantsFood
          ? lang === "zh"
            ? [`包里有${mealZh}线索`, "闻到一点小吃香气", "我把好吃的记下来了"]
            : [`I packed a ${mealEn} clue`, "I smell a snack nearby", "I saved the tasty lead"]
          : lang === "zh"
            ? ["地图在包里", "我看看下一条路", "路线我记着呢"]
            : ["The map is in my bag", "I'll check the next street", "I remember the route"],
        seed
      ),
      durationMs: 1150,
    };
  }

  return {
    zone,
    interaction: "wave",
    action: "excited",
    text: pick(lang === "zh" ? ["我在这里", "准备出发", "收到你的招呼"] : ["I'm here", "Ready to go", "I saw your wave"], seed),
    durationMs: 950,
  };
}
