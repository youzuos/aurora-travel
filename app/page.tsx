"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import TimeWarp from "@/components/TimeWarp";
import Stats from "@/components/Stats";
import YearView from "@/components/YearView";
import TripView from "@/components/TripView";
import ChatOverlay from "@/components/ChatOverlay";
import CompanionBubble from "@/components/CompanionBubble";
import CompanionChat from "@/components/CompanionChat";
import CompanionOnboarding from "@/components/CompanionOnboarding";
import CompanionStatus from "@/components/CompanionStatus";
import PriceAlert from "@/components/PriceAlert";
import MaturitySummary from "@/components/MaturitySummary";
import type {
  AgentFinding,
  DeferredTrip,
  GeneratedPlan,
  Lang,
  PlanProfile,
  Trip,
  WishlistItem,
} from "@/lib/types";
import type { WarpStop } from "@/lib/time";
import {
  COMPANION_STORAGE_KEY,
  createDefaultCompanionState,
  maybeAdvanceCompanionLocation,
  parseCompanionState,
  selectCharacter,
  serializeCompanionState,
  type CompanionState,
} from "@/lib/companion";

const PLAN_KEY = "aurora.plan.v1";
const LANG_KEY = "aurora.lang.v1";

export default function Home() {
  const [lang, setLang] = useState<Lang>("zh");
  const [warp, setWarp] = useState<WarpStop>("year-start");
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [companionState, setCompanionState] = useState<CompanionState>(() => createDefaultCompanionState());
  const [companionStateReady, setCompanionStateReady] = useState(false);
  const [companionChatOpen, setCompanionChatOpen] = useState(false);
  const [plannerSeed, setPlannerSeed] = useState<WishlistItem[]>([]);
  const [profile, setProfile] = useState<PlanProfile | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [deferredTrips, setDeferredTrips] = useState<DeferredTrip[]>([]);
  const [findings, setFindings] = useState<AgentFinding[]>([]);
  const hasPlan = trips.length > 0;

  useEffect(() => {
    const savedLang = window.localStorage.getItem(LANG_KEY);
    if (savedLang === "zh" || savedLang === "en") setLang(savedLang);

    const savedPlan = window.localStorage.getItem(PLAN_KEY);
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan) as GeneratedPlan;
        setProfile(plan.profile);
        setTrips(plan.trips ?? []);
        setDeferredTrips(plan.deferredTrips ?? []);
        setFindings(plan.findings ?? []);
      } catch {
        window.localStorage.removeItem(PLAN_KEY);
      }
    }

    const savedCompanion = parseCompanionState(window.localStorage.getItem(COMPANION_STORAGE_KEY));
    setCompanionState(maybeAdvanceCompanionLocation(savedCompanion ?? createDefaultCompanionState()));
    setCompanionStateReady(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    if (!companionStateReady) return;
    window.localStorage.setItem(COMPANION_STORAGE_KEY, serializeCompanionState(companionState));
  }, [companionState, companionStateReady]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPlannerSeed([]);
        setPlannerOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function openPlanner(seed: WishlistItem[] = []) {
    setPlannerSeed(seed);
    setPlannerOpen(true);
  }

  function applyPlan(plan: GeneratedPlan) {
    setProfile(plan.profile);
    setTrips(plan.trips);
    setDeferredTrips(plan.deferredTrips);
    setFindings(plan.findings);
    setSelectedTrip(null);
    setWarp("year-start");
    setPlannerSeed([]);
    window.localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  }

  function chooseCompanion(characterId: string) {
    setCompanionState((state) => selectCharacter(state, characterId));
  }

  function clearPlan() {
    setProfile(null);
    setTrips([]);
    setDeferredTrips([]);
    setFindings([]);
    setSelectedTrip(null);
    setWarp("year-start");
    window.localStorage.removeItem(PLAN_KEY);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-ink-50/40 to-white">
      <TopBar
        lang={lang}
        onOpenPlanner={() => openPlanner()}
        onToggleLanguage={() => setLang((value) => (value === "zh" ? "en" : "zh"))}
        onOpenCompanion={() => setCompanionChatOpen(true)}
      />

      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-8 space-y-6">
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-ink-500 font-medium">
              {lang === "zh" ? "Plan once · Refine all year" : "Plan once · Refine all year"}
            </div>
            <h1 className="text-[30px] sm:text-[34px] font-semibold tracking-tight text-ink-900 mt-2 leading-tight">
              {lang === "zh" ? (
                <>
                  你的旅行计划，会随时间
                  <span className="text-aurora-700"> 长大。</span>
                </>
              ) : (
                <>
                  Your travel plan should
                  <span className="text-aurora-700"> mature over time.</span>
                </>
              )}
            </h1>
            <p className="text-[13px] text-ink-600 mt-2 max-w-2xl leading-relaxed">
              {lang === "zh"
                ? "先说出心愿，再给每个心愿标注必去、想去或随缘。Aurora 会按季节、天气、价格和假期资源生成年度计划，资源不足的自动推迟到下一年。"
                : "Start with wishes, then mark each as must-go, want-to-go, or optional. Aurora plans around seasonality, weather, prices, and PTO, and defers what cannot fit."}
            </p>
          </div>
          {hasPlan && (
            <button
              onClick={clearPlan}
              className="self-start lg:self-auto rounded-full border hairline bg-white px-4 py-2 text-[12px] text-ink-600 hover:bg-ink-50"
            >
              {lang === "zh" ? "清空计划" : "Clear plan"}
            </button>
          )}
        </section>

        {companionStateReady ? (
          <CompanionStatus lang={lang} state={companionState} onOpen={() => setCompanionChatOpen(true)} />
        ) : null}
        <TimeWarp lang={lang} warp={warp} disabled={!hasPlan} onChange={setWarp} />
        <MaturitySummary lang={lang} warp={warp} trips={trips} />
        <PriceAlert lang={lang} warp={warp} hasPlan={hasPlan} />
        <Stats lang={lang} profile={profile} trips={trips} deferredTrips={deferredTrips} />

        {selectedTrip ? (
          <TripView
            lang={lang}
            destinationId={selectedTrip}
            warp={warp}
            trips={trips}
            profile={profile}
            onBack={() => setSelectedTrip(null)}
            onOpenPlanner={() => openPlanner()}
          />
        ) : (
          <YearView
            lang={lang}
            warp={warp}
            trips={trips}
            deferredTrips={deferredTrips}
            onSelectTrip={setSelectedTrip}
            onOpenPlanner={() => openPlanner()}
            onStartWithWishlist={openPlanner}
          />
        )}

        <footer className="pt-8 pb-2 text-center text-[11px] text-ink-400 tracking-wide">
          Aurora · {lang === "zh" ? "按时机规划旅行，而不是靠运气。" : "Travel by timing, not by luck."} ·{" "}
          <kbd className="px-1.5 py-0.5 rounded border hairline text-[10px]">Cmd/Ctrl + K</kbd>
        </footer>
      </div>

      {companionStateReady ? <CompanionOnboarding lang={lang} state={companionState} onSelect={chooseCompanion} /> : null}
      {companionStateReady ? (
        <>
          <CompanionBubble
            lang={lang}
            state={companionState}
            chatOpen={companionChatOpen}
            onOpen={() => setCompanionChatOpen(true)}
            onStateChange={setCompanionState}
          />
          <CompanionChat
            open={companionChatOpen}
            lang={lang}
            state={companionState}
            onClose={() => setCompanionChatOpen(false)}
            onStateChange={setCompanionState}
            onChangeCharacter={() => {
              setCompanionChatOpen(false);
              setCompanionState((state) => ({ ...state, onboardingCompleted: false }));
            }}
          />
        </>
      ) : null}

      <ChatOverlay
        open={plannerOpen}
        lang={lang}
        initialProfile={profile}
        seedWishlistItems={plannerSeed}
        findings={findings}
        onClose={() => {
          setPlannerOpen(false);
          setPlannerSeed([]);
        }}
        onPlanGenerated={applyPlan}
      />
    </main>
  );
}
