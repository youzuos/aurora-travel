"use client";

import { useEffect, useMemo, useState } from "react";
import CompanionActionShowcase from "@/components/CompanionActionShowcase";
import PixelCompanion from "@/components/PixelSpriteCompanion";
import {
  createAgentMessage,
  getCharacter,
  getCompanionAction,
  getCompanionLocalTimeInfo,
  getCurrentLocation,
  type CompanionAction,
  type CompanionMessage,
  type CompanionState,
} from "@/lib/companion";
import {
  companionFindingToWishlistItem,
  resolveCompanionDiscovery,
  type CompanionFinding,
  type CompanionIpHint,
} from "@/lib/companionExploration";
import type { WarpStop } from "@/lib/time";
import type { Lang, WishlistItem } from "@/lib/types";

interface Props {
  lang: Lang;
  state: CompanionState;
  warp: WarpStop;
  onStateChange: (update: CompanionState | ((state: CompanionState) => CompanionState)) => void;
  onAddWishlistItems: (items: WishlistItem[]) => void;
  onComplete: () => void;
}

const PREFERENCE_CHIPS = [
  { zh: "自然", en: "nature" },
  { zh: "城市", en: "city" },
  { zh: "美食", en: "food" },
  { zh: "夜景", en: "night views" },
  { zh: "安静", en: "quiet" },
];

const CLEAN_DESTINATION_LABELS: Record<string, { zh: string; en: string }> = {
  kyoto: { zh: "京都，日本", en: "Kyoto, Japan" },
  osaka: { zh: "大阪，日本", en: "Osaka, Japan" },
  nara: { zh: "奈良，日本", en: "Nara, Japan" },
  reykjavik: { zh: "雷克雅未克，冰岛", en: "Reykjavik, Iceland" },
  mohe: { zh: "漠河，中国", en: "Mohe, China" },
  wuhan: { zh: "武汉，中国", en: "Wuhan, China" },
  changbai: { zh: "长白山，中国", en: "Changbai Mountain, China" },
  kanas: { zh: "喀纳斯，中国", en: "Kanas, China" },
  tromso: { zh: "特罗姆瑟，挪威", en: "Tromso, Norway" },
  paris: { zh: "巴黎，法国", en: "Paris, France" },
  amsterdam: { zh: "阿姆斯特丹，荷兰", en: "Amsterdam, Netherlands" },
  brussels: { zh: "布鲁塞尔，比利时", en: "Brussels, Belgium" },
};

const CLEAN_NOTES_ZH: Record<string, string> = {
  kyoto: "我先去京都替你看了看。这里适合慢慢逛寺院、河边和小巷，春天会特别有旅行感。",
  osaka: "我跑到大阪闻了闻街头热气。这里更热闹，适合把美食、夜景和轻松的城市散步放在一起。",
  nara: "我在奈良公园附近绕了一圈。这里安静、松弛，适合当作日本路线里的一段柔软停顿。",
  reykjavik: "我到雷克雅未克看了天空和海风。这里适合想追极光、看自然景观的人。",
  mohe: "我去了漠河，围巾都快被冻硬了。这里适合想看冬天边界感和雪夜的人。",
  wuhan: "我在武汉东湖边探了探路。这里适合春天、樱花、湖边散步和早餐路线。",
  changbai: "我在长白山脚下等云散。这里适合喜欢山、湖、天气变化和自然感的人。",
  kanas: "我去了喀纳斯，风把地图都吹得像秋天。这里适合森林、湖泊和慢节奏自然旅行。",
  tromso: "我到特罗姆瑟听海风。这里适合极光、港口、寒夜和一点点冒险。",
  paris: "我先到巴黎替你占了一个靠窗位置。这里适合博物馆、咖啡、河边散步和傍晚的光。",
  amsterdam: "我在阿姆斯特丹数桥和自行车。这里适合运河、博物馆、雨后街道和轻快城市游。",
  brussels: "我去了布鲁塞尔广场附近探路。这里适合巧克力、火车中转和一段轻量欧洲城市停靠。",
};

