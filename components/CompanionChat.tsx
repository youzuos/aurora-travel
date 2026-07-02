"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import CompanionActionShowcase from "@/components/CompanionActionShowcase";
import CompanionInspirationRadar from "@/components/CompanionInspirationRadar";
import PixelCompanion from "@/components/PixelSpriteCompanion";
import {
  createUserMessage,
  getCharacter,
  getCompanionAction,
  getCompanionLocalTimeInfo,
  getCurrentLocation,
  mergeGeneratedReplyState,
  type CompanionMessage,
  type CompanionState,
} from "@/lib/companion";
import { getCompanionScene } from "@/lib/companionScene";
import type { WarpStop } from "@/lib/time";
import type { Lang, WishlistItem } from "@/lib/types";

interface Props {
  open: boolean;
  lang: Lang;
  state: CompanionState;
  warp: WarpStop;
  onClose: () => void;
  onStateChange: (update: CompanionState | ((state: CompanionState) => CompanionState)) => void;
  onAddWishlistItems: (items: WishlistItem[]) => void;
  onChangeCharacter: () => void;
}

function messageText(message: CompanionMessage, lang: Lang) {
  return lang === "zh" ? message.textZh : message.textEn;
}

function speak(text: string, lang: Lang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "zh" ? "zh-CN" : "en-US";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

function timeMoodLabel(timeInfo: ReturnType<typeof getCompanionLocalTimeInfo>, lang: Lang) {
  if (timeInfo.sleeping) return lang === "zh" ? "夜间休息" : "Night rest";
  if (timeInfo.meal === "breakfast") return lang === "zh" ? "早餐时间" : "Breakfast time";
  if (timeInfo.meal === "lunch") return lang === "zh" ? "午餐时间" : "Lunch time";
  if (timeInfo.meal === "dinner") return lang === "zh" ? "晚餐时间" : "Dinner time";
  if (timeInfo.hour < 11) return lang === "zh" ? "上午闲逛" : "Late morning";
  if (timeInfo.hour < 17) return lang === "zh" ? "午后闲逛" : "Afternoon wandering";
  if (timeInfo.hour < 20) return lang === "zh" ? "傍晚闲逛" : "Evening wandering";
  if (timeInfo.hour < 22) return lang === "zh" ? "晚间闲逛" : "Night wandering";
  return lang === "zh" ? "醒着闲逛" : "Awake and wandering";
}

function replyErrorText(error: string | null, lang: Lang) {
  if (!error) return "";
  if (error === "api_unavailable") {
    return lang === "zh"
      ? "聊天接口没有加载到当前代码，请刷新或重启本地服务后再试。"
      : "The chat API is not loaded from the current app. Refresh or restart the local server and try again.";
  }
  if (error === "api_invalid_response") {
    return lang === "zh"
      ? "聊天接口返回了异常内容，请稍后再试。"
      : "The chat API returned an unexpected response. Please try again shortly.";
  }
  if (error === "llm_failed") {
    return lang === "zh"
      ? "LLM 这次没有返回内容，可能是 Gemini 额度或限流问题，请稍后再发一次。"
      : "The LLM did not return content this time, possibly due to Gemini quota or rate limits. Please try again shortly.";
  }
  if (error === "llm_unconfigured") {
    return lang === "zh"
      ? "小动物现在还连不上 LLM，所以不会用本地模板代替回复。请先配置 GEMINI_API_KEY 或 OPENAI_API_KEY。"
      : "The companion cannot reach an LLM yet, and local template replies are disabled. Configure GEMINI_API_KEY or OPENAI_API_KEY first.";
  }
  return lang === "zh"
    ? "小动物这次没有生成成功，请稍后再发一次。"
    : "The companion could not generate a reply this time. Please try again shortly.";
}

async function readCompanionReply(response: Response) {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as {
      error?: string;
      state?: CompanionState;
      messages?: CompanionMessage[];
    };
  } catch {
    return {
      error: response.status === 404 ? "api_unavailable" : "api_invalid_response",
    } as {
      error?: string;
      state?: CompanionState;
      messages?: CompanionMessage[];
    };
  }
}

