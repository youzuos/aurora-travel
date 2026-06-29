"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  generateCompanionReply,
  getCharacter,
  getCurrentLocation,
  maybeAdvanceCompanionLocation,
  mergeGeneratedReplyState,
  type CompanionMessage,
  type CompanionState,
} from "@/lib/companion";
import type { Lang } from "@/lib/types";

interface Props {
  open: boolean;
  lang: Lang;
  state: CompanionState;
  onClose: () => void;
  onStateChange: (update: CompanionState | ((state: CompanionState) => CompanionState)) => void;
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

export default function CompanionChat({ open, lang, state, onClose, onStateChange, onChangeCharacter }: Props) {
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const replyTimerRef = useRef<number | null>(null);
  const character = state.selectedCharacterId ? getCharacter(state.selectedCharacterId) : null;
  const location = getCurrentLocation(state);
  const messages = useMemo(() => state.messageHistory.slice(-40), [state.messageHistory]);
  const characterInitial = (lang === "zh" ? character?.nameZh : character?.nameEn)?.slice(0, 1) ?? "";

  function clearPendingReply() {
    if (replyTimerRef.current) {
      window.clearTimeout(replyTimerRef.current);
      replyTimerRef.current = null;
    }
  }

  useEffect(() => {
    if (!open || state.unreadCount === 0) return;
    onStateChange((currentState) => ({ ...currentState, unreadCount: 0 }));
  }, [open, onStateChange, state.unreadCount]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing]);

  useEffect(() => {
    if (open) return;
    clearPendingReply();
    setTyping(false);
  }, [open]);

  useEffect(() => {
    return () => {
      clearPendingReply();
    };
  }, []);

  if (!open || !character) return null;

  function send() {
    const text = draft.trim();
    if (!text || typing) return;

    clearPendingReply();
    setDraft("");

    const now = Date.now();
    const activeState = maybeAdvanceCompanionLocation(state, now, { incrementUnread: false });
    const result = generateCompanionReply(text, activeState, lang, now);
    const userOnlyState: CompanionState = {
      ...result.state,
      messageHistory: activeState.messageHistory.concat(result.messages[0]).slice(-60),
      unreadCount: 0,
    };

    onStateChange(userOnlyState);
    setTyping(true);
    replyTimerRef.current = window.setTimeout(() => {
      replyTimerRef.current = null;
      setTyping(false);
      onStateChange((latestState) =>
        mergeGeneratedReplyState(latestState, userOnlyState, result.state, result.messages.slice(1))
      );
    }, 520);
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
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-br from-aurora-50 to-ink-100">
                <span className="absolute inset-0 z-0 grid place-items-center text-[12px] font-semibold text-aurora-800">
                  {characterInitial}
                </span>
                <img
                  src={character.imageSrc}
                  alt={lang === "zh" ? character.nameZh : character.nameEn}
                  className="relative z-10 h-10 w-10 object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-ink-900">
                  {lang === "zh" ? character.nameZh : character.nameEn}
                </div>
                <div className="truncate text-[11px] text-ink-500">
                  {lang === "zh" ? `正在 ${location.cityZh} 旅行` : `Traveling in ${location.cityEn}`}
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
                  clearPendingReply();
                  setTyping(false);
                  onChangeCharacter();
                }}
                className="rounded-full border hairline px-3 py-1.5 text-[11px] text-ink-600 hover:bg-ink-50"
              >
                {lang === "zh" ? "换角色" : "Change"}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearPendingReply();
                  setTyping(false);
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

          {typing ? (
            <div className="text-[12px] text-ink-400">
              {lang === "zh" ? "旅伴正在打字..." : "Companion is typing..."}
            </div>
          ) : null}
        </div>

        <div className="border-t hairline bg-white p-3">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") send();
              }}
              placeholder={lang === "zh" ? "问它在做什么，或说：去巴黎" : "Ask what it is doing, or say: go to Paris"}
              className="min-w-0 flex-1 rounded-xl border hairline bg-ink-50 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-aurora-200"
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim() || typing}
              className="rounded-xl bg-ink-900 px-4 py-2 text-[12px] font-medium text-white disabled:opacity-40"
            >
              {lang === "zh" ? "发送" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
