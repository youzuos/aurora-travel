# Aurora PRD Changelog

This file records product design and architecture changes that affect the PRD. Keep entries concise and reversible through Git.

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