function PhotoCard({ message, lang, onMediaLoad }: { message: CompanionMessage; lang: Lang; onMediaLoad?: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const fallbackLabel = lang === "zh" ? "城市照片暂时不可用。" : "This city photo is unavailable right now.";

  if (!message.image) return null;

  return (
    <div className="overflow-hidden rounded-xl border hairline bg-ink-100">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-aurora-50 via-white to-ink-100">
        {!imageFailed ? (
          <img
            src={message.image.src}
            alt={message.image.alt}
            className="h-full w-full object-cover"
            onLoad={onMediaLoad}
            onError={() => setImageFailed(true)}
          />
        ) : null}
        {imageFailed ? (
          <div className="absolute inset-0 flex items-end p-3 text-[11px] leading-relaxed text-ink-600">
            {fallbackLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CompanionChat({
  open,
  lang,
  state,
  warp,
  onClose,
  onStateChange,
  onAddWishlistItems,
  onChangeCharacter,
}: Props) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showActionPreview, setShowActionPreview] = useState(false);
  const [radarOpen, setRadarOpen] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const character = state.selectedCharacterId ? getCharacter(state.selectedCharacterId) : null;
  const location = getCurrentLocation(state);
  const messages = useMemo(() => state.messageHistory.slice(-40), [state.messageHistory]);
  const action = getCompanionAction(state);
  const timeInfo = getCompanionLocalTimeInfo(state);
  const scene = getCompanionScene(state);
  const sceneStyle = {
    "--companion-scene-photo": `url("${scene.pixelPhotoSrc}")`,
  } as CSSProperties;
  const localTime = timeInfo.displayTime;

  function scrollToLatest(behavior: ScrollBehavior = "smooth") {
    window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
      bottomRef.current?.scrollIntoView({ block: "end", behavior });
      window.setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
        bottomRef.current?.scrollIntoView({ block: "end", behavior });
      }, 120);
    });
  }

  useEffect(() => {
    if (!open || state.unreadCount === 0) return;
    onStateChange((currentState) => ({ ...currentState, unreadCount: 0 }));
  }, [open, onStateChange, state.unreadCount]);

  useEffect(() => {
    if (!open) return;
    setShowActionPreview(false);
    setRadarOpen(false);
    scrollToLatest("auto");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollToLatest("smooth");
  }, [messages.length, open, replyError]);

  if (!open || !character) return null;

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;

    setDraft("");
    setReplyError(null);
    const now = Date.now();
    const baseState = state;
    const userMessage = createUserMessage(text, now);
    const localState: CompanionState = {
      ...baseState,
      lastActiveAt: now,
      unreadCount: 0,
      messageHistory: [...baseState.messageHistory, userMessage].slice(-60),
    };
    onStateChange(localState);

    setSending(true);
    try {
      const response = await fetch("/api/companion/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text, state: baseState, lang, now }),
      });
      const result = await readCompanionReply(response);
      if (result.error) {
        if (result.state) onStateChange(result.state);
        setReplyError(result.error);
        return;
      }
      if (!response.ok) {
        if (result.state) onStateChange(result.state);
        setReplyError(result.error ?? "llm_failed");
        return;
      }
      if (!result.state || !Array.isArray(result.messages)) throw new Error("Invalid companion reply");

      onStateChange((currentState) =>
        mergeGeneratedReplyState(currentState, baseState, result.state as CompanionState, result.messages as CompanionMessage[])
      );
    } catch {
      // No local template fallback: companion speech is generated only by the LLM.
      setReplyError("llm_failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="!fixed inset-0 z-[60] flex items-end justify-end bg-ink-900/20 p-0 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className={`companion-scene-frame ${scene.className} flex h-[86vh] w-full flex-col overflow-hidden rounded-t-2xl border hairline bg-white shadow-2xl sm:h-[min(760px,calc(100vh-2rem))] sm:max-w-[460px] sm:rounded-2xl`}
        style={sceneStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b hairline px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setShowActionPreview((value) => !value)}
                className="relative h-10 w-10 shrink-0 rounded-lg outline-none ring-0 transition hover:scale-[1.03] focus:ring-2 focus:ring-aurora-200"
                title={lang === "zh" ? "查看小动物状态" : "Show companion states"}
                aria-label={lang === "zh" ? "查看小动物状态" : "Show companion states"}
              >
                <PixelCompanion
                  character={character}
                  action={action}
                  label={lang === "zh" ? character.nameZh : character.nameEn}
                  size="sm"
                  animated
                />
              </button>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-ink-900">
                  {lang === "zh" ? character.nameZh : character.nameEn}
                </div>
                <div className="truncate text-[11px] text-ink-500">
                  {lang === "zh"
                    ? `正在 ${location.cityZh} 旅行 · 当地 ${localTime}`
                    : `Traveling in ${location.cityEn} · local ${localTime}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onChangeCharacter();
                }}
                className="rounded-full border hairline px-3 py-1.5 text-[11px] text-ink-600 hover:bg-ink-50"
              >
                {lang === "zh" ? "换角色" : "Change"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                }}
                className="text-xl leading-none text-ink-400 hover:text-ink-900"
              >
                x
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ink-50 px-3 py-2 text-[11px] text-ink-600">
            <span className="font-medium text-ink-800">
              {lang === "zh" ? "小动物所在城市时间" : "Companion local time"}
            </span>
            <span className="font-semibold text-aurora-700">
              {lang === "zh" ? location.cityZh : location.cityEn} · {localTime} · {timeMoodLabel(timeInfo, lang)}
            </span>
          </div>
          {showActionPreview ? <CompanionActionShowcase lang={lang} character={character} currentAction={action} /> : null}
        </div>

        <div className="border-b hairline bg-[#f8fbf8]/95 px-3 py-2">
          <button
            type="button"
            onClick={() => setRadarOpen((value) => !value)}
            className="flex w-full items-center gap-3 rounded-xl border hairline bg-white/90 px-3 py-2 text-left shadow-sm transition hover:bg-white"
            aria-expanded={radarOpen}
          >
            <span className="relative h-8 w-8 shrink-0">
              <PixelCompanion
                character={character}
                action="map"
                label={lang === "zh" ? character.nameZh : character.nameEn}
                size="sm"
                animated={false}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold text-ink-900">
                {lang === "zh" ? "小动物灵感雷达" : "Companion radar"}
              </span>
              <span className="block truncate text-[11px] text-ink-500">
                {lang === "zh" ? "让它先去替你探路" : "Let it scout ahead"}
              </span>
            </span>
            <span className="rounded-full bg-ink-900 px-3 py-1 text-[11px] font-medium text-white">
              {radarOpen ? (lang === "zh" ? "收起" : "Hide") : lang === "zh" ? "展开" : "Open"}
            </span>
          </button>

          {radarOpen ? (
            <div className="mt-2">
              <CompanionInspirationRadar
                lang={lang}
                state={state}
                warp={warp}
                compact
                onStateChange={onStateChange}
                onAddWishlistItems={onAddWishlistItems}
              />
            </div>
          ) : null}
        </div>

        <div ref={scrollRef} className={`chat-paper-bg companion-scene-bg ${scene.className} flex-1 space-y-3 overflow-y-auto px-4 py-4`}>

          {messages.map((message) => {
            const fromUser = message.sender === "user";
            const text = messageText(message, lang).trim();

            if (message.image) {
              return (
                <div key={message.id} className="space-y-2">
                  <div className={`flex items-end gap-2 ${fromUser ? "justify-end" : "justify-start"}`}>
                    {!fromUser ? (
                      <div className="mb-1 h-8 w-8 shrink-0 overflow-hidden rounded-md bg-white shadow-sm">
                        <PixelCompanion
                          character={character}
                          action={action}
                          label={lang === "zh" ? character.nameZh : character.nameEn}
                          size="sm"
                          animated={false}
                        />
                      </div>
                    ) : null}
                    <div className={`wechat-bubble ${fromUser ? "wechat-bubble-user" : "wechat-bubble-agent"}`}>
                      <PhotoCard message={message} lang={lang} onMediaLoad={() => scrollToLatest("smooth")} />
                    </div>
                  </div>

                  {text ? (
                    <div className={`flex items-end gap-2 ${fromUser ? "justify-end" : "justify-start"}`}>
                      {!fromUser ? <div className="h-8 w-8 shrink-0" /> : null}
                      <div className={`wechat-bubble ${fromUser ? "wechat-bubble-user" : "wechat-bubble-agent"}`}>{text}</div>
                    </div>
                  ) : null}
                </div>
              );
            }

            return (
              <div key={message.id} className={`flex items-end gap-2 ${fromUser ? "justify-end" : "justify-start"}`}>
                {!fromUser ? (
                  <div className="mb-1 h-8 w-8 shrink-0 overflow-hidden rounded-md bg-white shadow-sm">
                    <PixelCompanion
                      character={character}
                      action={action}
                      label={lang === "zh" ? character.nameZh : character.nameEn}
                      size="sm"
                      animated={false}
                    />
                  </div>
                ) : null}
                <div className={`wechat-bubble ${fromUser ? "wechat-bubble-user" : "wechat-bubble-agent"}`}>
                  {message.kind === "voice" ? (
                    <button
                      type="button"
                      onClick={() => speak(messageText(message, lang), lang)}
                      className="mb-1 flex w-full items-center gap-2 rounded-full bg-aurora-50 px-3 py-2 text-left text-[12px] text-aurora-800"
                    >
                      <span>&gt;</span>
                      <span>{message.voiceDurationSec ?? 8}s</span>
                    </button>
                  ) : null}

                  {text ? <div>{text}</div> : null}
                </div>
              </div>
            );
          })}

          {replyError ? (
            <div className="mx-auto max-w-[340px] rounded-xl border hairline bg-white/95 px-3 py-2 text-center text-[11.5px] leading-relaxed text-ink-600 shadow-sm">
              {replyErrorText(replyError, lang)}
            </div>
          ) : null}

          <div ref={bottomRef} className="h-1" />
        </div>

        <div className="border-t hairline bg-white p-3">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void send();
              }}
              placeholder={lang === "zh" ? "问它在做什么，或说：去巴黎" : "Ask what it is doing, or say: go to Paris"}
              className="min-w-0 flex-1 rounded-xl border hairline bg-ink-50 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-aurora-200"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!draft.trim() || sending}
              className="rounded-xl bg-ink-900 px-4 py-2 text-[12px] font-medium text-white disabled:opacity-40"
            >
              {sending ? (lang === "zh" ? "生成中" : "Thinking") : lang === "zh" ? "发送" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
