"use client";

import { useEffect, useMemo, useState } from "react";
import { buildMonthCalendar, calendarLabel } from "@/lib/calendar";
import type {
  AgentFinding,
  DateNote,
  GeneratedPlan,
  Lang,
  PlanProfile,
  WishlistItem,
  WishlistPriorityLabel,
} from "@/lib/types";

interface Props {
  open: boolean;
  lang: Lang;
  initialProfile: PlanProfile | null;
  seedWishlistItems: WishlistItem[];
  findings: AgentFinding[];
  onClose: () => void;
  onPlanGenerated: (plan: GeneratedPlan) => void;
}

type Field = keyof Pick<PlanProfile, "ptoDays" | "annualBudget" | "tripCount" | "averageTripBudget">;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DEFAULT_PROFILE: PlanProfile = {
  ptoDays: 12,
  annualBudget: 28000,
  tripCount: 3,
  wishlist: "",
  wishlistItems: [],
  averageTripBudget: 8000,
  unavailableMonths: [],
  unavailableDates: [],
  unavailableDateNotes: [],
};

const PRIORITIES: { label: WishlistPriorityLabel; en: string; score: 1 | 2 | 3 }[] = [
  { label: "必去", en: "Must go", score: 3 },
  { label: "想去", en: "Want to", score: 2 },
  { label: "随缘", en: "Optional", score: 1 },
];

const STEPS: {
  field: Field | "wishlistItems" | "unavailableDates";
  labelZh: string;
  labelEn: string;
  titleZh: string;
  titleEn: string;
  hintZh: string;
  hintEn: string;
  type: "number" | "wishlist" | "dates";
}[] = [
  {
    field: "ptoDays",
    labelZh: "年假",
    labelEn: "PTO",
    titleZh: "今年可以用于旅行的年假有多少天？",
    titleEn: "How many PTO days can you use for travel this year?",
    hintZh: "例如：12",
    hintEn: "Example: 12",
    type: "number",
  },
  {
    field: "annualBudget",
    labelZh: "预算",
    labelEn: "Budget",
    titleZh: "今年旅行总预算是多少？",
    titleEn: "What is your total annual travel budget?",
    hintZh: "人民币，例如：28000",
    hintEn: "CNY, e.g. 28000",
    type: "number",
  },
  {
    field: "tripCount",
    labelZh: "次数",
    labelEn: "Trips",
    titleZh: "今年希望安排几次旅行？",
    titleEn: "How many trips do you want this year?",
    hintZh: "例如：3",
    hintEn: "Example: 3",
    type: "number",
  },
  {
    field: "wishlistItems",
    labelZh: "心愿",
    labelEn: "Wishes",
    titleZh: "把心愿写下来，并给每个心愿评级",
    titleEn: "Add your wishes and rate each one",
    hintZh: "资源不足时，随缘和低优先级心愿会先延期。",
    hintEn: "When resources are tight, optional and lower-priority wishes defer first.",
    type: "wishlist",
  },
  {
    field: "averageTripBudget",
    labelZh: "单次预算",
    labelEn: "Per trip",
    titleZh: "单次旅行平均预算上限是多少？",
    titleEn: "What is the average budget cap per trip?",
    hintZh: "人民币，例如：8000",
    hintEn: "CNY, e.g. 8000",
    type: "number",
  },
  {
    field: "unavailableDates",
    labelZh: "不可出行",
    labelEn: "Blocked",
    titleZh: "2026 年哪些日子不能旅行？",
    titleEn: "Which 2026 dates are unavailable for travel?",
    hintZh: "点选具体日期。已保存的纪念日、生日、工作集中期会自动带回；节假日仅供参考。",
    hintEn: "Select exact dates. Saved anniversaries, birthdays, and busy periods stay editable; holidays are shown for reference.",
    type: "dates",
  },
];

