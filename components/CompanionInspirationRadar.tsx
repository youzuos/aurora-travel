"use client";

import { useEffect, useMemo, useState } from "react";
import PixelCompanion from "@/components/PixelSpriteCompanion";
import {
  createAgentMessage,
  getCharacter,
  getCurrentLocation,
  type CompanionMessage,
  type CompanionState,
} from "@/lib/companion";
import {
  companionFindingToWishlistItem,
  resolveCompanionExploration,
  type CompanionFinding,
  type CompanionIpHint,
} from "@/lib/companionExploration";
import type { WarpStop } from "@/lib/time";
import type { Lang, WishlistItem } from "@/lib/types";

interface Props {
  lang: Lang;
  state: CompanionState;
  warp: WarpStop;
  compact?: boolean;
  onStateChange: (update: CompanionState | ((state: CompanionState) => CompanionState)) => void;
  onAddWishlistItems: (items: WishlistItem[]) => void;
}

type ExploreMode = "input" | "nearby" | "random";

const SUGGESTIONS = [
  { zh: "海边", en: "seaside" },
  { zh: "美食", en: "food" },
  { zh: "樱花", en: "blossoms" },
  { zh: "极光", en: "aurora" },
  { zh: "小众安静", en: "quiet hidden gem" },
];

function copy(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

function sourceLabel(lang: Lang, source: CompanionFinding["source"]) {
  const labels: Record<CompanionFinding["source"], { zh: string; en: string }> = {
    "direct-input": { zh: "指定目的地", en: "Chosen place" },
    "country-match": { zh: "国家灵感", en: "Country match" },
    "tag-match": { zh: "主题灵感", en: "Theme match" },
    random: { zh: "随机出发", en: "Random start" },
    nearby: { zh: "附近探索", en: "Nearby" },
    "ip-hint": { zh: "随机灵感", en: "Random hint" },
  };
  return copy(lang, labels[source].zh, labels[source].en);
}

function stageLabel(lang: Lang, warp: WarpStop) {
  const labels: Record<WarpStop, { zh: string; en: string }> = {
    "year-start": { zh: "年初灵感", en: "Year-start idea" },
    "t-90": { zh: "出发前 3 个月", en: "3 months out" },
    "t-30": { zh: "出发前 1 个月", en: "1 month out" },
    "t-14": { zh: "T-14 精细化", en: "T-14 detail" },
  };
  return copy(lang, labels[warp].zh, labels[warp].en);
}

function appendMessage(history: readonly CompanionMessage[], message: CompanionMessage) {
  return [...history.filter((item) => item.id !== message.id), message].slice(-60);
}

export default function CompanionInspirationRadar({
  lang,
  state,
  warp,
  compact = false,
  onStateChange,
  onAddWishlistItems,
}: Props) {
  const [draft, setDraft] = useState("");
  const [finding, setFinding] = useState<CompanionFinding | null>(null);
  const [ipHint, setIpHint] = useState<CompanionIpHint | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const character = state.selectedCharacterId ? getCharacter(state.selectedCharacterId) : null;
  const location = getCurrentLocation(state);
  const destinationLabel = useMemo(() => {
    if (!finding) return "";
    return lang === "zh" ? `${finding.cityZh}，${finding.countryZh}` : `${finding.cityEn}, ${finding.countryEn}`;
  }, [finding, lang]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/companion/ip-hint")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { hint?: CompanionIpHint | null } | null) => {
        if (!cancelled && payload?.hint) setIpHint(payload.hint);
      })
      .catch(() => {
        // IP hints are only a soft fallback for random departure.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!character || !state.onboardingCompleted) return null;

  function explore(mode: ExploreMode) {
    const now = Date.now();
    const nextFinding = resolveCompanionExploration(mode === "input" ? draft : "", state, {
      now,
      warp,
      mode,
      ipHint,
    });
    setFinding(nextFinding);
    setImageFailed(false);

    const zh = `我替你先到 ${nextFinding.cityZh} 看了看。${nextFinding.textZh}`;
    const en = `I went ahead to ${nextFinding.cityEn} for you. ${nextFinding.textEn}`;
    const message = createAgentMessage(nextFinding.photo ? "mixed" : "text", zh, en, now + 17, {
      image: nextFinding.photo
        ? {
            src: nextFinding.photo.src,
            alt: nextFinding.photo.alt,
            credit: nextFinding.photo.credit,
            captionZh: zh,
            captionEn: en,
          }
        : undefined,
    });

    onStateChange((currentState) => ({
      ...currentState,
      currentLocationId: nextFinding.cityId,
      lastMovedAt: now,
      lastActiveAt: now,
      statusCursor: currentState.statusCursor + 1,
      visualAction: nextFinding.photo ? "photo" : "map",
      unreadCount: 0,
      messageHistory: appendMessage(currentState.messageHistory, message),
    }));
  }

  function addToWishlist() {
    if (!finding) return;
    onAddWishlistItems([companionFindingToWishlistItem(finding)]);
    setFinding({ ...finding, addedToWishlist: true });
  }

  return (
    <section className={`${compact ? "rounded-xl border hairline bg-white/95" : "travel-ticket-card overflow-hidden rounded-xl border-aurora-100"}`}>
      <div className={`grid gap-0 ${compact || !finding ? "grid-cols-1" : "lg:grid-cols-[1.05fr_0.95fr]"}`}>
        <div className={compact ? "p-3" : "p-4 sm:p-5"}>
          <div className="flex items-start gap-3">
            <div className={`${compact ? "h-10 w-10" : "h-12 w-12"} relative shrink-0`}>
              <PixelCompanion
                character={character}
                action="map"
                label={copy(lang, character.nameZh, character.nameEn)}
                size={compact ? "sm" : "md"}
                animated={!compact}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-aurora-700">
                {copy(lang, "小动物灵感雷达", "Companion radar")}
              </div>
              <h2 className={`${compact ? "text-[14px]" : "text-[20px]"} mt-1 font-semibold tracking-tight text-ink-900`}>
                {copy(lang, "让它先去替你探路", "Let it scout ahead")}
              </h2>
              <div className={`${compact ? "hidden sm:block" : ""} mt-1 text-[12px] leading-relaxed text-ink-500`}>
                {copy(
                  lang,
                  `现在在 ${location.cityZh}。你可以写城市、国家或想要的氛围，也可以直接随机出发。`,
                  `Now in ${location.cityEn}. Enter a city, country, or mood, or start randomly.`
                )}
              </div>
            </div>
          </div>

          <div className={`${compact ? "mt-3" : "mt-4"} grid gap-2 sm:grid-cols-[1fr_auto]`}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") explore("input");
              }}
              placeholder={copy(lang, "巴黎 / 日本 / 海边 / 极光 / 空着随机", "Paris / Japan / seaside / aurora / blank random")}
              className="min-w-0 rounded-xl border hairline bg-ink-50 px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-aurora-200"
            />
            <button
              type="button"
              onClick={() => explore("input")}
              className="rounded-xl bg-ink-900 px-4 py-2.5 text-[12px] font-medium text-white hover:bg-aurora-700"
            >
              {copy(lang, "派它去看看", "Scout")}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((item) => (
              <button
                key={item.en}
                type="button"
                onClick={() => setDraft(copy(lang, item.zh, item.en))}
                className="rounded-full border hairline bg-white px-3 py-1.5 text-[11px] text-ink-600 hover:border-aurora-200 hover:bg-aurora-50"
              >
                {copy(lang, item.zh, item.en)}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => explore("random")}
              className="rounded-xl border border-aurora-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-aurora-800 shadow-sm hover:bg-aurora-50"
            >
              {copy(lang, "随机出发", "Random start")}
            </button>
            <button
              type="button"
              onClick={() => explore("nearby")}
              className="rounded-xl bg-aurora-700 px-3 py-2.5 text-[12px] font-semibold text-white shadow-sm hover:bg-ink-900"
            >
              {copy(lang, "继续附近探索", "Explore nearby")}
            </button>
          </div>

          {!finding && !compact ? (
            <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
              {copy(lang, "探到喜欢的地方后，可以直接加入年度愿望。", "When a place feels right, add it to your annual wishes.")}
            </p>
          ) : null}
        </div>

        {finding ? (
          <div className="border-t hairline bg-ink-50/60 p-4 sm:p-5 lg:border-l lg:border-t-0">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-aurora-700">
                <span>{sourceLabel(lang, finding.source)}</span>
                <span className="h-1 w-1 rounded-full bg-aurora-300" />
                <span>{stageLabel(lang, finding.maturityStage)}</span>
                {typeof finding.distanceKm === "number" ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-aurora-300" />
                    <span>{copy(lang, `约 ${finding.distanceKm} km`, `${finding.distanceKm} km`)}</span>
                  </>
                ) : null}
              </div>
              <div>
                <div className="text-[17px] font-semibold text-ink-900">{destinationLabel}</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-700">
                  {lang === "zh" ? finding.textZh : finding.textEn}
                </p>
              </div>

              {finding.photo ? (
                <div className="overflow-hidden rounded-lg border hairline bg-white">
                  <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-aurora-50 via-white to-ink-100">
                    {!imageFailed ? (
                      <img
                        src={finding.photo.src}
                        alt={finding.photo.alt}
                        className="h-full w-full object-cover"
                        onError={() => setImageFailed(true)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-end p-3 text-[11px] leading-relaxed text-ink-600">
                        {lang === "zh" ? finding.textZh : finding.textEn}
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2 text-[10px] text-ink-400">{finding.photo.credit}</div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={addToWishlist}
                disabled={finding.addedToWishlist}
                className="w-full rounded-xl bg-aurora-700 px-4 py-2.5 text-[12px] font-medium text-white hover:bg-ink-900 disabled:bg-ink-300"
              >
                {finding.addedToWishlist ? copy(lang, "已加入本次旅行清单", "Added to trip wishes") : copy(lang, "加入本次旅行清单", "Add to trip wishes")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
