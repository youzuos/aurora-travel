# Scene Companion Home Design

Date: 2026-07-02
Project: Aurora MVP

## Summary

Update the Aurora home screen from a vertical planning dashboard into an immersive companion scene. The current location scene becomes the full-screen background, the small travel companion sits in the main canvas, a top status frame summarizes current state, and two bottom-right buttons open the annual plan and chat flows.

## Approved Direction

Use the "scene main screen + bottom-right dual buttons" layout:

- Full-screen scenic background for the companion's current location.
- Companion character placed near the center-lower part of the viewport.
- Top status frame for current location, companion status, and annual plan summary.
- Bottom-right fixed buttons: "年度计划" and "聊天".
- "年度计划" opens the existing year/trip planning surface.
- "聊天" opens the existing chat/planner overlay for now.

## Layout

Desktop:

- Keep the page as a single viewport-sized scene.
- Place the status frame near the top, inset from the viewport edge.
- Keep the center of the scene visually open for the companion.
- Stack the two action buttons in the bottom-right corner.
- Open annual plan content in a modal or drawer so the scene remains the home state.

Mobile:

- Keep the scene background full-screen.
- Scale the companion down and position it above the bottom action area.
- Place the two action buttons near the bottom-right or as a compact two-button row.
- Ensure buttons do not cover the companion's face or primary scene details.

## Component Strategy

Keep this scoped to the existing app architecture:

- Modify `app/page.tsx` to make the scene the primary home layout.
- Reuse existing planning components instead of rewriting planning logic.
- Reuse the existing `ChatOverlay` for the "聊天" button.
- Add small local UI helpers if needed for the scene stage and plan panel.
- Avoid changing `lib/planner.ts` and annual plan generation behavior.

## Visual Direction

The first implementation can use CSS gradients and local/static background imagery as a scene stand-in. The key requirement is layout and hierarchy: background scene first, companion second, status and controls layered above.

Use restrained translucent UI surfaces so the interface does not become card-heavy. The buttons should be clear and compact, with stable dimensions.

## Verification

- `npm run build`
- Browser check at desktop width.
- Browser check at mobile width.
- Confirm the two bottom-right buttons do not overlap the companion.
- Confirm "年度计划" exposes the existing year view.
- Confirm "聊天" opens the existing planning chat overlay.
