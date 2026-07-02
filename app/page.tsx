"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import CompanionBubble from "@/components/CompanionBubble";
import CompanionChat from "@/components/CompanionChat";
import InteractiveCompanion from "@/components/InteractiveCompanion";
import CompanionOnboarding from "@/components/CompanionOnboarding";
import TimeWarp from "@/components/TimeWarp";
import Stats from "@/components/Stats";
import YearView from "@/components/YearView";
import TripView from "@/components/TripView";
import ChatOverlay from "@/components/ChatOverlay";
import PriceAlert from "@/components/PriceAlert";
import MaturitySummary from "@/components/MaturitySummary";
import { COMPANION_CHARACTERS } from "@/data/companion";
import {
  COMPANION_STORAGE_KEY,
  advanceCompanionLocationWithoutMessage,
  createDefaultCompanionState,
  getCharacter,
  getCompanionAction,
  getCompanionLocalTimeInfo,
  getCurrentLocation,
  getStatusLine,
  parseCompanionState,
  selectCharacter,
  serializeCompanionState,
  type CompanionState,
} from "@/lib/companion";
import { getCompanionScene } from "@/lib/companionScene";
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

const PLAN_KEY = "aurora.plan.v1";
const LANG_KEY = "aurora.lang.v1";

export default function Home() {
  const [lang, setLang] = useState<Lang>("zh");
  const [warp, setWarp] = useState<WarpStop>("year-start");
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [planPanelOpen, setPlanPanelOpen] = useState(false);
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

  const companionCharacter = companionState.selectedCharacterId
    ? getCharacter(companionState.selectedCharacterId)
    : COMPANION_CHARACTERS[0];
  const companionLocation = getCurrentLocation(companionState);
  const companionLocalTime = getCompanionLocalTimeInfo(companionState);
  const companionScene = getCompanionScene(companionState);
  const companionAction = getCompanionAction(companionState);
  const companionSceneStyle = {
    "--companion-scene-photo": `url("${companionScene.pixelPhotoSrc}")`,
  } as CSSProperties;
  const companionStatus = companionState.onboardingCompleted
    ? getStatusLine(companionState, lang)
    : lang === "zh"
      ? "先选择一个会替你旅行的小伙伴"
      : "Choose a tiny traveler first";

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
    setCompanionState(advanceCompanionLocationWithoutMessage(savedCompanion ?? createDefaultCompanionState()).state);
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
    if (!companionStateReady) return;

    function refreshCompanionPresence() {
      setCompanionState((currentState) => advanceCompanionLocationWithoutMessage(currentState, Date.now()).state);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") refreshCompanionPresence();
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

  function chooseCompanion(characterId: string) {
    setCompanionState((state) => selectCharacter(state, characterId));
  }

  function openCompanionChat() {
    setCompanionState((currentState) => advanceCompanionLocationWithoutMessage(currentState, Date.now()).state);
    setCompanionChatOpen(true);
  }

  function applyPlan(plan: GeneratedPlan) {
    setProfile(plan.profile);
    setTrips(plan.trips);
    setDeferredTrips(plan.deferredTrips);
    setFindings(plan.findings);
    setSelectedTrip(null);
    setWarp("year-start");
    setPlannerSeed([]);
    setPlanPanelOpen(true);
    window.localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  }

  function clearPlan() {
    setProfile(null);
    setTrips([]);
    setDeferredTrips([]);
    setFindings([]);
    setSelectedTrip(null);
    setWarp("year-start");
    setPlanPanelOpen(false);
    window.localStorage.removeItem(PLAN_KEY);
  }

  const planStatus = hasPlan
    ? lang === "zh"
      ? `${trips.length} 段旅程正在成熟`
      : `${trips.length} trips are maturing`
    : lang === "zh"
      ? "还没有年度计划"
      : "No annual plan yet";
  const companionName = lang === "zh" ? companionCharacter.nameZh : companionCharacter.nameEn;
  const locationName =
    lang === "zh"
      ? `${companionLocation.cityZh} · ${companionLocation.countryZh}`
      : `${companionLocation.cityEn}, ${companionLocation.countryEn}`;
  const localTime = companionLocalTime.displayTime;
  const localHour = companionLocalTime.hour;
  const localMoment =
    localHour < 6
      ? lang === "zh"
        ? "深夜"
        : "late night"
      : localHour < 11
        ? lang === "zh"
          ? "清晨"
          : "morning"
        : localHour < 14
          ? lang === "zh"
            ? "午间"
            : "midday"
          : localHour < 18
            ? lang === "zh"
              ? "午后"
              : "afternoon"
            : localHour < 20
              ? lang === "zh"
                ? "傍晚"
                : "evening"
              : localHour < 22
                ? lang === "zh"
                  ? "晚间"
                  : "night"
                : lang === "zh"
                  ? "深夜"
                  : "late night";
  const actionLabel =
    {
      idle: lang === "zh" ? "停留观察" : "observing",
      walking: lang === "zh" ? "慢慢散步" : "walking",
      photo: lang === "zh" ? "拍照中" : "taking photos",
      food: lang === "zh" ? "找小吃" : "looking for food",
      map: lang === "zh" ? "看地图" : "reading map",
      sleepy: lang === "zh" ? "休息中" : "resting",
      excited: lang === "zh" ? "发现新地点" : "found a new spot",
    }[companionAction] ?? (lang === "zh" ? "在路上" : "on the road");

  return (
    <main
      className={`travel-pixel-shell ${companionScene.className} relative min-h-screen overflow-hidden text-ink-900`}
      style={companionSceneStyle}
    >
      <section className="!absolute left-4 right-4 top-4 z-20 mx-auto max-w-5xl rounded-2xl border border-white/90 bg-[rgba(255,255,255,0.95)] px-4 py-3 shadow-[0_18px_60px_rgba(16,24,36,0.18)] ring-1 ring-ink-900/5 backdrop-blur-xl sm:left-6 sm:right-6 sm:top-6 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-600">
                  {lang === "zh" ? "小动物状态" : "Companion status"}
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h1 className="truncate text-[22px] font-semibold tracking-tight text-ink-950 sm:text-[26px]">
                  {companionName}
                </h1>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {lang === "zh" ? "正在旅途中" : "On the road"}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[12.5px] font-medium leading-relaxed text-ink-700 sm:line-clamp-1">
                {companionStatus}
              </p>
            </div>
            <button
              onClick={() => setLang((value) => (value === "zh" ? "en" : "zh"))}
              className="shrink-0 rounded-full border border-white/90 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink-800 shadow-sm hover:bg-white"
            >
              {lang === "zh" ? "EN" : "中文"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-ink-900/[0.035] p-1.5 text-[11px]">
            <div className="min-w-0 rounded-xl bg-white/80 px-2.5 py-2 shadow-[inset_0_0_0_1px_rgba(28,31,38,0.06)]">
              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                {lang === "zh" ? "状态" : "Status"}
              </div>
              <div className="mt-0.5 truncate font-semibold text-ink-900">{actionLabel}</div>
            </div>
            <div className="min-w-0 rounded-xl bg-white/80 px-2.5 py-2 shadow-[inset_0_0_0_1px_rgba(28,31,38,0.06)]">
              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                {lang === "zh" ? "当前位置" : "Location"}
              </div>
              <div className="mt-0.5 truncate font-semibold text-ink-900">{locationName}</div>
            </div>
            <div className="min-w-0 rounded-xl bg-white/80 px-2.5 py-2 shadow-[inset_0_0_0_1px_rgba(28,31,38,0.06)]">
              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                {lang === "zh" ? "当地时间" : "Local time"}
              </div>
              <div className="mt-0.5 truncate font-semibold text-ink-900">
                {localTime} · {localMoment}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pointer-events-none !absolute inset-x-0 bottom-[24vh] top-[22vh] z-10 flex items-end justify-center px-6 sm:bottom-[13vh] sm:top-[19vh]">
        <div className="relative h-[230px] w-[230px] sm:h-[330px] sm:w-[330px]">
          <div className="absolute bottom-1 left-1/2 h-8 w-44 -translate-x-1/2 rounded-[50%] bg-ink-900/12 blur-md sm:w-64" />
          <div className="pointer-events-auto h-full w-full">
            <InteractiveCompanion
              character={companionCharacter}
              action={companionAction}
              label={lang === "zh" ? companionCharacter.nameZh : companionCharacter.nameEn}
              lang={lang}
              size="lg"
              context={{
                cityName: lang === "zh" ? companionLocation.cityZh : companionLocation.cityEn,
                localHour,
                meal: companionLocalTime.meal,
                currentAction: companionAction,
              }}
            />
          </div>
        </div>
      </section>

      {planPanelOpen && (
        <div className="!fixed inset-0 z-40 animate-fade-in">
          <button
            aria-label={lang === "zh" ? "关闭年度计划" : "Close annual plan"}
            onClick={() => setPlanPanelOpen(false)}
            className="absolute inset-0 cursor-default bg-ink-900/30 backdrop-blur-sm"
          />
          <section className="absolute inset-x-3 bottom-3 top-3 mx-auto flex max-w-6xl flex-col overflow-hidden rounded-2xl border hairline bg-white shadow-2xl sm:inset-x-6 sm:bottom-6 sm:top-6">
            <div className="flex items-center justify-between gap-3 border-b hairline px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                  {lang === "zh" ? "年度计划" : "Annual plan"}
                </div>
                <h2 className="truncate text-[18px] font-semibold tracking-tight text-ink-900">
                  {lang === "zh" ? "随时间成熟的 2026 旅行计划" : "A 2026 travel plan that matures over time"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {hasPlan && (
                  <button
                    onClick={clearPlan}
                    className="rounded-full border hairline bg-white px-3 py-2 text-[12px] text-ink-600 hover:bg-ink-50"
                  >
                    {lang === "zh" ? "清空" : "Clear"}
                  </button>
                )}
                <button
                  onClick={() => setPlanPanelOpen(false)}
                  className="rounded-full border hairline bg-ink-900 px-3 py-2 text-[12px] font-medium text-white hover:bg-aurora-800"
                >
                  {lang === "zh" ? "关闭" : "Close"}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white via-ink-50/35 to-white px-4 py-5 sm:px-6">
              <div className="space-y-5">
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
                    profile={profile}
                    onSelectTrip={setSelectedTrip}
                    onOpenPlanner={() => openPlanner()}
                    onStartWithWishlist={openPlanner}
                  />
                )}
              </div>
            </div>
          </section>
        </div>
      )}

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

      {companionStateReady ? <CompanionOnboarding lang={lang} state={companionState} onSelect={chooseCompanion} /> : null}
      {companionStateReady ? (
        <>
          {!planPanelOpen && !companionChatOpen ? (
            <CompanionBubble
              lang={lang}
              state={companionState}
              chatOpen={companionChatOpen}
              onOpen={openCompanionChat}
              onOpenPlan={() => setPlanPanelOpen(true)}
              planStatus={planStatus}
              planCount={trips.length}
              onStateChange={setCompanionState}
            />
          ) : null}
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
    </main>
  );
}
