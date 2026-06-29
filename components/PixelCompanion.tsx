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

type Palette = {
  main: string;
  dark: string;
  light: string;
  belly: string;
  cheek: string;
  accent: string;
  tail?: string;
};

const PALETTES: Record<AnimalKind, Palette> = {
  frog: { main: "#58c96c", dark: "#206b3d", light: "#dcffd2", belly: "#e7ffd8", cheek: "#ff9fb0", accent: "#2f8a51" },
  fox: { main: "#ed8338", dark: "#6e3a23", light: "#fff0cf", belly: "#fff2d8", cheek: "#f5a0a0", accent: "#b95024", tail: "#f09a42" },
  cat: { main: "#8e98a6", dark: "#364150", light: "#edf3f8", belly: "#f4f7fa", cheek: "#ee9fc0", accent: "#5c6676", tail: "#717c8c" },
  dog: { main: "#c58b5c", dark: "#60402d", light: "#f1d1aa", belly: "#f8dfc0", cheek: "#ef9d90", accent: "#8e5b3d", tail: "#9f663f" },
  rabbit: { main: "#f3f0e9", dark: "#8b939c", light: "#ffffff", belly: "#ffffff", cheek: "#f3a8c8", accent: "#d4d9df", tail: "#ffffff" },
  bear: { main: "#9b6b45", dark: "#513522", light: "#d9b58c", belly: "#d9b58c", cheek: "#e99b84", accent: "#7a4f34" },
  penguin: { main: "#263b50", dark: "#122133", light: "#fff0d6", belly: "#fff7df", cheek: "#f2a296", accent: "#f0a13a" },
  panda: { main: "#f4efe4", dark: "#21303c", light: "#ffffff", belly: "#fffaf0", cheek: "#ee9e9e", accent: "#263542", tail: "#263542" },
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

function Eyes({ sleepy, dark }: { sleepy: boolean; dark: string }) {
  if (sleepy) {
    return (
      <>
        <path d="M23 27h7" stroke={dark} strokeWidth="2.8" strokeLinecap="round" />
        <path d="M38 27h7" stroke={dark} strokeWidth="2.8" strokeLinecap="round" />
      </>
    );
  }

  return (
    <>
      <circle cx="26" cy="26" r="3.6" fill={dark} />
      <circle cx="41" cy="26" r="3.6" fill={dark} />
      <circle cx="24.8" cy="24.6" r="1.1" fill="#ffffff" />
      <circle cx="39.8" cy="24.6" r="1.1" fill="#ffffff" />
    </>
  );
}

function Backpack() {
  return (
    <g>
      <rect x="7.5" y="35" width="13" height="18" rx="4" fill="#607d8c" />
      <rect x="10" y="38" width="8" height="7" rx="2" fill="#89a5b5" />
      <path d="M18 36c4 3 4 11 1 15" stroke="#3f5968" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function Scarf({ color }: { color: string }) {
  return (
    <g>
      <path d="M22 39c7 3 16 3 24 0" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <path d="M37 40l7 9" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

function CameraProp() {
  return (
    <g>
      <rect x="36" y="35" width="21" height="15" rx="3" fill="#1f2a36" />
      <rect x="40" y="31.5" width="8" height="4.5" rx="1.5" fill="#1f2a36" />
      <rect x="51.5" y="37" width="3.5" height="3" rx="1" fill="#edf5fb" />
      <circle cx="46" cy="42.5" r="5.2" fill="#0c1520" />
      <circle cx="46" cy="42.5" r="2.7" fill="#9fe6ff" />
      <circle cx="44.8" cy="41.2" r="0.9" fill="#ffffff" />
      <rect x="55" y="30" width="6" height="6" rx="1.5" fill="#f5cd4d" className="pixel-flash" />
    </g>
  );
}

function FoodProp() {
  return (
    <g>
      <path d="M39 42c2-7 13-7 15 0l-2 7H41z" fill="#e9bf4f" />
      <path d="M42 38c2-3 8-3 10 0" stroke="#fff0b7" strokeWidth="2" strokeLinecap="round" />
      <rect x="38.5" y="49" width="16" height="2.8" rx="1.4" fill="#805237" />
    </g>
  );
}

function MapProp() {
  return (
    <g>
      <path d="M36 37l7 2 7-2 7 2v15l-7-2-7 2-7-2z" fill="#f7e6b2" stroke="#b99d55" strokeWidth="1.5" />
      <path d="M43 39v15M50 37v15" stroke="#c9ae65" strokeWidth="1.2" />
      <path d="M39 47l5-2 5 3 4-3" stroke="#5da06c" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="47" cy="43" r="1.6" fill="#d95c52" />
    </g>
  );
}

function ActionProp({ action }: { action: CompanionAction }) {
  if (action === "photo") return <CameraProp />;
  if (action === "food") return <FoodProp />;
  if (action === "map") return <MapProp />;
  if (action === "sleepy") {
    return (
      <g fill="#61718a">
        <path d="M47 14h8l-7 6h8" stroke="#61718a" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
        <path d="M55 7h6l-5 5h6" stroke="#61718a" strokeWidth="2" strokeLinejoin="round" fill="none" />
      </g>
    );
  }
  if (action === "excited") {
    return (
      <g stroke="#f0c84f" strokeWidth="3" strokeLinecap="round">
        <path d="M13 12v-6" />
        <path d="M50 10l4-5" />
        <path d="M56 18h5" />
      </g>
    );
  }
  return null;
}

function Limbs({ action, p }: { action: CompanionAction; p: Palette }) {
  const leftLegY = action === "walking" ? 58 : 57;
  const rightLegY = action === "walking" ? 56 : 57;
  const leftArmPath = action === "excited" ? "M22 41l-8-8" : action === "walking" ? "M22 42l-8 5" : "M22 42l-7 8";
  const rightArmPath = action === "photo" || action === "map" || action === "food" ? "M43 42l8 4" : action === "excited" ? "M43 41l8-8" : "M43 42l7 8";

  return (
    <g strokeLinecap="round">
      <path d={leftArmPath} stroke={p.dark} strokeWidth="5" />
      <path d={rightArmPath} stroke={p.dark} strokeWidth="5" />
      <path d={`M27 52v${leftLegY - 52}`} stroke={p.dark} strokeWidth="5" />
      <path d={`M39 52v${rightLegY - 52}`} stroke={p.dark} strokeWidth="5" />
    </g>
  );
}

function CommonBody({ p, action }: { p: Palette; action: CompanionAction }) {
  return (
    <g>
      <Backpack />
      <ellipse cx="33" cy="47" rx="14" ry="13" fill={p.main} />
      <ellipse cx="33" cy="49" rx="8" ry="8.5" fill={p.belly} />
      <Limbs action={action} p={p} />
      <Scarf color="#e55c54" />
    </g>
  );
}

function Frog({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <ellipse cx="20" cy="15" rx="8.5" ry="8" fill={p.main} />
      <ellipse cx="45" cy="15" rx="8.5" ry="8" fill={p.main} />
      <ellipse cx="32.5" cy="25" rx="23" ry="17" fill={p.main} />
      <circle cx="20" cy="15" r="4.8" fill={p.light} />
      <circle cx="45" cy="15" r="4.8" fill={p.light} />
      <Eyes sleepy={sleepy} dark={p.dark} />
      <circle cx="27" cy="31" r="1.4" fill={p.dark} />
      <circle cx="38" cy="31" r="1.4" fill={p.dark} />
      <path d="M23 35c5 5 14 5 19 0" stroke={p.dark} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="18" cy="32" r="3.3" fill={p.cheek} />
      <circle cx="47" cy="32" r="3.3" fill={p.cheek} />
    </g>
  );
}

function Fox({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <path d="M47 43c11-11 12-22 5-26-4 9-10 14-18 17 5 1 9 4 13 9z" fill={p.tail} />
      <path d="M52 18c4 4 3 10-1 16l8-5c1-6-1-10-7-11z" fill={p.light} />
      <path d="M17 24l6-15 8 11z" fill={p.main} />
      <path d="M48 24l-6-15-8 11z" fill={p.main} />
      <path d="M19 21c4-9 22-9 27 0 5 9-1 21-14 21S14 30 19 21z" fill={p.main} />
      <path d="M17 24l8 2M48 24l-8 2" stroke={p.dark} strokeWidth="4" strokeLinecap="round" />
      <path d="M20 30c5 1 9 4 12 9 3-5 7-8 12-9-2 9-7 12-12 12s-10-3-12-12z" fill={p.light} />
      <Eyes sleepy={sleepy} dark={p.dark} />
      <circle cx="32" cy="34" r="2.3" fill={p.dark} />
    </g>
  );
}

function Cat({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <path d="M51 43c8-2 9-12 3-14 1 6-2 10-8 12z" fill={p.tail} />
      <path d="M18 22l3-13 10 9z" fill={p.main} />
      <path d="M47 22l-3-13-10 9z" fill={p.main} />
      <path d="M20 11l3 7M44 11l-3 7" stroke="#f3b0c9" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32.5" cy="27" r="18" fill={p.main} />
      <path d="M24 20h17" stroke={p.accent} strokeWidth="2" strokeLinecap="round" />
      <Eyes sleepy={sleepy} dark={p.dark} />
      <path d="M31 33h3l-1.5 2z" fill={p.dark} />
      <path d="M20 32h-7M20 36h-6M45 32h7M45 36h6" stroke={p.dark} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="22" cy="36" r="2.7" fill={p.cheek} />
      <circle cx="43" cy="36" r="2.7" fill={p.cheek} />
    </g>
  );
}

function Dog({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <path d="M49 43c7 2 9-2 7-7-2 3-5 4-9 3z" fill={p.tail} />
      <ellipse cx="18" cy="28" rx="7" ry="15" fill={p.dark} />
      <ellipse cx="47" cy="28" rx="7" ry="15" fill={p.dark} />
      <circle cx="32.5" cy="27" r="18" fill={p.main} />
      <ellipse cx="32.5" cy="35" rx="9" ry="6.5" fill={p.light} />
      <Eyes sleepy={sleepy} dark={p.dark} />
      <circle cx="32.5" cy="33.5" r="2.4" fill={p.dark} />
      <path d="M29 38c2 2 5 2 7 0" stroke={p.dark} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="35" r="2.8" fill={p.cheek} />
      <circle cx="45" cy="35" r="2.8" fill={p.cheek} />
    </g>
  );
}

function Rabbit({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <circle cx="53" cy="45" r="5" fill={p.tail} />
      <rect x="18" y="2" width="9" height="25" rx="4.5" fill={p.main} />
      <rect x="39" y="2" width="9" height="25" rx="4.5" fill={p.main} />
      <rect x="21" y="7" width="3.5" height="16" rx="1.7" fill="#f3b0c9" />
      <rect x="42" y="7" width="3.5" height="16" rx="1.7" fill="#f3b0c9" />
      <circle cx="33" cy="29" r="17" fill={p.main} />
      <Eyes sleepy={sleepy} dark={p.dark} />
      <path d="M31 34h4l-2 2z" fill="#d87998" />
      <path d="M30 38c2 1 4 1 6 0" stroke={p.dark} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="22" cy="36" r="3" fill={p.cheek} />
      <circle cx="44" cy="36" r="3" fill={p.cheek} />
    </g>
  );
}

function Bear({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <circle cx="20" cy="16" r="8" fill={p.main} />
      <circle cx="45" cy="16" r="8" fill={p.main} />
      <circle cx="20" cy="16" r="3.8" fill={p.light} />
      <circle cx="45" cy="16" r="3.8" fill={p.light} />
      <circle cx="32.5" cy="29" r="18" fill={p.main} />
      <ellipse cx="32.5" cy="36" rx="9" ry="6.5" fill={p.light} />
      <Eyes sleepy={sleepy} dark={p.dark} />
      <circle cx="32.5" cy="34" r="2.5" fill={p.dark} />
      <path d="M29.5 38c2 2 4 2 6 0" stroke={p.dark} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="21" cy="36" r="2.8" fill={p.cheek} />
      <circle cx="44" cy="36" r="2.8" fill={p.cheek} />
    </g>
  );
}

function Penguin({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <ellipse cx="33" cy="32" rx="17" ry="23" fill={p.main} />
      <ellipse cx="33" cy="36" rx="11" ry="16" fill={p.belly} />
      <Eyes sleepy={sleepy} dark={p.dark} />
      <path d="M29 31h8l-4 5z" fill={p.accent} />
      <path d="M24 56h9M37 56h9" stroke={p.accent} strokeWidth="4" strokeLinecap="round" />
      <circle cx="23" cy="36" r="2.5" fill={p.cheek} />
      <circle cx="43" cy="36" r="2.5" fill={p.cheek} />
    </g>
  );
}

function Panda({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <circle cx="20" cy="16" r="8" fill={p.dark} />
      <circle cx="45" cy="16" r="8" fill={p.dark} />
      <circle cx="32.5" cy="29" r="18" fill={p.main} />
      <ellipse cx="25.5" cy="27" rx="6.5" ry="7.5" fill={p.dark} />
      <ellipse cx="40.5" cy="27" rx="6.5" ry="7.5" fill={p.dark} />
      <Eyes sleepy={sleepy} dark={sleepy ? p.dark : p.light} />
      <ellipse cx="32.5" cy="36" rx="8" ry="6" fill={p.light} />
      <circle cx="32.5" cy="34" r="2.4" fill={p.dark} />
      <path d="M29.5 38c2 2 4 2 6 0" stroke={p.dark} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="21" cy="37" r="2.6" fill={p.cheek} />
      <circle cx="44" cy="37" r="2.6" fill={p.cheek} />
    </g>
  );
}

function AnimalHead({ animal, p, sleepy }: { animal: AnimalKind; p: Palette; sleepy: boolean }) {
  switch (animal) {
    case "frog":
      return <Frog p={p} sleepy={sleepy} />;
    case "fox":
      return <Fox p={p} sleepy={sleepy} />;
    case "cat":
      return <Cat p={p} sleepy={sleepy} />;
    case "dog":
      return <Dog p={p} sleepy={sleepy} />;
    case "rabbit":
      return <Rabbit p={p} sleepy={sleepy} />;
    case "bear":
      return <Bear p={p} sleepy={sleepy} />;
    case "penguin":
      return <Penguin p={p} sleepy={sleepy} />;
    case "panda":
      return <Panda p={p} sleepy={sleepy} />;
  }
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
      className={`relative grid place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-white via-ink-50 to-aurora-50/60 ${sizeClass}`}
      role="img"
      aria-label={`${label}, ${ACTION_LABELS[action]}`}
    >
      <svg viewBox="0 0 64 64" className={`h-[96%] w-[96%] ${motionClass}`} aria-hidden="true">
        <ellipse cx="33" cy="60" rx="17" ry="3" fill="#d7dfe7" />
        <CommonBody p={palette} action={action} />
        <AnimalHead animal={character.animal} p={palette} sleepy={sleepy} />
        <ActionProp action={action} />
      </svg>
      <style jsx>{`
        .pixel-idle {
          animation: pixel-idle 2.6s ease-in-out infinite;
        }
        .pixel-walk {
          animation: pixel-walk 0.75s steps(2, end) infinite;
        }
        .pixel-hop {
          animation: pixel-hop 0.8s ease-in-out infinite;
        }
        .pixel-photo {
          animation: pixel-photo 1.4s ease-in-out infinite;
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
            transform: translate(2px, -1px) rotate(1deg);
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
