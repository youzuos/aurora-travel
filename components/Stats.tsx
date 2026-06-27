"use client";

import { DESTINATIONS } from "@/data/destinations";
import { BUDGET_CNY, INITIAL_TRIPS, TOTAL_PTO } from "@/data/plan";

function Item({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex-1 px-5 py-4 first:pl-0 last:pr-0">
      <div className="text-[10.5px] uppercase tracking-[0.16em] text-ink-500 font-medium">
        {label}
      </div>
      <div className="text-[20px] leading-tight font-semibold text-ink-900 mt-1.5">
        {value}
      </div>
      {hint && (
        <div className="text-[11px] text-ink-500 mt-1">{hint}</div>
      )}
    </div>
  );
}

export default function Stats() {
  const ptoUsed = INITIAL_TRIPS.reduce((s, t) => s + t.ptoDays, 0);
  const leveraged = INITIAL_TRIPS.reduce(
    (s, t) => s + t.holidayLeveraged,
    0
  );
  const wishlistTotal = 4;
  const wishlistCovered = INITIAL_TRIPS.length;
  // crude estimated cost: pull min of each priceCurve
  const cost = INITIAL_TRIPS.reduce((s, t) => {
    const d = DESTINATIONS.find((d) => d.id === t.destinationId);
    if (!d) return s;
    const min = Math.min(...d.priceCurve.map((p) => p.price));
    return s + min;
  }, 0);

  return (
    <div className="rounded-2xl border hairline bg-white shadow-[0_1px_2px_rgba(20,30,50,0.04)] divide-x divide-ink-100 flex">
      <Item
        label="PTO Usage"
        value={
          <>
            <span className="text-aurora-700">{ptoUsed}</span>
            <span className="text-ink-400 text-base font-normal">
              {" / "}
              {TOTAL_PTO}
            </span>
          </>
        }
        hint={
          <>
            杠杆 +{leveraged} 天法定假期
          </>
        }
      />
      <Item
        label="Estimated Budget"
        value={
          <>
            <span>¥{(cost / 1000).toFixed(1)}k</span>
            <span className="text-ink-400 text-base font-normal">
              {" / "}¥{BUDGET_CNY / 1000}k
            </span>
          </>
        }
        hint={
          <span className="text-emerald-600">
            {cost < BUDGET_CNY ? "在预算内" : "超预算"}
          </span>
        }
      />
      <Item
        label="Wishlist Coverage"
        value={
          <>
            <span>{wishlistCovered}</span>
            <span className="text-ink-400 text-base font-normal">
              {" / "}
              {wishlistTotal}
            </span>
          </>
        }
        hint={<>胡杨被综合 Agent 挪到 2027</>}
      />
      <Item
        label="Peak Probability · avg"
        value={<>0.68</>}
        hint={<>体验时钟收敛中</>}
      />
    </div>
  );
}
