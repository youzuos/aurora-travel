# Companion Destination Onboarding Plan

## Goal

After first-time users choose a small animal companion, quickly determine whether they already have a destination or need the companion to scout ideas. If undecided, the companion should use a short, non-chat exploration flow to recommend a destination within a few interactions and let the user add it to the trip wishlist.

## Scope

- Keep the first step as companion animal selection.
- Add a destination intent surface after companion selection and before the main empty year view.
- Support explicit city/country input, vague preference input, blank random departure, and quick preference refinement.
- Use companion personality preferences when producing exploration candidates.
- Add selected ideas to the existing trip wishlist planner.
- Persist completion locally so returning users do not repeat the flow unless they clear local storage.

## Tasks

1. Add companion discovery helpers in `lib/companionExploration.ts`
   - Export a discovery resolver that returns 2-3 unique `CompanionFinding` candidates.
   - Preserve exact city input as the strongest match.
   - Rank vague and blank searches by input tags, companion preference, nearby relationship, IP hint, and deterministic seed.
   - Keep the existing single-result resolver behavior intact.

2. Create `components/CompanionDestinationOnboarding.tsx`
   - Render a polished non-chat panel with a large destination input.
   - Provide clear actions for "I already have a place" and "let the companion scout".
   - Show companion-branded candidate cards with city, country, note, photo, source, and action buttons.
   - Keep undecided discovery to a few interactions through preference chips and a final add-to-wishlist CTA.

3. Wire the first-visit flow in `app/page.tsx`
   - Add a localStorage completion key.
   - Show destination onboarding only after companion onboarding is complete, no plan exists, and no trip is selected.
   - Hide the existing inspiration radar and empty year view while destination onboarding is active.
   - Open the planner with selected companion wishlist items and mark onboarding complete when the user chooses or skips.

4. Add regression coverage
   - Test discovery candidates are unique and limited.
   - Test direct city input remains deterministic.
   - Test companion personality influences blank discovery.
   - Test preference tags influence discovery ordering.

5. Verify
   - Run `npm run test:companion`.
   - Run `npm run build`.
   - Start the local app and use browser automation to test:
     - first visit shows animal selection first,
     - after selecting an animal, destination onboarding appears,
     - direct city creates a candidate,
     - undecided scouting shows multiple candidates,
     - preference refinement updates candidates,
     - adding a candidate opens the planner with seeded wishlist data.
