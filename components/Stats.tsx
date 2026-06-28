"use client";

import type { DeferredTrip, Lang, PlanProfile, Trip } from "@/lib/types";

interface Props {
  lang: Lang;
  profile: PlanProfile | null;
  trips: Trip[];
  deferredTrips: DeferredTrip[];
}

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
    <div className="min-w-[180px] flex-1 px-5 py-4 first:pl-0 last:pr-0">
      <div className="text-[10.5px] uppercase tracking-[0.16em] text-ink-500 font-medium">
        {label}
      </div>
      <div className="text-[20px] leading-tight font-semibold text-ink-900 mt-1.5">
        {value}
      </div>
      {hint && <div className="text-[11px] text-ink-500 mt-1">{hint}</div>}
    </div>
  );
}

export default function Stats({ lang, profile, trips, deferredTrips }: Props) {
  const ptoUsed = trips.reduce((sum, trip) => sum + trip.ptoDays, 0);
  const leveraged = trips.reduce((sum, trip) => sum + trip.holidayLeveraged, 0);
  const cost = trips.reduce((sum, trip) => sum + trip.estimatedBudget, 0);
  const wishlistTotal = trips.length + deferredTrips.length;

  return (
    <section className="rounded-2xl border hairline bg-white shadow-[0_1px_2px_rgba(20,30,50,0.04)] overflow-x-auto">
      <div className="min-w-[760px] divide-x divide-ink-100 flex px-5">
        <Item
          label={lang === "zh" ? "年假使用" : "PTO usage"}
          value={
            profile ? (
              <>
                <span className="text-aurora-700">{ptoUsed}</span>
                <span className="text-ink-400 text-base font-normal"> / {profile.ptoDays}</span>
              </>
            ) : (
              <span className="text-ink-300">--</span>
            )
          }
          hint={
            profile
              ? lang === "zh"
                ? `杠杆 ${leveraged} 天公共假期`
                : `${leveraged} public-holiday days leveraged`
              : lang === "zh"
              ? "填写边界条件后计算"
              : "Calculated after setup"
          }
        />
        <Item
          label={lang === "zh" ? "年度预算" : "Annual budget"}
          value={
            profile ? (
              <>
                <span>¥{(cost / 1000).toFixed(1)}k</span>
                <span className="text-ink-400 text-base font-normal"> / ¥{(profile.annualBudget / 1000).toFixed(1)}k</span>
              </>
            ) : (
              <span className="text-ink-300">--</span>
            )
          }
          hint={
            profile ? (
              <span className={cost <= profile.annualBudget ? "text-emerald-600" : "text-rose-500"}>
                {cost <= profile.annualBudget
                  ? lang === "zh"
                    ? "在预算内"
                    : "Within budget"
                  : lang === "zh"
                  ? "超预算"
                  : "Over budget"}
              </span>
            ) : lang === "zh" ? (
              "等待预算输入"
            ) : (
              "Waiting for budget"
            )
          }
        />
        <Item
          label={lang === "zh" ? "心愿覆盖" : "Wish coverage"}
          value={
            profile ? (
              <>
                <span>{trips.length}</span>
                <span className="text-ink-400 text-base font-normal"> / {wishlistTotal}</span>
              </>
            ) : (
              <span className="text-ink-300">--</span>
            )
          }
          hint={
            profile
              ? deferredTrips.length
                ? lang === "zh"
                  ? `${deferredTrips.length} 个心愿推迟`
                  : `${deferredTrips.length} deferred`
                : lang === "zh"
                ? "全部纳入今年"
                : "All fit this year"
              : lang === "zh"
              ? "等待心愿目的地"
              : "Waiting for wishes"
          }
        />
        <Item
          label={lang === "zh" ? "计划旅行次数" : "Trip count"}
          value={profile ? `${trips.length} / ${profile.tripCount}` : <span className="text-ink-300">--</span>}
          hint={
            profile
              ? lang === "zh"
                ? `单次预算 ¥${profile.averageTripBudget.toLocaleString()}`
                : `Per-trip cap ¥${profile.averageTripBudget.toLocaleString()}`
              : lang === "zh"
              ? "等待次数输入"
              : "Waiting for count"
          }
        />
      </div>
    </section>
  );
}