function copy(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

function appendMessage(history: readonly CompanionMessage[], message: CompanionMessage) {
  return [...history.filter((item) => item.id !== message.id), message].slice(-60);
}

function cleanLabel(finding: CompanionFinding, lang: Lang) {
  const label = CLEAN_DESTINATION_LABELS[finding.cityId];
  if (label) return copy(lang, label.zh, label.en);
  return lang === "zh" ? `${finding.cityZh}, ${finding.countryZh}` : `${finding.cityEn}, ${finding.countryEn}`;
}

function cleanNote(finding: CompanionFinding, lang: Lang) {
  return lang === "zh" ? CLEAN_NOTES_ZH[finding.cityId] ?? finding.textZh : finding.textEn;
}

function sourceLabel(lang: Lang, source: CompanionFinding["source"]) {
  const labels: Record<CompanionFinding["source"], { zh: string; en: string }> = {
    "direct-input": { zh: "你指定的地方", en: "Your destination" },
    "country-match": { zh: "国家匹配", en: "Country match" },
    "tag-match": { zh: "偏好匹配", en: "Preference match" },
    random: { zh: "随机探路", en: "Random scout" },
    nearby: { zh: "附近探路", en: "Nearby scout" },
    "ip-hint": { zh: "就近灵感", en: "Local hint" },
  };
  return copy(lang, labels[source].zh, labels[source].en);
}

function actionLabel(lang: Lang, action: CompanionAction) {
  const labels: Record<CompanionAction, { zh: string; en: string }> = {
    idle: { zh: "待机陪伴", en: "Standing by" },
    walking: { zh: "旅行中", en: "Traveling" },
    photo: { zh: "拍照中", en: "Taking photos" },
    food: { zh: "吃小吃", en: "Trying snacks" },
    map: { zh: "看地图", en: "Reading map" },
    sleepy: { zh: "休息中", en: "Resting" },
    excited: { zh: "发现灵感", en: "Found a spark" },
  };
  return copy(lang, labels[action].zh, labels[action].en);
}

export default function CompanionDestinationOnboarding({
  lang,
  state,
  warp,
  onStateChange,
  onAddWishlistItems,
  onComplete,
}: Props) {
  const [draft, setDraft] = useState("");
  const [candidates, setCandidates] = useState<CompanionFinding[]>([]);
  const [round, setRound] = useState(0);
  const [activePreference, setActivePreference] = useState("");
  const [ipHint, setIpHint] = useState<CompanionIpHint | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const character = state.selectedCharacterId ? getCharacter(state.selectedCharacterId) : null;
  const location = getCurrentLocation(state);
  const companionAction = getCompanionAction(state);
  const timeInfo = getCompanionLocalTimeInfo(state);
  const heroAction: CompanionAction = companionAction === "idle" ? "map" : companionAction;
  const introText = useMemo(() => {
    const place = lang === "zh" ? CLEAN_DESTINATION_LABELS[location.id]?.zh ?? location.cityZh : location.cityEn;
    return copy(
      lang,
      `先让 ${character?.nameEn ?? "小动物"} 从 ${place} 出发，帮你快速判断下一段旅行要不要成形。`,
      `Let ${character?.nameEn ?? "your companion"} start from ${place} and quickly turn a travel spark into a destination.`
    );
  }, [character?.nameEn, lang, location.cityEn, location.cityZh, location.id]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/companion/ip-hint")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { hint?: CompanionIpHint | null } | null) => {
        if (!cancelled && payload?.hint) setIpHint(payload.hint);
      })
      .catch(() => {
        // IP hints only improve ranking. The flow works without them.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!character || !state.onboardingCompleted) return null;

  function scout(input: string, preference = "", limit = 3) {
    const now = Date.now();
    const nextCandidates = resolveCompanionDiscovery(input, state, {
      now,
      warp,
      limit,
      preference,
      ipHint,
    });
    setCandidates(nextCandidates);
    setFailedImages({});
    setRound((value) => Math.min(3, value + 1));

    const first = nextCandidates[0];
    if (!first) return;

    const label = cleanLabel(first, "zh");
    const zh = `我先替你去了${label}。${cleanNote(first, "zh")}`;
    const en = `I went ahead to ${cleanLabel(first, "en")}. ${cleanNote(first, "en")}`;
    const message = createAgentMessage(first.photo ? "mixed" : "text", zh, en, now + 19, {
      image: first.photo
        ? {
            src: first.photo.src,
            alt: first.photo.alt,
            credit: first.photo.credit,
            captionZh: zh,
            captionEn: en,
          }
        : undefined,
    });

    onStateChange((currentState) => ({
      ...currentState,
      currentLocationId: first.cityId,
      lastMovedAt: now,
      lastActiveAt: now,
      statusCursor: currentState.statusCursor + 1,
      visualAction: first.photo ? "photo" : "map",
      unreadCount: 0,
      messageHistory: appendMessage(currentState.messageHistory, message),
    }));
  }

  function chooseDirect() {
    scout(draft.trim(), "", draft.trim() ? 1 : 3);
  }

  function scoutUndecided() {
    scout(draft.trim(), activePreference, 3);
  }

  function choosePreference(preference: string) {
    setActivePreference(preference);
    scout(draft.trim(), preference, 3);
  }

  function addCandidate(finding: CompanionFinding) {
    onAddWishlistItems([companionFindingToWishlistItem(finding)]);
    onComplete();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-aurora-100 bg-white shadow-[0_18px_60px_rgba(27,42,76,0.08)]">
      <div className={`grid gap-0 ${candidates.length ? "lg:grid-cols-[0.9fr_1.1fr]" : ""}`}>
        <div
          className={`border-b border-aurora-100 bg-gradient-to-br from-aurora-50 via-white to-rose-50 p-5 sm:p-6 lg:border-b-0 ${
            candidates.length ? "lg:border-r" : ""
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <PixelCompanion character={character} action={heroAction} label={copy(lang, character.nameZh, character.nameEn)} size="lg" animated />
              <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-aurora-700">
                {copy(lang, "第一步：让小动物判断目的地", "Step 1: destination spark")}
              </div>
              <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-ink-900">
                {copy(lang, "你已经有想去的地方了吗？", "Do you already have a place in mind?")}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-600">{introText}</p>
              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border hairline bg-white/80 px-3 py-1.5 text-[11px] font-medium text-ink-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{copy(lang, "当前状态", "Status")}</span>
                <span className="text-aurora-700">{actionLabel(lang, heroAction)}</span>
                <span className="text-ink-300">/</span>
                <span className="truncate">{lang === "zh" ? timeInfo.labelZh : timeInfo.labelEn}</span>
              </div>
              <CompanionActionShowcase lang={lang} character={character} currentAction={heroAction} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={copy(
                lang,
                "可以写：巴黎 / 日本 / 海边 / 想看极光 / 不知道，随机出发",
                "Try: Paris / Japan / seaside / aurora / not sure, surprise me"
              )}
              className="min-h-[104px] w-full resize-none rounded-2xl border hairline bg-white/80 px-4 py-3 text-[14px] leading-relaxed text-ink-800 outline-none focus:ring-2 focus:ring-aurora-200"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={chooseDirect}
                className="rounded-xl bg-ink-900 px-4 py-3 text-[13px] font-medium text-white hover:bg-aurora-700"
              >
                {copy(lang, "我已经有想去的地方", "I have a destination")}
              </button>
              <button
                type="button"
                onClick={scoutUndecided}
                className="rounded-xl border hairline bg-white px-4 py-3 text-[13px] font-medium text-ink-700 hover:border-aurora-200 hover:bg-aurora-50"
              >
                {copy(lang, "还没想好，让它先去探路", "Not sure, let it scout")}
              </button>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              {copy(lang, `快速偏好 · 第 ${Math.max(1, round || 1)}/3 轮`, `Quick preference · round ${Math.max(1, round || 1)}/3`)}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {PREFERENCE_CHIPS.map((chip) => {
                const value = copy(lang, chip.zh, chip.en);
                const active = activePreference === value;
                return (
                  <button
                    key={chip.en}
                    type="button"
                    onClick={() => choosePreference(value)}
                    className={`rounded-full border px-3 py-1.5 text-[12px] ${
                      active
                        ? "border-aurora-300 bg-aurora-100 text-aurora-800"
                        : "hairline bg-white text-ink-600 hover:border-aurora-200"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={scoutUndecided}
                className="rounded-full border hairline bg-white px-3 py-1.5 text-[12px] text-ink-600 hover:border-aurora-200"
              >
                {copy(lang, "换一批", "Shuffle")}
              </button>
            </div>
          </div>

          <button type="button" onClick={onComplete} className="mt-4 text-[12px] text-ink-400 hover:text-ink-700">
            {copy(lang, "先跳过，看看首页", "Skip for now")}
          </button>
        </div>

        {candidates.length ? (
          <div className="bg-ink-50/50 p-5 sm:p-6">
            <div className="grid gap-3">
              {candidates.map((finding, index) => (
                <article key={finding.id} className="overflow-hidden rounded-xl border hairline bg-white">
                  <div className="grid gap-0 sm:grid-cols-[180px_1fr]">
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-aurora-50 to-ink-100 sm:aspect-auto">
                      {finding.photo && !failedImages[finding.id] ? (
                        <img
                          src={finding.photo.src}
                          alt={finding.photo.alt}
                          className="h-full w-full object-cover"
                          onError={() => setFailedImages((value) => ({ ...value, [finding.id]: true }))}
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center p-3">
                          <PixelCompanion character={character} action={index === 0 ? "photo" : "walking"} label={character.nameEn} size="md" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-aurora-700">
                        <span>{sourceLabel(lang, finding.source)}</span>
                        <span className="h-1 w-1 rounded-full bg-aurora-300" />
                        <span>{copy(lang, index === 0 ? "最推荐" : "备选灵感", index === 0 ? "Top pick" : "Option")}</span>
                      </div>
                      <h3 className="mt-2 text-[17px] font-semibold tracking-tight text-ink-900">{cleanLabel(finding, lang)}</h3>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-600">{cleanNote(finding, lang)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => addCandidate(finding)}
                          className="rounded-lg bg-aurora-700 px-3 py-2 text-[12px] font-medium text-white hover:bg-ink-900"
                        >
                          {copy(lang, "加入本次旅行清单", "Add to this trip")}
                        </button>
                        <button
                          type="button"
                          onClick={() => scout(cleanLabel(finding, "en"), "", 1)}
                          className="rounded-lg border hairline bg-white px-3 py-2 text-[12px] font-medium text-ink-600 hover:bg-ink-50"
                        >
                          {copy(lang, "就看这个", "Focus here")}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
