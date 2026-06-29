"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  generateCompanionReply,
  getCharacter,
  getCurrentLocation,
  type CompanionMessage,
  type CompanionState,
} from "@/lib/companion";
import type { Lang } from "@/lib/types";

interface Props {
  open: boolean;
  lang: Lang;
  state: CompanionState;
  onClose: () => void;
  onStateChange: (state: CompanionState) => void;
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

export default function CompanionChat({ open, lang, state, onClose, onStateChange, onChangeCharacter }: Props) {
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const character = state.selectedCharacterId ? getCharacter(state.selectedCharacterId) : null;
  const location = getCurrentLocation(state);
  const messages = useMemo(() => state.messageHistory.slice(-40), [state.messageHistory]);

  useEffect(() => {
    if (!open || state.unreadCount === 0) return;
    onStateChange({ ...state, unreadCount: 0 });
  }, [open, onStateChange, state]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing]);

  useEffect(() => {
    if (open) return;
    setTyping(false);
  }, [open]);

  if (!open || !character) return null;

  function send() {
    const text = draft.trim();
    if (!text || typing) return;

    setDraft("");
    const result = generateCompanionReply(text, state, lang);
    const userOnlyState = {
      ...result.state,
      messageHistory: [...state.messageHistory, result.messages[0]].slice(-60),
    };

    onStateChange(userOnlyState);
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      onStateChange(result.state);
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
              <img
                src={character.imageSrc}
                alt={lang === "zh" ? character.nameZh : character.nameEn}
                className="h-10 w-10 rounded-xl object-cover"
              />
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
                onClick={onChangeCharacter}
                className="rounded-full border hairline px-3 py-1.5 text-[11px] text-ink-600 hover:bg-ink-50"
              >
                {lang === "zh" ? "换角色" : "Change"}
              </button>
              <button type="button" onClick={onClose} className="text-xl leading-none text-ink-400 hover:text-ink-900">
                ×
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
                {message.image ? (
                  <div className="mb-2 overflow-hidden rounded-xl bg-ink-100">
                    <img src={message.image.src} alt={message.image.alt} className="aspect-[4/3] w-full object-cover" />
                    <div className="px-3 py-2 text-[10.5px] text-ink-500">{message.image.credit}</div>
                  </div>
                ) : null}

                {message.kind === "voice" ? (
                  <button
                    type="button"
                    onClick={() => speak(messageText(message, lang), lang)}
                    className="mb-1 flex w-full items-center gap-2 rounded-full bg-aurora-50 px-3 py-2 text-left text-[12px] text-aurora-800"
                  >
                    <span>▶</span>
                    <span>{message.voiceDurationSec ?? 8}s</span>
                  </button>
                ) : null}

                <div>{messageText(message, lang)}</div>
              </div>
            </div>
          ))}

          {typing ? (
            <div className="text-[12px] text-ink-400">{lang === "zh" ? "小旅伴正在打字..." : "Companion is typing..."}</div>
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
