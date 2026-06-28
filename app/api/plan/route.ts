import { NextResponse } from "next/server";
import { generateLocalPlan } from "@/lib/planner";
import type { PlanProfile, WishlistItem, WishlistPriorityLabel } from "@/lib/types";

export const runtime = "nodejs";

function normalizeProfile(input: Partial<PlanProfile>): PlanProfile {
  const wishlistItems = Array.isArray(input.wishlistItems)
    ? input.wishlistItems
        .map((item: Partial<WishlistItem>, index): WishlistItem | null => {
          const label = String(item.label || "").trim();
          if (!label) return null;
          const priorityLabel = (["必去", "想去", "随缘"].includes(
            String(item.priorityLabel)
          )
            ? item.priorityLabel
            : "想去") as WishlistPriorityLabel;
          const score = priorityLabel === "必去" ? 3 : priorityLabel === "想去" ? 2 : 1;
          return {
            id: String(item.id || `wishlist-${index}`),
            label,
            priorityLabel,
            priorityScore: score,
            source:
              item.source === "inspiration" || item.source === "legacy"
                ? item.source
                : "user",
          };
        })
        .filter((item): item is WishlistItem => item !== null)
    : undefined;

  return {
    ptoDays: Number(input.ptoDays) || 12,
    annualBudget: Number(input.annualBudget) || 28000,
    tripCount: Number(input.tripCount) || 3,
    wishlist: String(input.wishlist || ""),
    wishlistItems,
    averageTripBudget: Number(input.averageTripBudget) || 8000,
    unavailableMonths: Array.isArray(input.unavailableMonths)
      ? input.unavailableMonths.map(Number).filter((m) => m >= 1 && m <= 12)
      : [],
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const profile = normalizeProfile(body.profile ?? body);
  const fallback = generateLocalPlan(profile);

  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
    return NextResponse.json(fallback);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL,
        input: [
          {
            role: "system",
            content:
              "You are Aurora's travel-planning orchestrator. Return concise JSON only. Evaluate seasonality, weather risk, holiday leverage, budget, and whether to defer trips.",
          },
          {
            role: "user",
            content: JSON.stringify({
              profile,
              localCandidatePlan: fallback,
              instruction:
                "Improve the findings text if useful, but keep the exact JSON schema and destination ids from localCandidatePlan.",
            }),
          },
        ],
        text: { format: { type: "json_object" } },
      }),
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(fallback);
    }

    const data = await response.json();
    const text =
      data.output_text ??
      data.output?.flatMap((item: any) => item.content ?? [])
        ?.find((content: any) => content.type === "output_text")?.text;
    const parsed = text ? JSON.parse(text) : fallback;
    return NextResponse.json({ ...fallback, ...parsed, generatedBy: "llm" });
  } catch {
    return NextResponse.json(fallback);
  }
}
