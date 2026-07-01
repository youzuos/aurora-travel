"use client";

import type { CompanionAction, CompanionCharacter } from "@/lib/companion";
import { getPixelCompanionMotionClass } from "@/lib/pixelCompanionMotion";

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
  mid: string;
  light: string;
  belly: string;
  cheek: string;
  accent: string;
  tail?: string;
};

const PALETTES: Record<AnimalKind, Palette> = {
  frog: { main: "#4fcf69", dark: "#145c34", mid: "#2d9a4f", light: "#d9ffd3", belly: "#e8ffd9", cheek: "#ff8da0", accent: "#e94e4e" },
  fox: { main: "#ef7f2d", dark: "#6b341e", mid: "#b94c1f", light: "#ffe7bd", belly: "#fff0d2", cheek: "#f69a91", accent: "#e94e4e", tail: "#ef923a" },
  cat: { main: "#8d97a5", dark: "#33404f", mid: "#687382", light: "#ecf2f7", belly: "#f4f7fa", cheek: "#ee9fbd", accent: "#e94e4e", tail: "#717b8b" },
  dog: { main: "#c58a58", dark: "#5e3b29", mid: "#94613e", light: "#f3d1a8", belly: "#f7dfbf", cheek: "#ee9a8c", accent: "#e94e4e", tail: "#9d623d" },
  rabbit: { main: "#f2eee6", dark: "#88919a", mid: "#d7dce1", light: "#ffffff", belly: "#ffffff", cheek: "#f3a5c4", accent: "#e94e4e", tail: "#ffffff" },
  bear: { main: "#9c6b43", dark: "#50331f", mid: "#774d31", light: "#dbb68b", belly: "#dbb68b", cheek: "#e89b82", accent: "#e94e4e" },
  penguin: { main: "#253a4f", dark: "#111f31", mid: "#3e5870", light: "#fff1d6", belly: "#fff7df", cheek: "#f1a094", accent: "#ef9b2e" },
  panda: { main: "#f3eee3", dark: "#1f2d39", mid: "#435362", light: "#ffffff", belly: "#fffaf0", cheek: "#ee9e9e", accent: "#e94e4e", tail: "#1f2d39" },
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

function Px({ x, y, w, h, fill, className }: { x: number; y: number; w: number; h: number; fill: string; className?: string }) {
  return <rect x={x} y={y} width={w} height={h} fill={fill} className={className} />;
}

function Eyes({ sleepy, dark, light = "#ffffff" }: { sleepy: boolean; dark: string; light?: string }) {
  if (sleepy) {
    return (
      <>
        <Px x={22} y={27} w={8} h={2} fill={dark} />
        <Px x={38} y={27} w={8} h={2} fill={dark} />
      </>
    );
  }
  return (
    <>
      <Px x={22} y={24} w={6} h={7} fill={dark} />
      <Px x={38} y={24} w={6} h={7} fill={dark} />
      <Px x={23} y={25} w={2} h={2} fill={light} />
      <Px x={39} y={25} w={2} h={2} fill={light} />
    </>
  );
}

function Backpack() {
  return (
    <g>
      <Px x={6} y={36} w={12} h={16} fill="#536f7e" />
      <Px x={8} y={38} w={8} h={8} fill="#83a1b0" />
      <Px x={16} y={39} w={3} h={11} fill="#344f5f" />
    </g>
  );
}

function Body({ p, action }: { p: Palette; action: CompanionAction }) {
  const leftArmY = action === "excited" ? 35 : action === "walking" ? 43 : 42;
  const rightArmY = action === "excited" ? 35 : action === "photo" || action === "food" || action === "map" ? 41 : 42;
  const leftFootY = action === "walking" ? 56 : 55;
  const rightFootY = action === "walking" ? 54 : 55;

  return (
    <g>
      <Backpack />
      <Px x={21} y={41} w={25} h={4} fill={p.main} />
      <Px x={19} y={45} w={29} h={10} fill={p.main} />
      <Px x={23} y={47} w={17} h={9} fill={p.belly} />
      <Px x={14} y={leftArmY} w={7} h={11} fill={p.dark} />
      <Px x={46} y={rightArmY} w={7} h={11} fill={p.dark} />
      <Px x={24} y={leftFootY} w={8} h={5} fill={p.dark} />
      <Px x={36} y={rightFootY} w={8} h={5} fill={p.dark} />
      <Px x={20} y={39} w={27} h={4} fill={p.accent} />
      <Px x={42} y={42} w={5} h={10} fill={p.accent} />
      <Px x={45} y={50} w={4} h={3} fill={p.accent} />
    </g>
  );
}

function CameraProp() {
  return (
    <g>
      <Px x={35} y={34} w={23} h={17} fill="#172433" />
      <Px x={39} y={31} w={8} h={4} fill="#172433" />
      <Px x={52} y={36} w={4} h={4} fill="#eaf5ff" />
      <Px x={40} y={39} w={12} h={10} fill="#07111d" />
      <Px x={43} y={41} w={6} h={6} fill="#73d9ff" />
      <Px x={44} y={42} w={2} h={2} fill="#ffffff" />
      <Px x={56} y={29} w={6} h={6} fill="#f5ca47" className="pixel-flash" />
    </g>
  );
}

function ActionProp({ action }: { action: CompanionAction }) {
  if (action === "photo") return <CameraProp />;
  if (action === "food") {
    return (
      <g>
        <Px x={41} y={39} w={12} h={8} fill="#e9bd4d" />
        <Px x={43} y={36} w={8} h={4} fill="#ffeba3" />
        <Px x={39} y={47} w={16} h={3} fill="#7d4f34" />
      </g>
    );
  }
  if (action === "map") {
    return (
      <g>
        <Px x={36} y={37} w={7} h={15} fill="#f5e4ad" />
        <Px x={43} y={39} w={7} h={15} fill="#ead394" />
        <Px x={50} y={37} w={7} h={15} fill="#f5e4ad" />
        <Px x={39} y={46} w={6} h={2} fill="#5da06c" />
        <Px x={47} y={42} w={3} h={3} fill="#d95c52" />
        <Px x={51} y={47} w={4} h={2} fill="#5b8fc2" />
      </g>
    );
  }
  if (action === "sleepy") {
    return (
      <g fill="#5f6f86">
        <Px x={48} y={11} w={8} h={3} fill="#5f6f86" />
        <Px x={53} y={14} w={3} h={3} fill="#5f6f86" />
        <Px x={48} y={17} w={8} h={3} fill="#5f6f86" />
        <Px x={56} y={5} w={6} h={2} fill="#5f6f86" />
        <Px x={60} y={7} w={2} h={2} fill="#5f6f86" />
        <Px x={56} y={9} w={6} h={2} fill="#5f6f86" />
      </g>
    );
  }
  if (action === "excited") {
    return (
      <g fill="#f1c84b">
        <Px x={11} y={8} w={3} h={8} fill="#f1c84b" />
        <Px x={51} y={7} w={3} h={8} fill="#f1c84b" />
        <Px x={55} y={16} w={7} h={3} fill="#f1c84b" />
      </g>
    );
  }
  return null;
}

function Frog({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <Px x={12} y={8} w={13} h={10} fill={p.main} />
      <Px x={40} y={8} w={13} h={10} fill={p.main} />
      <Px x={15} y={11} w={7} h={5} fill={p.light} />
      <Px x={43} y={11} w={7} h={5} fill={p.light} />
      <Px x={9} y={18} w={47} h={7} fill={p.main} />
      <Px x={7} y={25} w={51} h={12} fill={p.main} />
      <Px x={12} y={37} w={41} h={6} fill={p.main} />
      <Eyes sleepy={sleepy} dark={p.dark} />
      <Px x={25} y={32} w={3} h={2} fill={p.dark} />
      <Px x={38} y={32} w={3} h={2} fill={p.dark} />
      <Px x={21} y={36} w={23} h={3} fill={p.dark} />
      <Px x={18} y={32} w={6} h={5} fill={p.cheek} />
      <Px x={43} y={32} w={6} h={5} fill={p.cheek} />
    </g>
  );
}

function Fox({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <Px x={50} y={30} w={8} h={17} fill={p.tail ?? p.main} />
      <Px x={55} y={22} w={5} h={13} fill={p.tail ?? p.main} />
      <Px x={56} y={20} w={5} h={7} fill={p.light} />
      <Px x={15} y={9} w={8} h={13} fill={p.main} />
      <Px x={43} y={9} w={8} h={13} fill={p.main} />
      <Px x={18} y={12} w={4} h={7} fill={p.dark} />
      <Px x={44} y={12} w={4} h={7} fill={p.dark} />
      <Px x={15} y={20} w={36} h={8} fill={p.main} />
      <Px x={13} y={28} w={40} h={12} fill={p.main} />
      <Px x={19} y={31} w={27} h={9} fill={p.light} />
      <Px x={28} y={36} w={10} h={6} fill={p.light} />
      <Eyes sleepy={sleepy} dark={p.dark} />
      <Px x={31} y={34} w={5} h={4} fill={p.dark} />
    </g>
  );
}

function Cat({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <Px x={51} y={36} w={7} h={5} fill={p.tail ?? p.main} />
      <Px x={55} y={30} w={4} h={8} fill={p.tail ?? p.main} />
      <Px x={16} y={9} w={8} h={13} fill={p.main} />
      <Px x={42} y={9} w={8} h={13} fill={p.main} />
      <Px x={19} y={13} w={3} h={6} fill="#f2a9c6" />
      <Px x={44} y={13} w={3} h={6} fill="#f2a9c6" />
      <Px x={14} y={20} w={38} h={8} fill={p.main} />
      <Px x={12} y={28} w={42} h={12} fill={p.main} />
      <Px x={25} y={18} w={16} h={3} fill={p.mid} />
      <Eyes sleepy={sleepy} dark={p.dark} />
      <Px x={31} y={34} w={4} h={3} fill={p.dark} />
      <Px x={14} y={33} w={7} h={2} fill={p.dark} />
      <Px x={44} y={33} w={7} h={2} fill={p.dark} />
      <Px x={16} y={37} w={6} h={2} fill={p.dark} />
      <Px x={43} y={37} w={6} h={2} fill={p.dark} />
      <Px x={20} y={35} w={5} h={4} fill={p.cheek} />
      <Px x={41} y={35} w={5} h={4} fill={p.cheek} />
    </g>
  );
}

function Dog({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <Px x={50} y={39} w={8} h={4} fill={p.tail ?? p.main} />
      <Px x={55} y={35} w={4} h={5} fill={p.tail ?? p.main} />
      <Px x={10} y={18} w={9} h={22} fill={p.dark} />
      <Px x={47} y={18} w={9} h={22} fill={p.dark} />
      <Px x={16} y={18} w={34} h={8} fill={p.main} />
      <Px x={14} y={26} w={38} h={14} fill={p.main} />
      <Px x={24} y={32} w={18} h={9} fill={p.light} />
      <Eyes sleepy={sleepy} dark={p.dark} />
      <Px x={31} y={33} w={5} h={4} fill={p.dark} />
      <Px x={29} y={38} w={9} h={2} fill={p.dark} />
      <Px x={20} y={35} w={5} h={4} fill={p.cheek} />
      <Px x={42} y={35} w={5} h={4} fill={p.cheek} />
    </g>
  );
}

function Rabbit({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <Px x={52} y={42} w={6} h={6} fill={p.tail ?? p.light} />
      <Px x={18} y={2} w={8} h={23} fill={p.main} />
      <Px x={40} y={2} w={8} h={23} fill={p.main} />
      <Px x={21} y={7} w={3} h={14} fill="#f2a9c6" />
      <Px x={43} y={7} w={3} h={14} fill="#f2a9c6" />
      <Px x={15} y={22} w={37} h={8} fill={p.main} />
      <Px x={13} y={30} w={41} h={11} fill={p.main} />
      <Eyes sleepy={sleepy} dark={p.dark} />
      <Px x={31} y={35} w={5} h={3} fill="#d77495" />
      <Px x={30} y={39} w={8} h={2} fill={p.dark} />
      <Px x={20} y={36} w={5} h={4} fill={p.cheek} />
      <Px x={42} y={36} w={5} h={4} fill={p.cheek} />
    </g>
  );
}

function Bear({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <Px x={15} y={10} w={10} h={10} fill={p.main} />
      <Px x={41} y={10} w={10} h={10} fill={p.main} />
      <Px x={18} y={13} w={4} h={4} fill={p.light} />
      <Px x={44} y={13} w={4} h={4} fill={p.light} />
      <Px x={14} y={20} w={38} h={8} fill={p.main} />
      <Px x={12} y={28} w={42} h={13} fill={p.main} />
      <Px x={25} y={33} w={17} h={8} fill={p.light} />
      <Eyes sleepy={sleepy} dark={p.dark} />
      <Px x={31} y={34} w={5} h={4} fill={p.dark} />
      <Px x={29} y={39} w={9} h={2} fill={p.dark} />
      <Px x={20} y={36} w={5} h={4} fill={p.cheek} />
      <Px x={42} y={36} w={5} h={4} fill={p.cheek} />
    </g>
  );
}

function Penguin({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <Px x={19} y={12} w={28} h={8} fill={p.main} />
      <Px x={16} y={20} w={34} h={17} fill={p.main} />
      <Px x={20} y={30} w={26} h={18} fill={p.main} />
      <Px x={24} y={23} w={18} h={22} fill={p.light} />
      <Eyes sleepy={sleepy} dark={p.dark} />
      <Px x={30} y={32} w={7} h={4} fill={p.accent} />
      <Px x={32} y={36} w={3} h={3} fill={p.accent} />
      <Px x={21} y={36} w={5} h={4} fill={p.cheek} />
      <Px x={41} y={36} w={5} h={4} fill={p.cheek} />
      <Px x={24} y={56} w={10} h={4} fill={p.accent} />
      <Px x={38} y={56} w={10} h={4} fill={p.accent} />
    </g>
  );
}

function Panda({ p, sleepy }: { p: Palette; sleepy: boolean }) {
  return (
    <g>
      <Px x={15} y={10} w={10} h={10} fill={p.dark} />
      <Px x={41} y={10} w={10} h={10} fill={p.dark} />
      <Px x={14} y={20} w={38} h={8} fill={p.main} />
      <Px x={12} y={28} w={42} h={13} fill={p.main} />
      <Px x={20} y={23} w={12} h={11} fill={p.dark} />
      <Px x={36} y={23} w={12} h={11} fill={p.dark} />
      <Eyes sleepy={sleepy} dark={sleepy ? p.dark : p.light} />
      <Px x={27} y={34} w={14} h={8} fill={p.light} />
      <Px x={31} y={35} w={5} h={4} fill={p.dark} />
      <Px x={29} y={40} w={9} h={2} fill={p.dark} />
      <Px x={20} y={37} w={5} h={4} fill={p.cheek} />
      <Px x={43} y={37} w={5} h={4} fill={p.cheek} />
    </g>
  );
}

function AnimalSprite({ animal, p, sleepy }: { animal: AnimalKind; p: Palette; sleepy: boolean }) {
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

export default function PixelSpriteCompanion({ character, action, label, size = "md", animated = true }: Props) {
  const palette = PALETTES[character.animal];
  const sleepy = action === "sleepy";
  const sizeClass = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-full w-full" : "h-14 w-14";
  const motionClass = getPixelCompanionMotionClass(action, animated);

  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-white via-ink-50 to-aurora-50/60 ${sizeClass}`}
      role="img"
      aria-label={`${label}, ${ACTION_LABELS[action]}`}
    >
      <svg
        viewBox="0 0 64 64"
        className={`h-[96%] w-[96%] ${motionClass}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <Px x={20} y={60} w={28} h={3} fill="#d7dfe7" />
        <Body p={palette} action={action} />
        <AnimalSprite animal={character.animal} p={palette} sleepy={sleepy} />
        <ActionProp action={action} />
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
        .pixel-food {
          animation: pixel-food 1.1s steps(2, end) infinite;
        }
        .pixel-map {
          animation: pixel-map 1.2s steps(2, end) infinite;
        }
        .pixel-sleepy {
          animation: pixel-sleepy 2.2s steps(2, end) infinite;
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
            transform: translateY(-1px);
          }
        }
        @keyframes pixel-food {
          50% {
            transform: translate(0, 2px) rotate(-2deg);
          }
        }
        @keyframes pixel-map {
          50% {
            transform: translateX(-2px) rotate(2deg);
          }
        }
        @keyframes pixel-sleepy {
          50% {
            transform: translateY(2px) scaleY(0.97);
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
