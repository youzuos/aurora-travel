"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import TimeWarp from "@/components/TimeWarp";
import Stats from "@/components/Stats";
import YearView from "@/components/YearView";
import TripView from "@/components/TripView";
import ChatOverlay from "@/components/ChatOverlay";
import PriceAlert from "@/components/PriceAlert";
import { INITIAL_TRIPS } from "@/data/plan";
import type { WarpStop } from "@/lib/time";

export default function Home() {
  const [warp, setWarp] = useState<WarpStop>("year-start");
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [firstVisit, setFirstVisit] = useState(true);

  // First-visit auto-opens Chat (PRD §7: 首次使用 → Chat View)
  useEffect(() => {
    const t = setTimeout(() => {
      if (firstVisit) {
        setChatOpen(true);
        setFirstVisit(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [firstVisit]);

  // Cmd+K opens chat anywhere
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setChatOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-ink-50/40 to-white">
      <TopBar
        warp={warp}
        trips={INITIAL_TRIPS}
        onOpenChat={() => setChatOpen(true)}
      />

      <div className="mx-auto max-w-[1240px] px-8 py-8 space-y-6">
        {/* Hero */}
        <section className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-ink-500 font-medium">
              Plan once · Refine all year
            </div>
            <h1 className="text-[32px] font-semibold tracking-tight text-ink-900 mt-2 leading-tight">
              你的 2026 旅行，会随时间
              <span className="text-aurora-700"> 收敛置信度</span>。
            </h1>
            <p className="text-[13px] text-ink-600 mt-2 max-w-xl leading-relaxed">
              远期给概率区间，临近才给确定日。订票时钟提前 12 个月可靠，体验时钟 T-14 / T-3 才准 — Aurora 把两者分开诚实告诉你。
            </p>
          </div>
        </section>

        <TimeWarp warp={warp} onChange={setWarp} />
        <PriceAlert warp={warp} />
        <Stats />

        {/* main view region: Year by default, Trip when selected */}
        {selectedTrip ? (
          <TripView
            destinationId={selectedTrip}
            warp={warp}
            onBack={() => setSelectedTrip(null)}
            onOpenChat={() => setChatOpen(true)}
          />
        ) : (
          <YearView warp={warp} onSelectTrip={setSelectedTrip} />
        )}

        <footer className="pt-8 pb-2 text-center text-[11px] text-ink-400 tracking-wide">
          Aurora · Travel by timing, not by luck. ·{" "}
          <kbd className="px-1.5 py-0.5 rounded border hairline text-[10px]">
            Cmd/Ctrl + K
          </kbd>{" "}
          to chat
        </footer>
      </div>

      <ChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} />
    </main>
  );
}
