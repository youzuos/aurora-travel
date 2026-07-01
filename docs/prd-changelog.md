# Aurora PRD Changelog

This file records product design and architecture changes that affect the PRD. Keep entries concise and reversible through Git.

## 2026-07-01 - v3 demo flow planning surfaces

Context:
- The v3 user flow now emphasizes a complete demo path: annual plan hero, optional Time Warp demo, Agent generation visualization, and trip-level day planning.
- Companion-owned exploration and floating companion code remain outside this change.

Product changes:
- Added a seeded Xiaoming demo plan for the planning surfaces, including Kyoto + Osaka, Iceland, deferred Xinjiang, daily itinerary, trip wishlist, blocked dates, and reminders.
- Reworked Year View into the annual plan homepage: summary row, Gantt-first layout, blocked-date markers, deferred trip display, and a compact Time Warp entry.
- Moved Time Warp out of the default homepage flow and into a modal demo surface.
- Added Agent generation visualization inside the planner while a plan is being generated.
- Extended Trip View with day-by-day itinerary, trip wishlist, and reminder detail while keeping leave strategy as the execution section.

Rollback notes:
- Revert this changelog entry plus the matching updates to `data/demoScenarios.ts`, `lib/types.ts`, `app/page.tsx`, `components/YearView.tsx`, `components/ChatOverlay.tsx`, and `components/TripView.tsx`.

## 2026-06-30 - Trip View decision-first refinement

Context:
- The Trip View refinement page exposed several equal-weight charts and metrics before explaining what the user should decide.
- The v3.0 flow defines trip refinement as a decision surface: whether the trip is reliable, when to go, and how to request leave.

Product changes:
- Reframed Trip View from a data dashboard into a decision explanation page.
- Added a full-width Aurora judgment hero that summarizes the recommended window in plain language.
- Replaced the abstract peak curve with a 7-9 day window bar chart and a clearly labeled peak day.
- Added a miss-risk card with plain-language risk levels and thresholds.
- Moved price, leave feasibility, and maturity information into secondary rows; the historical price curve is now optional detail.
- Kept the leave strategy calendar module as the main execution planning section below the decision summary.

Rollback notes:
- Revert this changelog entry and the matching `components/TripView.tsx` update to return to the prior metric-dashboard Trip View.

## 2026-06-30 - v3.0 PRD and flow documentation

Context:
- The team added `Aurora-PRD-v3.0.docx` as the latest product direction.
- The v3.0 PRD introduced a 4-stage product flow: inspiration discovery, initial planning, trip refinement, and near-departure reminders.
- The user clarified the first-use decision point, 5 exploration attempts, random destination fallback, and day-level trip guidance behavior.

Product changes:
- Added root-level `Aurora-PRD-v3.0.docx` as the source PRD file for v3.0.
- Added `docs/v3-user-flow.md` as the editable text source for the current v3.0 user path.
- Added `docs/v3-frontend-page-logic.md` as the editable text draft for page-level frontend presentation logic.
- No application code changes are included in this documentation update.

Rollback notes:
- Revert this changelog entry and remove `Aurora-PRD-v3.0.docx`, `docs/v3-user-flow.md`, and `docs/v3-frontend-page-logic.md` to return to the previous documentation state.

## 2026-06-29 - v2.2 Homepage information hierarchy update

Context:
- The no-plan homepage showed plan-detail modules such as Time Warp and stats with empty placeholder values, which distracted from first-use onboarding.
- The annual Gantt-style Year View should be the first detail surface once a plan exists.

Product changes:
- Hide Time Warp, maturity summary, agent alerts, and stats when the user has not generated or saved a plan.
- Show only the onboarding/empty-state planning surface before first plan creation.
- After a plan exists, place the Year View/Gantt surface above supporting detail modules so the annual plan is immediately visible.

Rollback notes:
- Revert this changelog entry and the matching `docs/PRD.md` v2.2 updates to return to v2.1 homepage hierarchy.

## 2026-06-29 - v2.1 MVP planning framework update

Context:
- The MVP evolved from a static annual planning demo into a more complete planning flow with structured constraints, wishlist priority, exact unavailable dates, and trip-level leave strategy.

Product changes:
- Added first-use empty state as the default for users without saved plans.
- Added seeded inspiration cards as onboarding shortcuts.
- Changed wishlist collection from free text only to structured items with priority labels: 必去, 想去, 随缘.
- Confirmed priority rule: lower-priority wishlist items are deferred first when PTO, budget, or trip count is insufficient.
- Added clickable planner step navigation.
- Replaced broad unavailable-month input with exact unavailable-date selection using a full 2026 calendar.
- Added saved unavailable-date notes for recurring/personal constraints such as anniversaries, birthdays, and work peak periods.
- Added seeded public holidays and adjusted workdays for calendar reference.
- Added Trip View leave strategy options with calendar visualization.
- Preserved the API-ready Agent architecture with deterministic local fallback.

Architecture changes:
- Extended `PlanProfile` with `wishlistItems`, `unavailableDates`, and `unavailableDateNotes`.
- Added local calendar/holiday utilities.
- Added local deterministic planner utilities.
- Kept `/api/plan` as the integration boundary for future LLM and external data providers.

Rollback notes:
- Revert this changelog entry and the matching `docs/PRD.md` update to return to the v2.0 product description.
- If code rollback is needed, revert the commit that introduced structured wishlist, exact unavailable dates, and leave strategy modules.
