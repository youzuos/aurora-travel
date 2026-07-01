# Companion Interest Behavior Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each animal companion's interests affect chat replies, passive messages, visual actions, LLM prompts, and exploration behavior.

**Architecture:** Add one shared behavior profile module keyed by companion character id. Existing local reply generation, passive bubble generation, action selection, exploration ranking, and API prompt construction will consume the same profile to keep behavior consistent.

**Tech Stack:** Next.js 14, React 18, TypeScript, local Node regression tests in `tests/companion.regression.test.ts`.

## Global Constraints

- Do not add new runtime dependencies.
- Preserve existing local fallback behavior when no LLM key is configured.
- Keep all behavior deterministic enough for regression tests.
- Keep user-facing Chinese copy readable in newly authored text.

---

### Task 1: Shared Behavior Profile

**Files:**
- Create: `lib/companionBehavior.ts`
- Modify: `tests/companion.regression.test.ts`
- Modify: `tests/tsconfig.companion-tests.json`

**Interfaces:**
- Produces: `getCompanionBehaviorProfile(characterId?: string | null): CompanionBehaviorProfile`
- Produces: `chooseInterestWeightedAction(characterId, fallbackAction, seed, sleeping): CompanionAction`
- Produces: `pickInterestPromptLine(characterId, lang, seed): string`

- [ ] Write failing tests that assert fox, dog, rabbit, and penguin behavior profiles expose different preferred actions and prompt lines.
- [ ] Add the module and implement deterministic profile lookup.
- [ ] Run `npm run test:companion` and confirm the new profile tests pass.

### Task 2: Local Messages and Actions

**Files:**
- Modify: `lib/companion.ts`
- Modify: `tests/companion.regression.test.ts`

**Interfaces:**
- Consumes: behavior profile helpers from Task 1.
- Updates: passive messages and local reply expansion to include interest-specific details.
- Updates: `actionForIntent` and passive message visual action selection to respect preferred actions.

- [ ] Write failing tests showing Piko's passive message/action favors food and Mira's favors photo/light details.
- [ ] Use profile prompts in local replies and passive messages.
- [ ] Run `npm run test:companion`.

### Task 3: LLM Prompt and Exploration Consistency

**Files:**
- Modify: `app/api/companion/reply/route.ts`
- Modify: `lib/companionExploration.ts`
- Modify: `tests/companion.regression.test.ts`

**Interfaces:**
- Consumes: behavior profile prompt lines and preferred tags.
- Updates: LLM system instruction and payload to include explicit interest behavior requirements.
- Updates: discovery ranking to use the shared profile tags.

- [ ] Write failing tests that assert Gemini system instructions include interest behavior guidance.
- [ ] Replace duplicate preference tag constants with shared behavior profile tags.
- [ ] Run `npm run test:companion`.

### Task 4: Verification

**Files:**
- No new files.

- [ ] Run `npm run test:companion`.
- [ ] Run `npm run build`.
- [ ] Restart local dev server on `localhost:3000`.
- [ ] Verify in browser that companion status and chat reflect interest-driven action classes and profile text.
