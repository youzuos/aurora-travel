import type { CompanionAction } from "./companion";

export function getPixelCompanionMotionClass(action: CompanionAction, animated = true) {
  if (!animated) return "";

  const motionClasses: Record<CompanionAction, string> = {
    idle: "pixel-idle",
    walking: "pixel-walk",
    photo: "pixel-photo",
    food: "pixel-food",
    map: "pixel-map",
    sleepy: "pixel-sleepy",
    excited: "pixel-hop",
  };

  return motionClasses[action];
}
