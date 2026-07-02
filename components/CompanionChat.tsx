"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import CompanionActionShowcase from "@/components/CompanionActionShowcase";
import CompanionInspirationRadar from "@/components/CompanionInspirationRadar";
import PixelCompanion from "@/components/PixelSpriteCompanion";
import {
  commitCompanionUserMessage,
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

function shouldRenderText(message: CompanionMessage, lang: Lang) {
  if (!message.image) return true;
  const text = messageText(message, lang).trim();
  const caption = (lang === "zh" ? message.image.captionZh : message.image.captionEn).trim();
  return text !== caption;
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
  return lang === "zh" ? "醒着闲逛" : "Awake and wandering";
}

function PhotoCard({ message, lang, onMediaLoad }: { message: CompanionMessage; lang: Lang; onMediaLoad?: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const caption = lang === "zh" ? message.image?.captionZh : message.image?.captionEn;
  const fallbackLabel = lang === "zh" ? "城市照片暂时不可用。" : "This city photo is unavailable right now.";

  if (!message.image) return null;

  return (
    <div className="mb-2 overflow-hidden rounded-xl border hairline bg-ink-100">
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
            {caption ?? fallbackLabel}
          </div>
        ) : null}
      </div>
      <div className="space-y-1 px-3 py-2 text-[10.5px] text-ink-500">
        <div>{caption ?? fallbackLabel}</div>
        <div>{message.image.credit}</div>
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
  const localTime = `${timeInfo.hour.toString().padStart(2, "0")}:00`;

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
    scrollToLatest("auto");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollToLatest("smooth");
  }, [messages.length, open]);

  if (!open || !character) return null;

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;

    setDraft("");
    const now = Date.now();
    const baseState = state;
    const localState = commitCompanionUserMessage(text, baseState, lang, now);
    onStateChange(localState);

    setSending(true);
    try {
      const response = await fetch("/api/companion/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text, state: baseState, lang, now }),
      });
      if (!response.ok) return;

      const result = (await response.json()) as {
        state?: CompanionState;
        messages?: CompanionMessage[];
      };
      if (!result.state || !Array.isArray(result.messages)) return;

      onStateChange((currentState) =>
        mergeGeneratedReplyState(currentState, baseState, result.state as CompanionState, result.messages as CompanionMessage[])
      );
    } catch {
      // The local reply is already committed; network or LLM failures should not block chat.
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-end bg-ink-900/20 p-0 backdrop-blur-sm sm:p-4"
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
                    ? `正在 ${location.cityZh} 旅行 · 当地 ${timeInfo.hour.toString().padStart(2, "0")}:00`
                    : `Traveling in ${location.cityEn} · local ${timeInfo.hour.toString().padStart(2, "0")}:00`}
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

        <div className="border-b hairline bg-[#f8fbf8] px-3 py-3">
          <CompanionInspirationRadar
            lang={lang}
            state={state}
            warp={warp}
            compact
            onStateChange={onStateChange}
            onAddWishlistItems={onAddWishlistItems}
          />
        </div>

        <div ref={scrollRef} className={`chat-paper-bg companion-scene-bg ${scene.className} flex-1 space-y-3 overflow-y-auto px-4 py-4`}>

          {messages.map((message) => {
            const fromUser = message.sender === "user";
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
                  {message.image ? <PhotoCard message={message} lang={lang} onMediaLoad={() => scrollToLatest("smooth")} /> : null}

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

                  {shouldRenderText(message, lang) ? <div>{messageText(message, lang)}</div> : null}
                </div>
              </div>
            );
          })}

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
