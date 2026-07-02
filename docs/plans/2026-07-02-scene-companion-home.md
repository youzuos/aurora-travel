# Scene Companion Home Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the Aurora home screen into a full-screen companion scene with a top status frame and two bottom-right action buttons for annual planning and chat.

**Architecture:** Keep `app/page.tsx` as the state owner and reuse existing planning/chat components. The home state becomes a scene stage; annual planning content opens in an overlay while `ChatOverlay` remains the chat/planning flow. Avoid planner algorithm changes.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS.

---

### Task 1: Add Scene Home State And Plan Overlay

**Files:**
- Modify: `app/page.tsx`

**Step 1: Add UI state**

Add a `planPanelOpen` boolean state beside the existing planner/chat state.

**Step 2: Replace the main vertical dashboard shell**

Replace the current top-to-bottom dashboard body with a viewport-sized scene layout:

- background layer
- top status frame
- central companion stage
- bottom-right action buttons
- conditional annual plan overlay

**Step 3: Wire buttons**

- "年度计划" sets `planPanelOpen` to true.
- "聊天" calls `openPlanner()`.

**Step 4: Preserve existing planning behavior**

Render existing `TimeWarp`, `MaturitySummary`, `PriceAlert`, `Stats`, `YearView`, and `TripView` inside the annual plan overlay so no planning logic changes.

### Task 2: Add Companion Scene Markup

**Files:**
- Modify: `app/page.tsx`

**Step 1: Add the scene background**

Use layered Tailwind gradients and soft scenic shapes to create a calm travel scene without adding external dependencies.

**Step 2: Add the companion figure**

Create a simple CSS/HTML companion placeholder centered in the scene. Use stable dimensions and responsive sizing.

**Step 3: Add the top status frame**

Show location/status/annual summary using existing app state:

- Current status label
- Trip count or no-plan prompt
- Budget/PTO summary when available

### Task 3: Responsive Behavior

**Files:**
- Modify: `app/page.tsx`
- Modify if needed: `app/globals.css`

**Step 1: Desktop layout**

Keep status top-left/top-center, companion center-lower, buttons bottom-right.

**Step 2: Mobile layout**

Scale the companion down, reduce top status text density, and keep the two action buttons tappable without covering the companion.

### Task 4: Verification

**Files:**
- No source edits unless fixes are needed.

**Step 1: Build**

Run: `npm run build`

Expected: build exits with code 0.

**Step 2: Manual browser check**

Run the app and inspect desktop and mobile widths.

Expected:

- Full-screen scene renders.
- Top status frame is visible.
- Companion is visible and not covered.
- Bottom-right buttons are visible.
- "年度计划" opens the plan overlay.
- "聊天" opens `ChatOverlay`.

**Step 3: Fix any layout regressions**

Make only targeted fixes, then repeat build/manual checks.
