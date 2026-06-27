import type { AgentStep } from "@/lib/types";

/**
 * 预烤的 4-Agent 思考过程。Chat 提交心愿后顺序播放，零 LLM 风险。
 * 顺序：timing → holiday → price → combined（PRD 第 4 节 P0-2）。
 */
export const AGENT_THINKING: AgentStep[] = [
  // ── 🌸 时机 Agent ──────────────────────────────
  {
    agent: "timing",
    text: "解析心愿清单：极光 / 樱花 / 胡杨 / 天池。",
    dwellMs: 700,
  },
  {
    agent: "timing",
    text: "查询体验时钟可靠窗口：花期 T-14、极光 T-3、雪期 T-30。",
    evidence: "远期只能给概率区间，不假装精确日期。",
    dwellMs: 900,
  },
  {
    agent: "timing",
    text: "调取 NOAA SWPC 极光数据 + 气象厅历史花期 → 输出峰值概率区间。",
    evidence: "Iceland Aurora: peak window 2026-02-12 ~ 02-26 (P=0.71)",
    dwellMs: 1000,
  },
  {
    agent: "timing",
    text: "标记成熟度：3 段全部 🔴 数据更新中（远期）。",
    dwellMs: 700,
  },

  // ── 📅 假期 Agent ──────────────────────────────
  {
    agent: "holiday",
    text: "读取 2026 年法定假期与调休：春节 / 清明 / 端午 / 国庆…",
    dwellMs: 700,
  },
  {
    agent: "holiday",
    text: "京都樱花 → 拼清明（4/4-4/6）：3 天 PTO 换 6 天假期。",
    evidence: "杠杆比 1 : 2.0",
    dwellMs: 900,
  },
  {
    agent: "holiday",
    text: "冰岛极光 → 拼春节尾（2/22-2/23）：6 天 PTO 换 8 天假期。",
    evidence: "杠杆比 1 : 1.33（跨洋长线，PTO 占大头）",
    dwellMs: 900,
  },
  {
    agent: "holiday",
    text: "长白山天池 → 拼端午（6/19-6/21）：1 天 PTO 换 4 天假期。",
    evidence: "杠杆比 1 : 4.0（拼假最优）",
    dwellMs: 800,
  },

  // ── 💰 价格 Agent ──────────────────────────────
  {
    agent: "price",
    text: "拉取 3 年历史价格曲线（预置数据：Google Flights / Skyscanner 无可靠免费 API）。",
    dwellMs: 800,
  },
  {
    agent: "price",
    text: "京都樱花：T-60～45 价格谷底 ≈ ¥3,200，接近 3 年最低。",
    evidence: "建议锁价窗口：2026-02-04 ~ 02-19",
    dwellMs: 900,
  },
  {
    agent: "price",
    text: "冰岛极光：长线价格波动大，建议拼春节尾错开 → 节省约 ¥1,400。",
    dwellMs: 800,
  },
  {
    agent: "price",
    text: "全年订票时钟：3 段都在 T-60 之前安全；现在做组合优化。",
    dwellMs: 700,
  },

  // ── 🎯 综合 Agent（真活）───────────────────────
  {
    agent: "combined",
    text: "约束：12 天 PTO + ¥28,000 预算 + 4 个心愿窗口。",
    dwellMs: 800,
  },
  {
    agent: "combined",
    text: "目标函数 = Σ(峰值概率 × 体验权重 × 拼假杠杆) − λ·扑空率 − μ·价格 / 预算",
    evidence: "这是有限年假在多竞争窗口间的最优分配——AI 真 10x 之处。",
    dwellMs: 1100,
  },
  {
    agent: "combined",
    text: "求解：保京都樱花 + 冰岛极光 + 长白山天池（端午），胡杨挪到 2027。",
    evidence:
      "PTO 用 10/12 · 全年峰值概率均值 0.68 · 总价 ¥26,400（预算内）",
    dwellMs: 1200,
  },
  {
    agent: "combined",
    text: "理由：胡杨窗口与冰岛极光高度竞争 PTO，且 2027 春有春节延长——延迟收益 > 当年成本。",
    dwellMs: 1200,
  },
];

/**
 * 时间快进到 +8 月时，价格 Agent 主动推送的提醒。
 */
export const PRICE_ALERT_T60 = {
  agent: "price" as const,
  message:
    "京都樱花机票 ¥3,200，接近 3 年最低；建议 7 天内锁价（T-60 → T-45 窗口）。",
};

/**
 * 时间快进到 T-14 时，时机 Agent 收敛的峰值确认。
 */
export const PEAK_LOCK_T14 = {
  agent: "timing" as const,
  message:
    "京都花期模型收敛：满开窗口锁定 2026-04-02 ~ 04-05，扑空率降至 5%。",
};
