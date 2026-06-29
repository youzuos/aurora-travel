# Travel Companion Agent Design

Date: 2026-06-29
Project: Aurora MVP
Target delivery: 2026-07-04

## Summary

Add a lightweight Travel Companion Agent layer to Aurora. The companion is a cute anthropomorphic fantasy creature or spirit with travel cues such as a backpack, camera, and scarf. It appears during first use, lives as a floating companion in the main interface, shares travel updates, replies immediately to user messages, and can move to user-specified cities or countries.

This feature is independent from Aurora's annual planning workflow. Aurora still handles year planning, trip maturity, and plan refinement. The Travel Companion handles companionship, travel storytelling, lightweight chat, and mood.

## Goals

- Let first-time users choose a companion before entering the main experience.
- Make the companion feel alive without frequent city-hopping.
- Support immediate chat replies that answer the user and expand the topic.
- Allow the user to ask what the companion is doing, what it ate, where it is, request a photo, or send it to a city/country.
- Support text, browser-TTS voice bubbles, image cards, and mixed messages.
- Keep the MVP local-first using `localStorage`, matching the current Aurora app architecture.
- Keep the feature stable and testable for the 2026-07-04 delivery.

## Non-Goals

- No real account system or backend persistence in the MVP.
- No real-time web crawling for images.
- No dynamic image generation for every city photo.
- No dependency on live LLM calls for basic chat behavior.
- No changes to the annual travel planning algorithm unless needed for integration.
- No forced upload flow; uploaded-image generation is a later optional path.

## Product Flow

### First Visit

On first visit, the app reads `aurora.companion.v1` from `localStorage`.

If no companion has been selected, show a full-screen onboarding modal before the user continues. The modal offers 3-4 preset companion characters. Each character has:

- Name
- Short personality line
- Character image
- Visual tags such as curious, brave, sleepy, photographer, or food-lover

The character style is anime-inspired and cute, but not a copy of any existing IP. The design direction is fantasy creature / small animal / spirit hybrid, anthropomorphic, with backpack, camera, and scarf.

### Home Status

After selection, the main page shows a lightweight companion status near the hero/header area:

> I drifted into Kyoto this morning. The Kamo River was cold, so I wrapped my scarf twice and took a photo of the first blossoms waking up.

The line changes across visits by rotating through current-city material. It is not a static welcome sentence.

Clicking the status opens the companion chat.

### Floating Companion

The companion floats in a screen corner, preferably bottom-right on desktop and above bottom navigation space on mobile. It shows:

- Character avatar
- Current city
- Small activity/status indicator
- Unread count when it has stories queued

The floating companion should not cover important Year View or Trip View controls.

### Chat Drawer

Clicking the floating companion opens `CompanionChat`, a side drawer on desktop and a bottom sheet on mobile.

The drawer supports:

- Message history
- User text input
- Immediate typing indicator
- Text responses
- Voice bubble responses
- Image card responses
- Mixed image + text responses
- Change-companion entry
- Optional advanced upload-to-generate entry

The existing `ChatOverlay` remains the annual planning/refinement flow. `CompanionChat` is only for the travel companion.

## Companion Activity Rules

The companion must not feel silent. It should be active through current-city observations, not frequent relocation.

### Passive Activity

Default production-like behavior:

- The companion stays in a city for 1-3 days.
- Natural migration happens only after enough elapsed time has passed and the user returns or interacts.
- Natural migration prefers neighboring cities.

MVP test behavior:

- A development/test setting can compress the migration interval to minutes for validation.
- The production-facing default remains day-scale.

Bubble behavior:

- Show a short passive bubble every 60-120 seconds while the user is active.
- In test mode, the interval can be reduced to 10-20 seconds.
- Passive bubbles describe the current city and do not usually change city.
- If the chat drawer is open, do not show floating bubbles; add companion messages directly to the chat stream or hold them as unread.
- Cap unread messages at 3 and collapse overflow into a summary such as "I saved a few small things to tell you."

### User-Initiated Activity

The companion responds immediately when the user sends a message.

Response rule:

- Show typing state quickly.
- Reply after a short natural delay.
- Answer the user's question.
- Add one extra current-city detail or follow-up topic.

Examples:

- User asks "What are you doing?" The companion says what it is doing now and adds a small encounter or choice.
- User asks "What did you eat?" The companion describes food plus the shop, person, smell, weather, or street.
- User asks for a photo. The companion sends an image card plus a caption.
- User asks it to go to a city/country. The companion acknowledges departure, migrates, and sends the first arrival note.
- If the intent is unclear, the companion still replies using current-city material instead of staying silent.

## Travel Logic

### State

Persist state in `localStorage` under a versioned key such as `aurora.companion.v1`.

State includes:

- `selectedCharacterId`
- `currentLocationId`
- `lastMovedAt`
- `lastActiveAt`
- `messageHistory`
- `unreadCount`
- `onboardingCompleted`
- `testMode` or development-only time-scale control

### Locations

Add local data for cities. Each `CompanionLocation` includes:

- City
- Country
- Display name in Chinese and English
- Keywords for user matching
- Neighbor location ids
- Landscape tags
- Food tags
- People/encounter snippets
- Weather/mood snippets
- Photo background candidates

The initial location set should cover cities already relevant to Aurora plus a few globally recognizable travel cities:

- Kyoto
- Osaka
- Nara
- Reykjavik
- Mohe
- Wuhan
- Changbai Mountain
- Kanas / Xinjiang
- Tromso
- Paris
- Amsterdam
- Brussels

