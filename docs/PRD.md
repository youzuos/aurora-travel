# Aurora Product Requirements Document

Version: v2.1
Last updated: 2026-06-29
Source of truth: this Markdown PRD. The existing `Aurora-PRD-v2.0.docx` is retained as a presentation/reference artifact.

## 1. Product Thesis

Aurora helps working professionals plan trips by timing, not luck.

The core promise remains: one annual travel plan that matures over time. Far from departure, Aurora gives probability ranges and resource-aware sketches. As each trip approaches, timing, weather, pricing, and leave strategy become more precise.

Slogan: Travel by timing, not by luck.

Sub-slogan: Plan once. Refine all year.

## 2. Target User

Primary user:
- 25-35 year-old working professionals.
- Usually has 10-15 PTO days per year.
- Has a wish list of landscapes or time-sensitive experiences: aurora, cherry blossoms, poplar forests, snow mountains, whales, etc.
- Wants to avoid wasting scarce PTO on the wrong season, wrong week, bad weather, or unaffordable travel windows.

Non-primary users:
- Digital nomads with flexible travel time.
- Retired users.
- Family vacation planners.
- Impulsive "leave tomorrow" travelers.

## 3. Core Problem

Users do not simply need destination recommendations. They need to answer:

1. What is worth using PTO for this year?
2. When is each wish likely to be good?
3. Which wishes fit my annual PTO, budget, trip count, and unavailable dates?
4. What should be deferred to next year?
5. When a trip becomes near-term, how should I request leave around public holidays?

The product must be honest about uncertainty. Some signals are reliable early, such as public holidays, broad seasonality, and budget constraints. Other signals only become useful later, such as blossom peak dates, aurora probability, local weather, and price troughs.

## 4. Product Model

Aurora is organized around three views.

### 4.1 Year View

The default annual planning surface.

Purpose:
- Show the user's whole year at a glance.
- Show planned trips, deferred wishes, PTO usage, budget usage, wish coverage, and trip count.
- Represent each trip's maturity state consistently.

Current maturity model:
- Sketch: broad range, far from departure.
- Refining: narrowing window.
- Ready: precise actionable window.
- Deferred: moved to next year because of priority or resource constraints.

### 4.2 Trip View

The refinement surface for one trip.

Purpose:
- Explain why a trip is placed in this time slot.
- Show experience timing, price timing, miss risk, and holiday leverage.
- Provide concrete leave strategy options.

Current leave strategy module:
- Peak-first option.
- Leave-earlier option.
- Holiday-bridge option.

Each option shows:
- Departure and return range.
- Total trip days.
- PTO days required.
- Public holiday/weekend days leveraged.
- Conflicts with user-blocked dates.
- Calendar preview with trip days, PTO days, public holidays, and blocked conflicts.

### 4.3 Chat / Planner View

The input and modification surface.

Purpose:
- First-use onboarding.
- Continued edits to constraints or wishes.
- Regeneration of the annual plan.

The planner currently asks fixed boundary-condition questions:
1. Annual PTO days.
2. Annual travel budget.
3. Planned trip count.
4. Wishlist items and priority.
5. Average budget cap per trip.
6. Exact unavailable dates in 2026.

The step indicator is clickable. Users can jump directly to any question instead of moving linearly.

## 5. First-Use Flow

When no saved plan exists, users should not see an empty Year View.

Current empty-state logic:
- Hero prompt: "你的 2026，从一句话开始".
- Primary action: tell Aurora what landscapes or experiences the user wants to see.
- Inspiration cards provide seeded examples:
  - Iceland aurora.
  - Kyoto blossoms.
  - Xinjiang poplar.
- Clicking an inspiration item pre-fills the planner wishlist but still requires boundary conditions to be confirmed.

Design principle:
- Lower the blank-page cost.
- Use inspiration as a starting point, not as a finished plan.
- Do not silently make important assumptions about PTO, budget, trip count, or unavailable dates.

## 6. Wishlist Priority

Wishlist items are structured, not just free text.

Priority labels:
- 必去 = score 3.
- 想去 = score 2.
- 随缘 = score 1.

Planning rule:
- Sort wishlist items by priority score descending.
- Preserve user input order when priorities tie.
- When resources are insufficient, defer lower-priority items first.
- Deferred items move to the next planning year, currently 2027 for the MVP.

Compatibility:
- Keep legacy free-text `wishlist`.
- Add structured `wishlistItems`.
- Existing saved plans without structured wishlist items should still load and migrate into default `想去` items.

## 7. Calendar and Unavailable Dates

