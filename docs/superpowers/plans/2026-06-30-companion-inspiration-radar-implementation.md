# Companion Inspiration Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a non-chat “inspiration radar” that lets the travel companion explore user-entered destinations, random destinations, IP-hinted destinations, and nearby cities, then convert findings into wishlist items for plan refinement.

**Architecture:** Add deterministic exploration logic in `lib/companionExploration.ts`, extend destination data with coordinates/tags/snippets, and expose a focused `CompanionInspirationRadar` UI that emits `WishlistItem`s. Keep Gemini optional; core matching, distance, random fallback, and card generation are local and testable.

**Tech Stack:** Next.js 14, React 18, TypeScript, existing localStorage state, existing `npm run test:companion`, browser `fetch` for optional IP hints.

## Global Constraints

- No third-party IP lookup service; only read deployment/request headers when available.
- Do not present IP-derived location as a fact to the user.
- No user geolocation permission prompt in this phase.
- Input must be free-form, not limited to chips.
- Nearby recommendations are based on the companion's current city, not the user's location.
- Empty input must still work through random or IP-hinted random exploration.
- No mandatory Gemini dependency; local fallback must fully work.

---

### Task 1: Exploration Core

**Files:**
- Create: `lib/companionExploration.ts`
- Modify: `data/companion.ts`
- Modify: `tests/companion.regression.test.ts`
- Modify: `tests/tsconfig.companion-tests.json`

**Interfaces:**
- Produces: `resolveCompanionExploration(input, state, options): CompanionFinding`
- Produces: `companionFindingToWishlistItem(finding): WishlistItem`
- Produces: `getIpLocationHintFromHeaders(headers): CompanionIpHint | null`

- [ ] **Step 1: Write failing tests**

Add tests for exact city, country, tag, empty random, IP-hinted random, nearby distance, and wishlist conversion in `tests/companion.regression.test.ts`.

- [ ] **Step 2: Run red test**

Run: `npm run test:companion`
Expected: FAIL because `lib/companionExploration` does not exist.

- [ ] **Step 3: Implement minimal core**

Create `lib/companionExploration.ts` with Haversine distance, local matching, random selection, nearby sorting, finding generation, and wishlist conversion.

- [ ] **Step 4: Add city metadata**

Extend companion locations with `coordinates`, `tags`, and staged snippets for at least the current city set.

- [ ] **Step 5: Run green test**

Run: `npm run test:companion`
Expected: PASS.

### Task 2: IP Hint API

**Files:**
- Create: `app/api/companion/ip-hint/route.ts`
- Modify: `tests/companion.regression.test.ts`
- Modify: `tests/tsconfig.companion-tests.json`

**Interfaces:**
- Produces: `GET /api/companion/ip-hint` returning `{ hint: CompanionIpHint | null }`

- [ ] **Step 1: Write failing API test**

Import the route and test that Vercel/Cloudflare-style headers produce a country/city hint, while empty headers return `null`.

- [ ] **Step 2: Run red test**

Run: `npm run test:companion`
Expected: FAIL because route does not exist.

- [ ] **Step 3: Implement route**

Create a node runtime route that calls `getIpLocationHintFromHeaders(request.headers)` and returns JSON.

- [ ] **Step 4: Run green test**

Run: `npm run test:companion`
Expected: PASS.

### Task 3: Inspiration Radar UI

**Files:**
- Create: `components/CompanionInspirationRadar.tsx`
- Modify: `app/page.tsx`
- Modify: `components/CompanionChat.tsx`

**Interfaces:**
- Consumes: `resolveCompanionExploration`, `companionFindingToWishlistItem`
- Produces: `onAddWishlistItems(items: WishlistItem[])`

- [ ] **Step 1: Build radar component**

Create a compact module with free-form input, chips as suggestions, random explore, nearby explore, finding card, and add-to-wishlist action.

- [ ] **Step 2: Integrate no-plan home**

Render radar before/within the no-plan `YearView` flow so users can discover a place before opening the planner.

- [ ] **Step 3: Integrate planned year view**

Render radar above the timeline when a plan exists and no trip is selected, allowing new findings to open the planner with seeded wishlist items.

- [ ] **Step 4: Integrate companion panel**

Add the radar as a distinct top action area inside `CompanionChat`, not as a replacement for normal chat.

### Task 4: Plan Refinement by Time

**Files:**
- Modify: `lib/companionExploration.ts`
- Modify: `components/CompanionInspirationRadar.tsx`
- Modify: `tests/companion.regression.test.ts`

**Interfaces:**
- Consumes: `WarpStop`
- Produces: staged finding copy for `year-start`, `three-months`, `one-month`, and `two-weeks`

- [ ] **Step 1: Write staged copy tests**

Assert the same city produces different text at different warp stages.

- [ ] **Step 2: Run red test**

Run: `npm run test:companion`
Expected: FAIL if staged snippets are not wired.

- [ ] **Step 3: Implement stage selection**

Map `WarpStop` to staged snippet groups and display the stage label on the card.

- [ ] **Step 4: Run green test**

Run: `npm run test:companion`
Expected: PASS.

### Task 5: Verification

**Files:**
- No new files expected.

- [ ] **Step 1: Run regression tests**

Run: `npm run test:companion`
Expected: PASS.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Browser test**

Start `npm run dev`, then verify: empty random, typed Paris, typed Japan, typed seaside, nearby explore, add to wishlist, planner seed, chat panel radar, existing chat still works.

- [ ] **Step 4: Commit**

Commit implementation after tests and browser verification pass.

