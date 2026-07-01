"use client";

import { useEffect, useState, type CSSProperties } from "react";
import TopBar from "@/components/TopBar";
import TimeWarp from "@/components/TimeWarp";
import YearView from "@/components/YearView";
import TripView from "@/components/TripView";
import ChatOverlay from "@/components/ChatOverlay";
import CompanionBubble from "@/components/CompanionBubble";
import CompanionChat from "@/components/CompanionChat";
import CompanionDestinationOnboarding from "@/components/CompanionDestinationOnboarding";
import CompanionInspirationRadar from "@/components/CompanionInspirationRadar";
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
import { getCompanionScene } from "@/lib/companionScene";

const PLAN_KEY = "aurora.plan.v1";
const LANG_KEY = "aurora.lang.v1";
const DESTINATION_ONBOARDING_KEY = "aurora.destinationOnboarding.v1";

export default function Home() {
  const [lang, setLang] = useState<Lang>("zh");
  const [warp, setWarp] = useState<WarpStop>("year-start");
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [timeWarpOpen, setTimeWarpOpen] = useState(false);
  const [companionState, setCompanionState] = useState<CompanionState>(() => createDefaultCompanionState());
  const [companionStateReady, setCompanionStateReady] = useState(false);
  const [destinationOnboardingReady, setDestinationOnboardingReady] = useState(false);
  const [destinationOnboardingDone, setDestinationOnboardingDone] = useState(false);
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
        if ((plan.trips ?? []).length > 0) setDestinationOnboardingDone(true);
      } catch {
        window.localStorage.removeItem(PLAN_KEY);
      }
    }
    if (window.localStorage.getItem(DESTINATION_ONBOARDING_KEY) === "done") {
      setDestinationOnboardingDone(true);
    }
    setDestinationOnboardingReady(true);

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
    if (!destinationOnboardingReady) return;
    if (destinationOnboardingDone) {
      window.localStorage.setItem(DESTINATION_ONBOARDING_KEY, "done");
    } else {
      window.localStorage.removeItem(DESTINATION_ONBOARDING_KEY);
    }
  }, [destinationOnboardingDone, destinationOnboardingReady]);

  useEffect(() => {
    if (!companionStateReady) return;

    function refreshCompanionPresence() {
      setCompanionState((currentState) =>
        maybeAdvanceCompanionLocation(currentState, Date.now(), { incrementUnread: !companionChatOpen })
      );
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshCompanionPresence();
      }
    }

    window.addEventListener("focus", refreshCompanionPresence);
    window.addEventListener("pageshow", refreshCompanionPresence);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshCompanionPresence);
      window.removeEventListener("pageshow", refreshCompanionPresence);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [companionChatOpen, companionStateReady]);

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

  function openPlannerFromCompanion(seed: WishlistItem[]) {
    setCompanionChatOpen(false);
    openPlanner(seed);
  }

  function completeDestinationOnboarding() {
    setDestinationOnboardingDone(true);
  }

  function openPlannerFromDestination(seed: WishlistItem[]) {
    completeDestinationOnboarding();
    openPlanner(seed);
  }

  function applyPlan(plan: GeneratedPlan) {
    setProfile(plan.profile);
    setTrips(plan.trips);
    setDeferredTrips(plan.deferredTrips);
    setFindings(plan.findings);
    setSelectedTrip(null);
    setTimeWarpOpen(false);
    setWarp("year-start");
    setPlannerSeed([]);
    setDestinationOnboardingDone(true);
    window.localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  }

  function chooseCompanion(characterId: string) {
    setCompanionState((state) => selectCharacter(state, characterId));
  }

  function openCompanionChat() {
    setCompanionState((currentState) =>
      maybeAdvanceCompanionLocation(currentState, Date.now(), { incrementUnread: false })
    );
    setCompanionChatOpen(true);
  }

  function clearPlan() {
    setProfile(null);
    setTrips([]);
    setDeferredTrips([]);
    setFindings([]);
    setSelectedTrip(null);
    setTimeWarpOpen(false);
    setWarp("year-start");
    window.localStorage.removeItem(PLAN_KEY);
  }

  const destinationOnboardingActive =
    companionStateReady &&
    destinationOnboardingReady &&
    companionState.onboardingCompleted &&
    !hasPlan &&
    !selectedTrip &&
    !destinationOnboardingDone;
  const companionScene = getCompanionScene(companionState);
  const companionSceneStyle = {
    "--companion-scene-photo": `url("${companionScene.pixelPhotoSrc}")`,
  } as CSSProperties;

  return (
    <main className={`travel-pixel-shell ${companionScene.className}`} style={companionSceneStyle}>
      <TopBar
        lang={lang}
        onOpenPlanner={() => openPlanner()}
        onToggleLanguage={() => setLang((value) => (value === "zh" ? "en" : "zh"))}
        onOpenCompanion={openCompanionChat}
      />

      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-8 space-y-6">
        <section className="travel-hero flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
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

        {companionStateReady ? <CompanionStatus lang={lang} state={companionState} onOpen={openCompanionChat} /> : null}

        {destinationOnboardingActive ? (
          <CompanionDestinationOnboarding
            lang={lang}
            state={companionState}
            warp={warp}
            onStateChange={setCompanionState}
            onAddWishlistItems={openPlannerFromDestination}
            onComplete={completeDestinationOnboarding}
          />
        ) : null}

        {companionStateReady && !destinationOnboardingActive && !selectedTrip ? (
          <CompanionInspirationRadar
            lang={lang}
            state={companionState}
            warp={warp}
            onStateChange={setCompanionState}
            onAddWishlistItems={openPlanner}
          />
        ) : null}

        {hasPlan && !selectedTrip && (
          <>
            <YearView
              lang={lang}
              warp={warp}
              trips={trips}
              deferredTrips={deferredTrips}
              profile={profile}
              onSelectTrip={setSelectedTrip}
              onOpenPlanner={() => openPlanner()}
              onStartWithWishlist={openPlanner}
              onOpenTimeWarp={() => setTimeWarpOpen(true)}
            />
            <section className="rounded-2xl border hairline bg-white p-5 shadow-[0_1px_2px_rgba(20,30,50,0.04)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-500">
                    {lang === "zh" ? "Aurora 在持续帮你盯着" : "Aurora keeps watching"}
                  </div>
                  <p className="mt-1 text-[13px] text-ink-600">
                    {lang === "zh"
                      ? "行程会随着时间继续收敛；需要演示计划如何长大时，再打开 Time Warp。"
                      : "Plans keep narrowing over time. Open Time Warp when you want to demo that progression."}
                  </p>
                </div>
                <button
                  onClick={() => setTimeWarpOpen(true)}
                  className="rounded-full bg-ink-900 px-4 py-2 text-[12px] font-medium text-white hover:bg-aurora-700"
                >
                  {lang === "zh" ? "开始 Time Warp 演示" : "Start Time Warp demo"}
                </button>
              </div>
            </section>
          </>
        )}

        {hasPlan && selectedTrip && (
          <TripView
            lang={lang}
            destinationId={selectedTrip}
            warp={warp}
            trips={trips}
            profile={profile}
            onBack={() => setSelectedTrip(null)}
            onOpenPlanner={() => openPlanner()}
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
            onOpen={openCompanionChat}
            onStateChange={setCompanionState}
          />
          <CompanionChat
            open={companionChatOpen}
            lang={lang}
            state={companionState}
            onClose={() => setCompanionChatOpen(false)}
            onStateChange={setCompanionState}
            warp={warp}
            onAddWishlistItems={openPlannerFromCompanion}
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

      {timeWarpOpen && hasPlan && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" onClick={() => setTimeWarpOpen(false)}>
          <div className="absolute inset-0 bg-ink-900/35 backdrop-blur-sm" />
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border hairline bg-white p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-aurora-700">
                  Time Warp
                </div>
                <h2 className="mt-1 text-[22px] font-semibold text-ink-900">
                  {lang === "zh" ? "看你的计划如何长大" : "Watch your plan mature"}
                </h2>
              </div>
              <button onClick={() => setTimeWarpOpen(false)} className="text-xl leading-none text-ink-400 hover:text-ink-900">
                ×
              </button>
            </div>
            <div className="space-y-4">
              <TimeWarp lang={lang} warp={warp} onChange={setWarp} />
              <MaturitySummary lang={lang} warp={warp} trips={trips} />
              <PriceAlert lang={lang} warp={warp} hasPlan={hasPlan} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