function copy(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

function scoreFor(label: WishlistPriorityLabel): 1 | 2 | 3 {
  if (label === "必去") return 3;
  if (label === "想去") return 2;
  return 1;
}

function makeWishlistItem(label: string, priorityLabel: WishlistPriorityLabel = "想去", source: WishlistItem["source"] = "user"): WishlistItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: label.trim(),
    priorityLabel,
    priorityScore: scoreFor(priorityLabel),
    source,
  };
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function legacyItems(profile: PlanProfile | null): WishlistItem[] {
  if (!profile) return [];
  if (profile.wishlistItems?.length) return profile.wishlistItems;
  return profile.wishlist
    .split(/[,\n，、；;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((label, index) => ({
      id: `legacy-${index}`,
      label,
      priorityLabel: "想去" as const,
      priorityScore: 2 as const,
      source: "legacy" as const,
    }));
}

export default function ChatOverlay({
  open,
  lang,
  initialProfile,
  seedWishlistItems,
  findings,
  onClose,
  onPlanGenerated,
}: Props) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<PlanProfile>(DEFAULT_PROFILE);
  const [draft, setDraft] = useState("");
  const [wishlistDraft, setWishlistDraft] = useState("");
  const [wishlistPriority, setWishlistPriority] = useState<WishlistPriorityLabel>("想去");
  const [dateNoteDraft, setDateNoteDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const current = STEPS[step];

  useEffect(() => {
    if (!open) return;
    const seeded = seedWishlistItems.length ? seedWishlistItems : legacyItems(initialProfile);
    setProfile({
      ...DEFAULT_PROFILE,
      ...(initialProfile ?? {}),
      wishlistItems: seeded,
      wishlist: seeded.map((item) => item.label).join("、") || initialProfile?.wishlist || "",
      unavailableDates: initialProfile?.unavailableDates ?? [],
      unavailableDateNotes: initialProfile?.unavailableDateNotes ?? [],
    });
    setStep(seedWishlistItems.length ? 0 : 0);
    setDraft("");
    setWishlistDraft("");
    setWishlistPriority("想去");
    setDateNoteDraft("");
    setError("");
    setLoading(false);
  }, [open, initialProfile, seedWishlistItems]);

  useEffect(() => {
    if (!open) return;
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  useEffect(() => {
    if (!current || current.type !== "number") {
      setDraft("");
      return;
    }
    setDraft(String(profile[current.field as Field] || ""));
  }, [current?.field, current?.type, profile]);

  const summary = useMemo(
    () => [
      [copy(lang, "年假", "PTO"), `${profile.ptoDays || "--"}d`],
      [copy(lang, "年度预算", "Annual budget"), `¥${Number(profile.annualBudget || 0).toLocaleString()}`],
      [copy(lang, "旅行次数", "Trips"), String(profile.tripCount || "--")],
      [copy(lang, "不可出行", "Blocked"), `${profile.unavailableDates?.length ?? 0}d`],
    ],
    [lang, profile]
  );

  if (!open) return null;

  function setWishlistItems(items: WishlistItem[]) {
    setProfile((prev) => ({
      ...prev,
      wishlistItems: items,
      wishlist: items.map((item) => item.label).join("、"),
    }));
  }

  function addWishlistItem() {
    const label = wishlistDraft.trim();
    if (!label) return;
    setWishlistItems([...(profile.wishlistItems ?? []), makeWishlistItem(label, wishlistPriority)]);
    setWishlistDraft("");
    setWishlistPriority("想去");
  }

  function updatePriority(id: string, priorityLabel: WishlistPriorityLabel) {
    setWishlistItems(
      (profile.wishlistItems ?? []).map((item) =>
        item.id === id ? { ...item, priorityLabel, priorityScore: scoreFor(priorityLabel) } : item
      )
    );
  }

  function removeWishlistItem(id: string) {
    setWishlistItems((profile.wishlistItems ?? []).filter((item) => item.id !== id));
  }

  function toggleDate(date: string) {
    setProfile((prev) => {
      const dates = new Set(prev.unavailableDates ?? []);
      const notes = prev.unavailableDateNotes ?? [];
      if (dates.has(date)) {
        dates.delete(date);
        return {
          ...prev,
          unavailableDates: [...dates].sort(),
          unavailableDateNotes: notes.filter((note) => note.date !== date),
        };
      }
      dates.add(date);
      const label = dateNoteDraft.trim() || copy(lang, "不可出行", "Unavailable");
      return {
        ...prev,
        unavailableDates: [...dates].sort(),
        unavailableDateNotes: [...notes, { id: `${date}-${Date.now()}`, date, label, source: "user" as const }].sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
      };
    });
  }

  function saveCurrent() {
    if (!current) return true;
    if (current.type === "wishlist") {
      if (wishlistDraft.trim()) addWishlistItem();
      if (!(profile.wishlistItems ?? []).length && !wishlistDraft.trim()) {
        setError(copy(lang, "请至少添加一个心愿。", "Please add at least one wish."));
        return false;
      }
      setError("");
      return true;
    }
    if (current.type === "dates") {
      setError("");
      return true;
    }

    const raw = draft.trim();
    if (!raw) {
      setError(copy(lang, "这个问题需要填写后才能继续。", "Please answer this before continuing."));
      return false;
    }
    const num = Number(raw.replace(/[,\s]/g, ""));
    if (!Number.isFinite(num) || num <= 0) {
      setError(copy(lang, "请输入有效的正数。", "Please enter a valid positive number."));
      return false;
    }
    setProfile((prev) => ({ ...prev, [current.field]: Math.round(num) }));
    setError("");
    return true;
  }

  async function generate() {
    const finalProfile = {
      ...profile,
      wishlist: (profile.wishlistItems ?? []).map((item) => item.label).join("、"),
      unavailableDates: profile.unavailableDates ?? [],
      unavailableDateNotes: profile.unavailableDateNotes ?? [],
    };
    setLoading(true);
    setError("");
    try {
      const responsePromise = fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: finalProfile }),
      });
      const [response] = await Promise.all([responsePromise, wait(3200)]);
      if (!response.ok) throw new Error("plan failed");
      const plan = (await response.json()) as GeneratedPlan;
      onPlanGenerated(plan);
      onClose();
    } catch {
      setError(copy(lang, "生成失败，请稍后再试。", "Generation failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  function goToStep(index: number) {
    if (index === step) return;
    saveCurrent();
    setStep(index);
  }

  function next() {
    if (!saveCurrent()) return;
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    generate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-5xl rounded-2xl bg-white border hairline shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b hairline flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-md bg-ink-900 text-white text-xs grid place-items-center">✦</span>
            <div>
              <div className="text-[13px] font-semibold tracking-tight">
                {copy(lang, "编辑年度旅行计划", "Edit annual travel plan")}
              </div>
              <div className="text-[10.5px] text-ink-500">
                {copy(lang, "先固定边界条件，再交给 Agent 生成年度规划", "Lock constraints first, then let agents generate the year plan")}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="border-b hairline bg-ink-50/60 px-4 py-3">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {STEPS.map((item, index) => (
              <button
                key={item.field}
                onClick={() => goToStep(index)}
                className={`rounded-lg border px-2 py-2 text-left transition ${
                  index === step ? "border-aurora-700 bg-white text-aurora-800 shadow-sm" : "hairline bg-white/60 text-ink-500 hover:bg-white"
                }`}
              >
                <div className="text-[10px] font-semibold">{index + 1}</div>
                <div className="mt-0.5 truncate text-[11px] font-medium">
                  {copy(lang, item.labelZh, item.labelEn)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && <AgentGenerationPanel lang={lang} />}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-aurora-700 font-semibold">
                {copy(lang, `问题 ${step + 1} / ${STEPS.length}`, `Question ${step + 1} / ${STEPS.length}`)}
              </div>
              <h3 className="mt-2 text-[22px] font-semibold tracking-tight text-ink-900">
                {copy(lang, current.titleZh, current.titleEn)}
              </h3>
              <p className="mt-2 text-[12.5px] text-ink-500">{copy(lang, current.hintZh, current.hintEn)}</p>

              {current.type === "number" && (
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  inputMode="numeric"
                  className="mt-5 w-full rounded-xl border hairline bg-ink-50 px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-aurora-200"
                  placeholder={copy(lang, current.hintZh, current.hintEn)}
                />
              )}

              {current.type === "wishlist" && (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                    <input
                      value={wishlistDraft}
                      onChange={(e) => setWishlistDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addWishlistItem();
                        }
                      }}
                      className="rounded-xl border hairline bg-ink-50 px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-aurora-200"
                      placeholder={copy(lang, "例如：京都樱花", "Example: Kyoto blossoms")}
                    />
                    <button onClick={addWishlistItem} className="rounded-xl bg-ink-900 px-4 py-3 text-[12px] font-medium text-white hover:bg-aurora-700">
                      {copy(lang, "添加", "Add")}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITIES.map((priority) => (
                      <button
                        key={priority.label}
                        onClick={() => setWishlistPriority(priority.label)}
                        className={`rounded-full border px-3 py-1.5 text-[12px] font-medium ${
                          wishlistPriority === priority.label ? "border-aurora-700 bg-aurora-700 text-white" : "hairline bg-white text-ink-700"
                        }`}
                      >
                        {copy(lang, priority.label, priority.en)}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {(profile.wishlistItems ?? []).map((item) => (
                      <div key={item.id} className="rounded-xl border hairline bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-ink-900 text-[13px]">{item.label}</div>
                          <button onClick={() => removeWishlistItem(item.id)} className="text-[12px] text-ink-400 hover:text-rose-500">
                            {copy(lang, "删除", "Remove")}
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {PRIORITIES.map((priority) => (
                            <button
                              key={priority.label}
                              onClick={() => updatePriority(item.id, priority.label)}
                              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                                item.priorityLabel === priority.label ? "border-aurora-700 bg-aurora-50 text-aurora-800" : "hairline bg-ink-50 text-ink-600"
                              }`}
                            >
                              {copy(lang, priority.label, priority.en)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {current.type === "dates" && (
                <div className="mt-5 space-y-4">
                  <input
                    value={dateNoteDraft}
                    onChange={(e) => setDateNoteDraft(e.target.value)}
                    className="w-full rounded-xl border hairline bg-ink-50 px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-aurora-200"
                    placeholder={copy(lang, "给接下来选择的日期备注：父母生日 / 工作高峰 / 纪念日", "Note for selected dates: birthday / work peak / anniversary")}
                  />
                  <div className="rounded-xl border hairline p-3">
                    <div className="mb-3 flex flex-wrap gap-3 text-[11px] text-ink-500">
                      <span><b className="text-rose-500">■</b> {copy(lang, "不可出行", "Blocked")}</span>
                      <span><b className="text-emerald-500">■</b> {copy(lang, "公共节假日", "Holiday")}</span>
                      <span><b className="text-ink-400">■</b> {copy(lang, "调休工作日", "Adjusted workday")}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {MONTHS.map((monthLabel, monthIndex) => (
                        <MonthPicker
                          key={monthLabel}
                          lang={lang}
                          month={monthIndex + 1}
                          selected={profile.unavailableDates ?? []}
                          onToggle={toggleDate}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="mt-3 text-[12px] text-rose-600">{error}</div>}

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0 || loading}
                  className="px-4 py-2 rounded-lg border hairline text-[12px] text-ink-700 disabled:opacity-30 hover:bg-ink-50"
                >
                  {copy(lang, "上一步", "Back")}
                </button>
                <button onClick={next} disabled={loading} className="px-5 py-2 rounded-lg bg-ink-900 text-white text-[12px] font-medium disabled:opacity-50 hover:bg-aurora-700 transition">
                  {loading
                    ? copy(lang, "Agent 生成中...", "Agents planning...")
                    : step === STEPS.length - 1
                    ? copy(lang, "生成年度规划", "Generate plan")
                    : copy(lang, "下一步", "Next")}
                </button>
              </div>
            </div>

            <aside className="rounded-xl border hairline bg-ink-50/60 p-4 h-fit">
              <div className="text-[11px] uppercase tracking-[0.16em] text-ink-500 font-medium">
                {copy(lang, "当前边界", "Current constraints")}
              </div>
              <div className="mt-3 space-y-2">
                {summary.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-[12px]">
                    <span className="text-ink-500">{label}</span>
                    <span className="font-semibold text-ink-900">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t hairline pt-3">
                <div className="text-[11px] text-ink-500 mb-1">{copy(lang, "已保存不可出行日期", "Saved blocked dates")}</div>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {(profile.unavailableDateNotes ?? []).length ? (
                    profile.unavailableDateNotes?.map((note) => (
                      <div key={note.id} className="text-[12px] text-ink-800">
                        {note.date} · {note.label}
                      </div>
                    ))
                  ) : (
                    <div className="text-[12px] text-ink-400">{copy(lang, "暂无保存记录", "No saved dates")}</div>
                  )}
                </div>
              </div>
              {findings.length > 0 && (
                <div className="mt-4 border-t hairline pt-3 space-y-2">
                  <div className="text-[11px] text-ink-500">{copy(lang, "上次 Agent 结论", "Previous agent findings")}</div>
                  {findings.map((finding, index) => (
                    <div key={index} className="text-[11.5px] leading-relaxed text-ink-700">
                      <span className="font-semibold text-aurora-700">{finding.agent}</span>: {copy(lang, finding.text, finding.textEn)}
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentGenerationPanel({ lang }: { lang: Lang }) {
  const rows = [
    {
      icon: "🌸",
      titleZh: "时机 Agent",
      titleEn: "Timing Agent",
      linesZh: ["识别心愿体验的最佳季节", "比对历史峰值窗口", "估算扑空风险"],
      linesEn: ["Identify best seasons", "Compare historical peak windows", "Estimate miss risk"],
    },
    {
      icon: "📅",
      titleZh: "假期 Agent",
      titleEn: "Calendar Agent",
      linesZh: ["加载 2026 公共假期", "避开不可出行日期", "计算拼假方案"],
      linesEn: ["Load 2026 public holidays", "Avoid blocked dates", "Calculate PTO bridges"],
    },
    {
      icon: "🎯",
      titleZh: "综合 Agent",
      titleEn: "Synthesis Agent",
      linesZh: ["按优先级排序心愿", "检查年假和预算", "决定哪些心愿延期"],
      linesEn: ["Rank wishes by priority", "Check PTO and budget", "Decide what should defer"],
    },
  ];

  return (
    <div className="mb-5 rounded-2xl border hairline bg-ink-900 p-5 text-white">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
        {lang === "zh" ? "Aurora 正在为你规划 2026" : "Aurora is planning your 2026"}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {rows.map((row, index) => (
          <div key={row.titleEn} className="rounded-xl bg-white/8 p-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{row.icon}</span>
              <span className="text-[13px] font-semibold">{copy(lang, row.titleZh, row.titleEn)}</span>
            </div>
            <div className="mt-3 space-y-2">
              {(lang === "zh" ? row.linesZh : row.linesEn).map((line, lineIndex) => (
                <div key={line} className="flex gap-2 text-[12px] text-white/78">
                  <span className={lineIndex < index + 1 ? "text-emerald-300" : "text-white/35"}>
                    {lineIndex < index + 1 ? "✓" : "⋯"}
                  </span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthPicker({
  lang,
  month,
  selected,
  onToggle,
}: {
  lang: Lang;
  month: number;
  selected: string[];
  onToggle: (date: string) => void;
}) {
  const days = buildMonthCalendar(2026, month, selected);
  const selectedSet = new Set(selected);
  return (
    <div className="rounded-lg border hairline bg-white p-2">
      <div className="mb-2 text-[12px] font-semibold text-ink-900">
        {lang === "zh" ? `${month} 月` : MONTHS[month - 1]}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-ink-400">
        {(lang === "zh" ? ["日", "一", "二", "三", "四", "五", "六"] : ["S", "M", "T", "W", "T", "F", "S"]).map((d, i) => (
          <div key={`${d}-${i}`}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const selectedDay = selectedSet.has(day.date);
          const isHoliday = day.holiday?.type === "holiday";
          const isWorkday = day.holiday?.type === "workday";
          return (
            <button
              key={day.date}
              onClick={() => day.inMonth && onToggle(day.date)}
              disabled={!day.inMonth}
              title={calendarLabel(lang, day.date) || day.date}
              className={`h-7 rounded-md text-[10.5px] transition disabled:opacity-20 ${
                selectedDay
                  ? "bg-rose-500 text-white"
                  : isHoliday
                  ? "bg-emerald-50 text-emerald-700"
                  : isWorkday
                  ? "bg-ink-100 text-ink-500"
                  : day.isWeekend
                  ? "bg-ink-50 text-ink-600"
                  : "bg-white text-ink-700 hover:bg-aurora-50"
              }`}
            >
              {day.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