The planner no longer asks for broad unavailable months as the main constraint. It now asks for exact unavailable dates in the planning year.

Current MVP model:
- `unavailableDates`: list of ISO dates.
- `unavailableDateNotes`: date-level notes such as anniversary, parent birthday, work peak period, or other unavailable reason.
- Existing saved dates are loaded back into the planner when editing a plan.

Calendar requirements:
- Show a full 2026 year calendar in the planner.
- Let users click individual days to block or unblock them.
- Show saved date notes.
- Show public holidays and adjusted workdays for reference.
- Use local seeded public holiday data for MVP.
- Keep the holiday source replaceable with a real API later.

Public holiday source:
- MVP uses local seeded 2026 China public holiday and adjusted-workday data in `lib/calendar.ts`.
- Later versions should confirm the source of truth before replacing seeded data.

## 8. Agent Architecture

The MVP keeps a real-provider-ready structure while using local deterministic fallback results.

Agent categories:
- Timing Agent: seasonality, peak bloom, aurora window, scenery timing, weather uncertainty.
- Price Agent: flight/hotel price windows and historical troughs.
- Holiday Agent: PTO, public holiday leverage, unavailable dates, leave strategies.
- Combined Agent: resolves conflicts, ranks wishes, and decides what to plan now vs defer.

Current behavior:
- `/api/plan` accepts structured profile data.
- If `OPENAI_API_KEY` and `OPENAI_MODEL` exist, the API may call an LLM.
- If model execution fails or keys are absent, local deterministic planning is used.
- Local fallback must stay fast and stable for demo reliability.

Future integration decisions still needed:
- Travel guide/search data source.
- Weather/seasonality data source.
- Flight/hotel price source.
- Public holiday calendar source.
- Trend/popularity source for inspiration cards.

## 9. Planning Rules

Inputs:
- PTO days.
- Annual budget.
- Planned trip count.
- Average budget cap per trip.
- Wishlist items with priority.
- Exact unavailable dates.
- Optional legacy unavailable months.

Outputs:
- Planned trips.
- Deferred trips.
- Agent findings.
- Per-trip timing and leave strategy context.

Resource constraints:
- Trip count cannot exceed user preference.
- Planned PTO usage should not exceed annual PTO.
- Planned estimated budget should not exceed annual budget.
- Lower-priority wishlist items defer first.
- Exact unavailable dates should be treated as hard conflicts in leave strategy evaluation.

Current limitation:
- The MVP leave strategy module flags blocked-date conflicts but does not yet automatically re-optimize trip dates around every blocked date. That should become a future planning upgrade.

## 10. Interaction Requirements

Required navigation:
- Empty state -> planner.
- Inspiration card -> planner with prefilled wishlist.
- Planner -> generated Year View.
- Year View trip pill -> Trip View.
- Trip View back -> Year View.
- Chat/refine button -> planner with existing profile preloaded.

Required planner behavior:
- Step navigation must be clickable.
- Users can edit previous answers without restarting.
- Saved unavailable dates must be loaded when modifying a plan.
- Users can add, delete, and reprioritize wishlist items.
- The plan should regenerate after boundary conditions change.

Language:
- Simplified Chinese and English are supported.
- Language toggle should update top bar, empty state, planner, Time Warp, Year View, agent alerts, stats, and Trip View.

## 11. Current MVP Scope

Included:
- Empty state.
- Wishlist priority.
- Structured planner profile.
- Local deterministic planning fallback.
- Year View maturity states.
- Time Warp maturity simulation.
- Agent alert carousel.
- Exact unavailable date selection.
- Seeded public holiday reference.
- Trip leave strategy module.
- LocalStorage persistence.

Excluded for now:
- Real travel guide search.
- Real weather integration.
- Real price integration.
- Real popularity/social proof data.
- User accounts.
- Multi-year plan management beyond simple deferral.
- Saving a selected leave strategy as final execution plan.

## 12. PRD Maintenance and Rollback Rule

Every product design or architecture change must update this PRD in the same change set.

Minimum update policy:
- Update affected sections in `docs/PRD.md`.
- Add one entry to `docs/prd-changelog.md`.
- If the change is large or controversial, add a dated snapshot under `docs/prd-archive/`.

Rollback policy:
- Do not delete historical context casually.
- Use Git to revert a PRD change when product direction changes.
- For major PRD versions, keep a snapshot file so an older product concept can be restored without reconstructing it from memory.

Recommended cadence:
- Small UI-only changes: changelog entry only if product logic changes.
- Product flow changes: update PRD + changelog.
- Data model, agent architecture, planning rules, or business logic changes: update PRD + changelog + optional snapshot.
