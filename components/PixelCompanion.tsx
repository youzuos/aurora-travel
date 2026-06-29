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
  tail?: string;
};

const PALETTES: Record<AnimalKind, Palette> = {
  frog: { main: "#45c96a", dark: "#176b3a", light: "#d8ffd2", belly: "#dff8c9", cheek: "#f58f9d" },
  fox: { main: "#ef8842", dark: "#7b3f28", light: "#ffe0b5", belly: "#fff0d2", cheek: "#f6a2a2", tail: "#f3a04f" },
  cat: { main: "#8b929f", dark: "#3f4856", light: "#dce3eb", belly: "#eef2f5", cheek: "#ee9ebe", tail: "#747d8c" },
  dog: { main: "#bf8556", dark: "#684632", light: "#f1d0a9", belly: "#f5dec2", cheek: "#ef9b8e", tail: "#9a633f" },
  rabbit: { main: "#f2efe7", dark: "#8d949c", light: "#ffffff", belly: "#ffffff", cheek: "#f2a7c4", tail: "#ffffff" },
  bear: { main: "#9b6b45", dark: "#573824", light: "#d8b489", belly: "#d8b489", cheek: "#eaa086" },
  penguin: { main: "#31465a", dark: "#162638", light: "#f8f0dc", belly: "#fff6df", cheek: "#f2a296" },
  panda: { main: "#f3efe4", dark: "#24313d", light: "#ffffff", belly: "#fffaf0", cheek: "#ee9e9e", tail: "#24313d" },
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

function Pixel({ x, y, w, h, fill, className }: { x: number; y: number; w: number; h: number; fill: string; className?: string }) {
  return <rect x={x} y={y} width={w} height={h} fill={fill} className={className} />;
}

function ears(animal: AnimalKind, p: Palette) {
  if (animal === "frog") {
    return (
      <>
        <Pixel x={9} y={7} w={13} h={12} fill={p.main} />
        <Pixel x={42} y={7} w={13} h={12} fill={p.main} />
        <Pixel x={11} y={9} w={9} h={8} fill={p.light} />
        <Pixel x={44} y={9} w={9} h={8} fill={p.light} />
        <Pixel x={14} y={11} w={4} h={4} fill={p.dark} />
        <Pixel x={47} y={11} w={4} h={4} fill={p.dark} />
        <Pixel x={15} y={12} w={1} h={1} fill="#ffffff" />
        <Pixel x={48} y={12} w={1} h={1} fill="#ffffff" />
      </>
    );
  }
  if (animal === "rabbit") {
    return (
      <>
        <Pixel x={16} y={2} w={8} h={20} fill={p.main} />
        <Pixel x={40} y={2} w={8} h={20} fill={p.main} />
        <Pixel x={18} y={6} w={4} h={13} fill="#f3b0c9" />
        <Pixel x={42} y={6} w={4} h={13} fill="#f3b0c9" />
      </>
    );
  }
  if (animal === "penguin") return null;

  if (animal === "dog") {
    return (
      <>
        <Pixel x={9} y={16} w={8} h={18} fill={p.dark} />
        <Pixel x={47} y={16} w={8} h={18} fill={p.dark} />
        <Pixel x={10} y={27} w={6} h={8} fill={p.dark} />
        <Pixel x={48} y={27} w={6} h={8} fill={p.dark} />
      </>
    );
  }

  const leftEarX = animal === "bear" ? 11 : 13;
  const rightEarX = animal === "bear" ? 44 : 43;
  const earH = animal === "bear" ? 11 : 10;
  return (
    <>
      <Pixel x={leftEarX} y={10} w={9} h={earH} fill={animal === "panda" ? p.dark : p.main} />
      <Pixel x={rightEarX} y={10} w={9} h={earH} fill={animal === "panda" ? p.dark : p.main} />
      <Pixel x={leftEarX + 3} y={13} w={3} h={4} fill={p.light} />
      <Pixel x={rightEarX + 3} y={13} w={3} h={4} fill={p.light} />
    </>
  );
}

function tail(animal: AnimalKind, p: Palette) {
  if (animal === "fox") {
    return (
      <>
        <Pixel x={47} y={34} w={10} h={10} fill={p.tail ?? p.main} />
        <Pixel x={53} y={28} w={8} h={11} fill={p.tail ?? p.main} />
        <Pixel x={57} y={26} w={5} h={7} fill={p.light} />
      </>
    );
  }
  if (animal === "cat" || animal === "dog") {
    return (
      <>
        <Pixel x={50} y={39} w={8} h={4} fill={p.tail ?? p.main} />
        <Pixel x={55} y={35} w={4} h={7} fill={p.tail ?? p.main} />
      </>
    );
  }
  if (animal === "rabbit" || animal === "panda") {
    return <Pixel x={51} y={42} w={6} h={6} fill={p.tail ?? p.light} />;
  }
  return null;
}

function face(animal: AnimalKind, p: Palette, sleepy: boolean) {
  const eyes = sleepy ? (
    <>
      <Pixel x={22} y={25} w={7} h={2} fill={p.dark} />
      <Pixel x={36} y={25} w={7} h={2} fill={p.dark} />
    </>
  ) : (
    <>
      <Pixel x={23} y={23} w={5} h={6} fill={p.dark} />
      <Pixel x={37} y={23} w={5} h={6} fill={p.dark} />
      <Pixel x={24} y={24} w={2} h={2} fill="#ffffff" />
      <Pixel x={38} y={24} w={2} h={2} fill="#ffffff" />
    </>
  );

  if (animal === "frog") {
    return (
      <>
        <Pixel x={18} y={27} w={3} h={2} fill={p.dark} />
        <Pixel x={43} y={27} w={3} h={2} fill={p.dark} />
        <Pixel x={20} y={34} w={24} h={2} fill={p.dark} />
        <Pixel x={22} y={36} w={20} h={2} fill={p.light} />
        <Pixel x={18} y={31} w={6} h={4} fill={p.cheek} />
        <Pixel x={40} y={31} w={6} h={4} fill={p.cheek} />
      </>
    );
  }

  if (animal === "penguin") {
    return (
      <>
        <Pixel x={18} y={18} w={28} h={25} fill={p.light} />
        {eyes}
        <Pixel x={30} y={31} w={6} h={4} fill="#f0a13a" />
        <Pixel x={32} y={35} w={2} h={2} fill={p.dark} />
      </>
    );
  }

  if (animal === "panda") {
    return (
      <>
        <Pixel x={18} y={20} w={12} h={12} fill={p.dark} />
        <Pixel x={35} y={20} w={12} h={12} fill={p.dark} />
        {eyes}
        <Pixel x={28} y={30} w={9} h={8} fill={p.light} />
        <Pixel x={31} y={32} w={4} h={3} fill={p.dark} />
      </>
    );
  }

  if (animal === "fox") {
    return (
      <>
        <Pixel x={18} y={25} w={28} h={13} fill={p.light} />
        <Pixel x={28} y={30} w={9} h={7} fill={p.light} />
        <Pixel x={15} y={19} w={8} h={7} fill={p.dark} />
        <Pixel x={42} y={19} w={8} h={7} fill={p.dark} />
        {eyes}
        <Pixel x={31} y={32} w={4} h={3} fill={p.dark} />
      </>
    );
  }

  if (animal === "cat") {
    return (
      <>
        {eyes}
        <Pixel x={31} y={31} w={4} h={3} fill={p.dark} />
        <Pixel x={16} y={31} w={5} h={1} fill={p.dark} />
        <Pixel x={44} y={31} w={5} h={1} fill={p.dark} />
        <Pixel x={17} y={35} w={4} h={1} fill={p.dark} />
        <Pixel x={43} y={35} w={4} h={1} fill={p.dark} />
        <Pixel x={20} y={34} w={4} h={3} fill={p.cheek} />
        <Pixel x={41} y={34} w={4} h={3} fill={p.cheek} />
      </>
    );
  }

  return (
    <>
      {eyes}
      <Pixel x={31} y={31} w={4} h={3} fill={p.dark} />
      <Pixel x={20} y={34} w={5} h={3} fill={p.cheek} />
      <Pixel x={40} y={34} w={5} h={3} fill={p.cheek} />
    </>
  );
}

function speciesMarks(animal: AnimalKind, p: Palette) {
  if (animal === "rabbit") {
    return (
      <>
        <Pixel x={28} y={34} w={3} h={2} fill={p.dark} />
        <Pixel x={34} y={34} w={3} h={2} fill={p.dark} />
      </>
    );
  }
  if (animal === "bear") {
    return (
      <>
        <Pixel x={27} y={31} w={11} h={8} fill={p.light} />
        <Pixel x={31} y={33} w={4} h={3} fill={p.dark} />
      </>
    );
  }
  if (animal === "panda") {
    return (
      <>
        <Pixel x={50} y={49} w={8} h={4} fill={p.dark} />
        <Pixel x={53} y={53} w={5} h={3} fill={p.main} />
      </>
    );
  }
  return null;
}

function prop(action: CompanionAction) {
  if (action === "photo") {
    return (
      <>
        <Pixel x={32} y={36} w={24} h={17} fill="#1f2a36" />
        <Pixel x={36} y={32} w={9} h={5} fill="#1f2a36" />
        <Pixel x={45} y={34} w={5} h={2} fill="#607386" />
        <Pixel x={39} y={40} w={11} h={11} fill="#0d1520" />
        <Pixel x={42} y={43} w={5} h={5} fill="#9fe6ff" />
        <Pixel x={43} y={44} w={2} h={2} fill="#ffffff" />
        <Pixel x={53} y={38} w={3} h={4} fill="#e2edf5" />
        <Pixel x={55} y={30} w={6} h={6} fill="#f7d65c" className="pixel-flash" />
      </>
    );
  }
  if (action === "food") {
    return (
      <>
        <Pixel x={41} y={39} w={11} h={8} fill="#efc65b" />
        <Pixel x={43} y={36} w={7} h={4} fill="#ffe7a3" />
        <Pixel x={39} y={47} w={15} h={2} fill="#8a5738" />
      </>
    );
  }
  if (action === "map") {
    return (
      <>
        <Pixel x={37} y={38} w={18} h={13} fill="#f6e5b2" />
        <Pixel x={43} y={38} w={2} h={13} fill="#d0b267" />
        <Pixel x={49} y={42} w={4} h={2} fill="#6fb083" />
        <Pixel x={39} y={45} w={3} h={2} fill="#87a3d8" />
      </>
    );
  }
  if (action === "sleepy") {
    return (
      <>
        <Pixel x={45} y={11} w={5} h={3} fill="#5d6c84" />
        <Pixel x={51} y={6} w={7} h={3} fill="#5d6c84" />
        <Pixel x={58} y={1} w={5} h={3} fill="#5d6c84" />
      </>
    );
  }
  if (action === "excited") {
    return (
      <>
        <Pixel x={11} y={7} w={3} h={7} fill="#f0cb56" />
        <Pixel x={49} y={5} w={3} h={8} fill="#f0cb56" />
        <Pixel x={55} y={13} w={5} h={3} fill="#f0cb56" />
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
  const leftArmFill = action === "walking" ? palette.dark : palette.main;
  const rightArmFill = action === "photo" || action === "map" || action === "food" ? palette.dark : palette.main;

  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-white via-ink-50 to-aurora-50/60 ${sizeClass}`}
      role="img"
      aria-label={`${label}, ${ACTION_LABELS[action]}`}
    >
      <svg
        viewBox="0 0 64 64"
        className={`h-[94%] w-[94%] ${motionClass}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <Pixel x={20} y={58} w={26} h={3} fill="#d6dde5" />
        {tail(character.animal, palette)}
        {ears(character.animal, palette)}
        <Pixel x={character.animal === "frog" ? 12 : 17} y={15} w={character.animal === "frog" ? 40 : 30} h={4} fill={palette.main} />
        <Pixel x={character.animal === "frog" ? 10 : 14} y={19} w={character.animal === "frog" ? 44 : 36} h={20} fill={palette.main} />
        <Pixel x={character.animal === "frog" ? 13 : 17} y={39} w={character.animal === "frog" ? 38 : 30} h={4} fill={palette.main} />
        {face(character.animal, palette, sleepy)}
        <Pixel x={21} y={41} w={24} h={15} fill={palette.main} />
        <Pixel x={25} y={45} w={16} h={10} fill={palette.belly} />
        <Pixel x={14} y={42} w={8} h={10} fill={leftArmFill} />
        <Pixel x={44} y={42} w={8} h={10} fill={rightArmFill} />
        <Pixel x={24} y={55} w={8} h={5} fill={action === "walking" ? palette.dark : palette.main} />
        <Pixel x={36} y={55} w={8} h={5} fill={action === "walking" ? palette.main : palette.dark} />
        <Pixel x={15} y={39} w={35} h={3} fill={character.pixelAccent} />
        <Pixel x={15} y={41} w={9} h={4} fill={character.pixelAccent} />
        <Pixel x={46} y={41} w={8} h={11} fill="#66788a" />
        <Pixel x={48} y={43} w={4} h={6} fill="#91a7ba" />
        {speciesMarks(character.animal, palette)}
        {prop(action)}
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
