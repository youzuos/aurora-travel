"use client";

import { useEffect, useRef, useState } from "react";
import { AGENT_THINKING } from "@/data/agentScripts";
import type { AgentStep } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SUGGESTED = [
  "想看樱花、极光、胡杨、天池，年假 12 天",
  "我想加上新疆胡杨",
  "5 天假飞武汉看樱花，怎么不踩空？",
  "极光，11/12 月没有长假怎么办？",
];

const AGENT_META: Record<
  AgentStep["agent"],
  { name: string; emoji: string; color: string }
> = {
  timing: {
    name: "时机 Agent",
    emoji: "🌸",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  holiday: {
    name: "假期 Agent",
    emoji: "📅",
    color: "bg-amber-50 text-amber-800 border-amber-200",
  },
  price: {
    name: "价格 Agent",
    emoji: "💰",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  combined: {
    name: "综合 Agent",
    emoji: "🎯",
    color: "bg-aurora-50 text-aurora-800 border-aurora-200",
  },
};

export default function ChatOverlay({ open, onClose }: Props) {
  const [input, setInput] = useState("");
  const [playing, setPlaying] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function submit(message: string) {
    if (!message.trim() || playing) return;
    setInput(message);
    setPlaying(true);
    setDone(false);
    setSteps([]);
    let i = 0;
    const tick = () => {
      if (i >= AGENT_THINKING.length) {
        setPlaying(false);
        setDone(true);
        return;
      }
      const step = AGENT_THINKING[i];
      setSteps((prev) => [...prev, step]);
      i += 1;
      setTimeout(tick, step.dwellMs);
    };
    tick();
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps.length]);

  useEffect(() => {
    if (!open) {
      setSteps([]);
      setDone(false);
      setPlaying(false);
      setInput("");
    }
  }, [open]);

  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  if (!open) return null;

  // group steps by agent for nicer rendering
  const grouped: { agent: AgentStep["agent"]; items: AgentStep[] }[] = [];
  for (const s of steps) {
    const last = grouped[grouped.length - 1];
    if (last && last.agent === s.agent) last.items.push(s);
    else grouped.push({ agent: s.agent, items: [s] });
  }

  const currentAgent = steps[steps.length - 1]?.agent;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white border hairline shadow-2xl overflow-hidden animate-slide-up max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b hairline flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-md bg-ink-900 text-white text-xs grid place-items-center">
              ✦
            </span>
            <div>
              <div className="text-[13px] font-semibold tracking-tight">
                Chat with Aurora
              </div>
              <div className="text-[10.5px] text-ink-500">
                起点 · 也是任意时刻持续修改入口
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-900 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* messages area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {steps.length === 0 && (
            <div>
              <div className="text-[12.5px] text-ink-600 mb-3">
                试试这些（或直接输入你的心愿）：
              </div>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="text-left text-[12.5px] px-4 py-2.5 rounded-lg border hairline bg-ink-50/60 hover:bg-aurora-50 hover:border-aurora-200 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="mt-5 text-[11px] text-ink-400">
                追问 3 件事：假期 / 预算 / 不可用时间
              </div>
            </div>
          )}

          {input && steps.length > 0 && (
            <div className="flex justify-end">
              <div className="max-w-[78%] rounded-2xl rounded-tr-md bg-ink-900 text-white px-4 py-2.5 text-[12.5px]">
                {input}
              </div>
            </div>
          )}

          {grouped.map((g, gi) => {
            const meta = AGENT_META[g.agent];
            return (
              <div key={gi} className="flex gap-3 animate-fade-in">
                <div
                  className={`shrink-0 h-9 w-9 rounded-lg border ${meta.color} grid place-items-center text-base`}
                >
                  {meta.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] font-semibold text-ink-900">
                      {meta.name}
                    </span>
                    {playing && currentAgent === g.agent && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-ink-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-aurora-500 animate-pulse-soft" />
                        thinking
                      </span>
                    )}
                  </div>
                  <ul className="mt-1.5 space-y-1.5">
                    {g.items.map((s, si) => (
                      <li
                        key={si}
                        className="text-[12.5px] text-ink-800 leading-relaxed animate-fade-in"
                      >
                        <span className="text-ink-400 mr-1.5">›</span>
                        {s.text}
                        {s.evidence && (
                          <div className="mt-1 ml-3 px-2.5 py-1.5 rounded-md bg-ink-50 border hairline text-[11.5px] text-ink-600 font-mono">
                            {s.evidence}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}

          {done && <CombinedSummary />}
        </div>

        {/* input row */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="border-t hairline px-4 py-3 flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              playing
                ? "Agents thinking…"
                : "聊聊心愿，例如：我想加上新疆胡杨"
            }
            disabled={playing}
            className="flex-1 bg-transparent px-3 py-2 text-[13px] focus:outline-none placeholder:text-ink-400"
          />
          <button
            type="submit"
            disabled={playing || !input.trim()}
            className="px-4 py-2 rounded-lg bg-ink-900 text-white text-[12px] font-medium disabled:opacity-30 hover:bg-aurora-700 transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function CombinedSummary() {
  return (
    <div className="mt-2 rounded-xl border-2 border-aurora-300 bg-gradient-to-br from-aurora-50 to-white p-5 animate-slide-up">
      <div className="text-[10.5px] uppercase tracking-[0.18em] text-aurora-700 font-semibold mb-2">
        ★ 综合 Agent · 年假组合优化结果
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <KPI label="PTO 用量" value="10 / 12" hint="留 2 天缓冲" />
        <KPI label="峰值概率均值" value="0.68" hint="历史前 8%" />
        <KPI label="总价" value="¥26.4k" hint="¥28k 预算内" />
      </div>
      <div className="space-y-1.5 text-[12px] text-ink-800">
        <Row ok>京都樱花 · 6d · 清明拼假 1:2.0</Row>
        <Row ok>冰岛极光 · 8d · 春节尾拼假</Row>
        <Row ok>长白山天池 · 4d · 端午拼假 1:4.0</Row>
        <Row defer>新疆胡杨 → 挪到 2027（窗口竞争）</Row>
      </div>
      <div className="mt-3 text-[11.5px] text-ink-500 italic">
        ↳ 对手做不到的事：在「最贵的资源（年假）」上做约束求解。
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border hairline bg-white px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.12em] text-ink-500">
        {label}
      </div>
      <div className="text-[16px] font-semibold text-ink-900 mt-0.5">
        {value}
      </div>
      <div className="text-[10px] text-ink-400 mt-0.5">{hint}</div>
    </div>
  );
}

function Row({
  children,
  ok,
  defer,
}: {
  children: React.ReactNode;
  ok?: boolean;
  defer?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          ok ? "bg-emerald-500" : defer ? "bg-ink-300" : "bg-ink-300"
        }`}
      />
      <span className={defer ? "text-ink-400 line-through" : ""}>
        {children}
      </span>
    </div>
  );
}