### Migration

Automatic migration:

- Only evaluated on page open, return, or companion interaction.
- If elapsed time exceeds the configured stay interval, pick a neighboring city first.
- If no neighbor is available, pick a city with compatible mood tags.
- Generate an arrival message.

User-triggered migration:

- Match city keywords first.
- If a country is mentioned, choose a city in that country.
- If the user asks for a vague place such as "a seaside city", choose by tags.
- If no match is found, reply that the companion has pinned it on the map and ask for clarification or choose a plausible fallback.

User-triggered migration ignores the normal stay interval.

## Message Generation

The MVP uses deterministic local logic rather than live LLM calls.

Add a message generator that maps intent to city content:

- `status`: current activity and city mood
- `food`: food snippet
- `photo`: image card and caption
- `people`: encounter snippet
- `scenery`: landscape snippet
- `move`: migration confirmation and arrival
- `unknown`: answer with a friendly current-city story and invite a follow-up

The companion should sound person-like, warm, and vivid, but concise. Avoid long walls of text. Most replies should be 1-3 short sentences.

## Multimedia Strategy

### Character Assets

Generate only a small set of 3-4 companion character images for the preset choices and avatar/floating UI. Each must be:

- Anime-inspired
- Cute and anthropomorphic
- Fantasy creature / small animal / spirit hybrid
- Wearing or carrying backpack, camera, and scarf
- Original and not based on copyrighted characters

These character assets are independent from city photos. The chosen companion does not need to appear inside every travel photo.

### Travel Photos

City travel photos are shared across all companion characters.

Do not create `character x city` image combinations. The photo represents what the companion saw, ate, or encountered, not necessarily a selfie.

Use a stable source strategy:

- Prefer curated static city image URLs from legal image sources or locally saved city images.
- Use front-end cards to add city, time, and caption overlays.
- Do not scrape arbitrary websites.
- Do not depend on live image search during the demo.

This keeps asset generation cost low and avoids copyright and hotlink instability.

### Voice

Use browser `speechSynthesis` for voice bubbles.

Behavior:

- A voice bubble has duration, play button, and transcript.
- On click, call `speechSynthesis.speak`.
- If unavailable, show the bubble and transcript only.
- Do not require a paid TTS service in the MVP.

## Advanced Optional Upload Flow

Uploading a user image to generate a personalized companion is a P1 optional feature, not part of the required MVP path.

The onboarding modal may include an advanced entry:

> Upload an image to inspire a custom companion.

MVP behavior can provide:

- Upload UI
- Preview/crop
- Style choices
- Loading state
- Demo fallback result using a preset or parameterized local character

Future real generation behavior:

- Send uploaded image and style choices to a backend API.
- Generate an original fantasy travel companion inspired by the image.
- Add backpack, camera, and scarf.
- Save the generated image as the selected companion.

Privacy and safety copy:

- The upload is used only to inspire a companion image.
- The output should be an original character, not a faithful human replica.

## Component Plan

Add:

- `data/companion.ts`: characters, locations, snippets, image candidates.
- `lib/companion.ts`: state helpers, migration logic, intent matching, message generation.
- `components/CompanionOnboarding.tsx`: first-time character selection and optional upload entry.
- `components/CompanionStatus.tsx`: home status line.
- `components/CompanionBubble.tsx`: floating companion, passive bubbles, unread state.
- `components/CompanionChat.tsx`: chat drawer/bottom sheet.

Modify:

- `app/page.tsx`: owns companion state, localStorage hydration, and component integration.
- `components/TopBar.tsx`: add a small companion/settings entry only if it does not crowd existing controls.

Do not modify:

- `lib/planner.ts` unless a type import or integration detail requires it.
- Existing annual planning logic.

## Error Handling and Fallbacks

- If `localStorage` parsing fails, reset companion state and show onboarding.
- If character image fails, show a styled initials/avatar fallback.
- If city photo fails, show a gradient/card fallback with city name and caption.
- If browser TTS fails, show transcript and keep the voice bubble visual.
- If user asks for an unknown destination, ask a concise clarification and keep conversation alive.
- If test time-scale config is missing, default to production-like day-scale.

## Testing

Manual validation:

- First visit shows onboarding.
- Selecting a character saves state and enters the app.
- Refresh preserves selected character and current city.
- Home status changes across visits/interactions.
- Floating bubble appears while chat is closed.
- Chat opens from status and floating bubble.
- User message gets an immediate reply and topic expansion.
- "What are you doing?" returns current activity.
- "What did you eat?" returns food content.
- "Send a photo" returns image card.
- "Go to Paris" migrates immediately and sends arrival note.
- Country-level command chooses a matching city.
- Unknown city does not break chat.
- Voice bubble plays with `speechSynthesis` or falls back cleanly.
- Change-character flow updates the selected avatar.
- Test time-scale can force migration without waiting 1-3 days.

Implementation verification:

- `npm run build`
- Browser check at desktop and mobile widths
- Confirm no major overlap with Year View, Trip View, ChatOverlay, or TopBar

## Delivery Priority

P0 for 2026-07-04:

- Preset companion selection
- Companion status on home
- Floating companion
- Chat drawer
- Immediate local replies
- User-triggered migration
- Passive non-silent bubbles
- Browser TTS voice bubble
- Photo cards from shared city images
- localStorage persistence
- Test acceleration control

P1 after core is stable:

- Upload-image custom companion UI with demo fallback
- Real image-generation API for uploaded custom companion
- More city content
- Legal image API integration
- More nuanced personality memory

