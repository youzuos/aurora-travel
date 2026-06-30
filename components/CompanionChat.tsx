"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function PhotoCard({ message, lang }: { message: CompanionMessage; lang: Lang }) {
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const character = state.selectedCharacterId ? getCharacter(state.selectedCharacterId) : null;
  const location = getCurrentLocation(state);
  const messages = useMemo(() => state.messageHistory.slice(-40), [state.messageHistory]);
  const action = getCompanionAction(state);
  const timeInfo = getCompanionLocalTimeInfo(state);

  useEffect(() => {
    if (!open || state.unreadCount === 0) return;
    onStateChange((currentState) => ({ ...currentState, unreadCount: 0 }));
  }, [open, onStateChange, state.unreadCount]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

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
        className="flex h-[86vh] w-full flex-col overflow-hidden rounded-t-2xl border hairline bg-white shadow-2xl sm:h-[min(760px,calc(100vh-2rem))] sm:max-w-[420px] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b hairline px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-10 w-10 shrink-0">
                <PixelCompanion
                  character={character}
                  action={action}
                  label={lang === "zh" ? character.nameZh : character.nameEn}
                  size="sm"
                  animated={false}
                />
              </div>
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
                onClick={() => onStateChange((currentState) => ({ ...currentState, testMode: !currentState.testMode }))}
                className="inline-flex items-center gap-1 rounded-full border hairline px-3 py-1.5 text-[11px] text-ink-600 hover:bg-ink-50"
                title={lang === "zh" ? "切换旅伴测试速度" : "Toggle accelerated companion timing"}
              >
                <span className="text-sm leading-none">!</span>
                <span className="hidden sm:inline">
                  {state.testMode ? (lang === "zh" ? "测试快" : "Fast") : lang === "zh" ? "正常" : "Normal"}
                </span>
              </button>
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
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ink-50/50 px-4 py-4">
          <CompanionInspirationRadar
            lang={lang}
            state={state}
            warp={warp}
            compact
            onStateChange={onStateChange}
            onAddWishlistItems={onAddWishlistItems}
          />

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                  message.sender === "user" ? "bg-ink-900 text-white" : "border hairline bg-white text-ink-800"
                }`}
              >
                {message.image ? <PhotoCard message={message} lang={lang} /> : null}

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

                <div>{messageText(message, lang)}</div>
              </div>
            </div>
          ))}

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
