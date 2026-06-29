"use client";

import type { CompanionAction, CompanionCharacter } from "@/lib/companion";

interface Props {
  character: CompanionCharacter;
  action: CompanionAction;
  label: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

type AnimalKind = CompanionCharacter["animal"];

const PALETTES: Record<AnimalKind, { main: string; dark: string; light: string; cheek: string }> = {
  frog: { main: "#68c277", dark: "#2f7f4f", light: "#b7efbb", cheek: "#f5a5a5" },
  fox: { main: "#f28b45", dark: "#8e4b28", light: "#ffd7a6", cheek: "#f5a5a5" },
  cat: { main: "#8a8f98", dark: "#4b5563", light: "#d9dee5", cheek: "#f0a6bd" },
  dog: { main: "#b98155", dark: "#6b4631", light: "#f0d0aa", cheek: "#f4a7a0" },
  rabbit: { main: "#f3f0e8", dark: "#9aa0a6", light: "#ffffff", cheek: "#f2a8c4" },
  bear: { main: "#9b6a43", dark: "#5b3d2b", light: "#d7b48a", cheek: "#efaa91" },
  penguin: { main: "#2f4154", dark: "#172333", light: "#f5f1df", cheek: "#f4b0a2" },
  panda: { main: "#f4f0e4", dark: "#27313b", light: "#ffffff", cheek: "#f0a4a4" },
};

const ACTION_LABELS: Record<CompanionAction, string> = {
  idle: "idle",
  walking: "walking",
  photo: "taking photo",
  food: "holding food",
  map: "reading map",
  sleepy: "sleepy",
  excited: "excited",
};

function earRects(animal: AnimalKind, palette: (typeof PALETTES)[AnimalKind]) {
  if (animal === "frog") {
    return (
      <>
        <rect x="10" y="9" width="7" height="7" fill={palette.main} />
        <rect x="47" y="9" width="7" height="7" fill={palette.main} />
      </>
    );
  }
  if (animal === "rabbit") {
    return (
      <>
        <rect x="15" y="4" width="7" height="18" fill={palette.main} />
        <rect x="42" y="4" width="7" height="18" fill={palette.main} />
        <rect x="17" y="8" width="3" height="10" fill="#f5b5c9" />
        <rect x="44" y="8" width="3" height="10" fill="#f5b5c9" />
      </>
    );
  }
  if (animal === "penguin") {
    return null;
  }
  return (
    <>
      <rect x="13" y="10" width="8" height="8" fill={palette.dark} />
      <rect x="43" y="10" width="8" height="8" fill={palette.dark} />
      <rect x="16" y="13" width="3" height="3" fill={palette.light} />
      <rect x="45" y="13" width="3" height="3" fill={palette.light} />
    </>
  );
}

function faceDetails(animal: AnimalKind, palette: (typeof PALETTES)[AnimalKind], sleepy: boolean) {
  const eye = sleepy ? (
    <>
      <rect x="21" y="26" width="6" height="2" fill={palette.dark} />
      <rect x="38" y="26" width="6" height="2" fill={palette.dark} />
    </>
  ) : (
    <>
      <rect x="22" y="24" width="4" height="5" fill={palette.dark} />
      <rect x="39" y="24" width="4" height="5" fill={palette.dark} />
    </>
  );

  if (animal === "panda") {
    return (
      <>
        <rect x="19" y="22" width="9" height="9" fill={palette.dark} />
        <rect x="37" y="22" width="9" height="9" fill={palette.dark} />
        {eye}
        <rect x="31" y="31" width="4" height="3" fill={palette.dark} />
      </>
    );
  }

  if (animal === "penguin") {
    return (
      <>
        <rect x="18" y="19" width="28" height="24" fill={palette.light} />
        {eye}
        <rect x="30" y="31" width="6" height="4" fill="#f2a33b" />
      </>
    );
  }

  if (animal === "fox") {
    return (
      <>
        <rect x="18" y="23" width="28" height="16" fill={palette.light} />
        {eye}
        <rect x="31" y="31" width="4" height="3" fill={palette.dark} />
      </>
    );
  }

  return (
    <>
      {eye}
      <rect x="31" y="31" width="4" height="3" fill={palette.dark} />
      <rect x="18" y="33" width="5" height="3" fill={palette.cheek} />
      <rect x="42" y="33" width="5" height="3" fill={palette.cheek} />
    </>
  );
}

function actionProp(action: CompanionAction) {
  if (action === "photo") {
    return (
      <>
        <rect x="39" y="41" width="14" height="10" fill="#3b4754" />
        <rect x="43" y="38" width="6" height="4" fill="#3b4754" />
        <rect x="44" y="44" width="4" height="4" fill="#bde8ff" />
        <rect x="54" y="35" width="4" height="4" fill="#f8dc6a" className="pixel-flash" />
      </>
    );
  }
  if (action === "food") {
    return (
      <>
        <rect x="42" y="41" width="9" height="7" fill="#f1c96b" />
        <rect x="44" y="38" width="5" height="4" fill="#f7e3a1" />
        <rect x="40" y="49" width="13" height="2" fill="#8f5d39" />
      </>
    );
  }
  if (action === "map") {
    return (
      <>
        <rect x="38" y="39" width="16" height="12" fill="#f6e7b8" />
        <rect x="43" y="39" width="2" height="12" fill="#cfb56e" />
        <rect x="49" y="42" width="3" height="2" fill="#78a87a" />
      </>
    );
  }
  if (action === "sleepy") {
    return (
      <>
        <rect x="45" y="12" width="4" height="3" fill="#5b6b83" />
        <rect x="50" y="7" width="6" height="3" fill="#5b6b83" />
        <rect x="57" y="2" width="5" height="3" fill="#5b6b83" />
      </>
    );
  }
  if (action === "excited") {
    return (
      <>
        <rect x="12" y="8" width="3" height="6" fill="#f1c96b" />
        <rect x="49" y="6" width="3" height="7" fill="#f1c96b" />
        <rect x="54" y="14" width="5" height="3" fill="#f1c96b" />
      </>
    );
  }
  return null;
}

export default function PixelCompanion({ character, action, label, size = "md", animated = true }: Props) {
  const palette = PALETTES[character.animal];
  const sleepy = action === "sleepy";
  const sizeClass = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-full w-full" : "h-14 w-14";
  const motionClass =
    action === "walking"
      ? "pixel-walk"
      : action === "excited"
        ? "pixel-hop"
        : action === "photo"
          ? "pixel-photo"
          : animated
            ? "pixel-idle"
            : "";

  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-white to-ink-100 ${sizeClass}`}
      role="img"
      aria-label={`${label}, ${ACTION_LABELS[action]}`}
    >
      <svg
        viewBox="0 0 64 64"
        className={`h-[92%] w-[92%] ${motionClass}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        {earRects(character.animal, palette)}
        <rect x="18" y="15" width="28" height="28" fill={palette.main} />
        {faceDetails(character.animal, palette, sleepy)}
        <rect x="18" y="42" width="28" height="14" fill={palette.main} />
        <rect x="15" y="44" width="7" height="10" fill={action === "walking" ? palette.dark : palette.main} />
        <rect x="43" y="44" width="7" height="10" fill={action === "map" || action === "photo" ? palette.dark : palette.main} />
        <rect x="24" y="55" width="7" height="5" fill={action === "walking" ? palette.dark : palette.main} />
        <rect x="36" y="55" width="7" height="5" fill={action === "walking" ? palette.main : palette.dark} />
        <rect x="14" y="39" width="36" height="3" fill={character.pixelAccent} />
        <rect x="14" y="40" width="8" height="4" fill={character.pixelAccent} />
        <rect x="47" y="42" width="8" height="11" fill="#6e7f8f" />
        <rect x="49" y="44" width="4" height="6" fill="#90a4b7" />
        {actionProp(action)}
      </svg>
      <style jsx>{`
        .pixel-idle {
          animation: pixel-idle 2.6s steps(2, end) infinite;
        }
        .pixel-walk {
          animation: pixel-walk 0.75s steps(2, end) infinite;
        }
        .pixel-hop {
          animation: pixel-hop 0.8s steps(2, end) infinite;
        }
        .pixel-photo {
          animation: pixel-photo 1.4s steps(2, end) infinite;
        }
        .pixel-flash {
          animation: pixel-flash 1.4s steps(2, end) infinite;
        }
        @keyframes pixel-idle {
          50% {
            transform: translateY(-1px);
          }
        }
        @keyframes pixel-walk {
          50% {
            transform: translate(2px, -1px);
          }
        }
        @keyframes pixel-hop {
          50% {
            transform: translateY(-4px);
          }
        }
        @keyframes pixel-photo {
          50% {
            transform: rotate(-2deg);
          }
        }
        @keyframes pixel-flash {
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
