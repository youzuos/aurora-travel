import assert from "node:assert/strict";
import {
  addPassiveCompanionMessage,
  commitCompanionUserMessage,
  createAgentMessage,
  createDefaultCompanionState,
  generateCompanionReply,
  getCompanionAction,
  getCompanionLocalTimeInfo,
  maybeAdvanceCompanionLocation,
  mergeGeneratedReplyState,
  selectCharacter,
  type CompanionState,
} from "../lib/companion";
import { getCompanionBehaviorProfile, pickInterestPromptLine } from "../lib/companionBehavior";
import { getPixelCompanionMotionClass } from "../lib/pixelCompanionMotion";
import { POST as companionReplyPost } from "../app/api/companion/reply/route";
import { GET as companionIpHintGet } from "../app/api/companion/ip-hint/route";
import {
  companionFindingToWishlistItem,
  getIpLocationHintFromHeaders,
  resolveCompanionDiscovery,
  resolveCompanionExploration,
} from "../lib/companionExploration";

function readyState(overrides: Partial<CompanionState> = {}, now = 1_000): CompanionState {
  return {
    ...selectCharacter(createDefaultCompanionState(now), "mira", now),
    ...overrides,
  };
}

async function runCase(name: string, fn: () => void | Promise<void>) {
  await fn();
  console.log(`ok ${name}`);
}

async function main() {
await runCase("passive activity appends to history without unread when chat is open", () => {
  const state = readyState({ unreadCount: 0, statusCursor: 0 });
  const result = addPassiveCompanionMessage(state, "en", 2_000, { incrementUnread: false });

  assert.equal(result.state.unreadCount, 0);
  assert.equal(result.state.messageHistory.length, state.messageHistory.length + 1);
  assert.equal(result.state.messageHistory.at(-1)?.id, result.message.id);
});

await runCase("migration can be re-evaluated on later interactions in accelerated test mode", () => {
  const state = readyState({
    currentLocationId: "kyoto",
    testMode: true,
    lastMovedAt: 1_000,
    unreadCount: 0,
  });

  const advanced = maybeAdvanceCompanionLocation(state, 1_000 + 6 * 60 * 1_000 + 1, { incrementUnread: false });

  assert.equal(advanced.currentLocationId, "osaka");
  assert.equal(advanced.unreadCount, 0);
  assert.match(advanced.messageHistory.at(-1)?.textEn ?? "", /Osaka/);
});

await runCase("vague destination requests match by tags before fallback", () => {
  const seaReply = generateCompanionReply("go to the seaside", readyState(), "en", 5_000);
  const quietReply = generateCompanionReply("go somewhere quiet with temples", readyState(), "en", 6_000);

  assert.equal(seaReply.state.currentLocationId, "reykjavik");
  assert.equal(quietReply.state.currentLocationId, "kyoto");
});

await runCase("reply commit merges onto latest state instead of overwriting newer changes", () => {
  const userOnlyState = readyState({
    messageHistory: [createAgentMessage("text", "Before leaving", "Before leaving", 1_100)],
    testMode: false,
    statusCursor: 2,
  });
  const replyMessage = createAgentMessage("text", "I am back", "I am back", 1_700);
  const plannedState = {
    ...userOnlyState,
    lastActiveAt: 1_700,
    messageHistory: [...userOnlyState.messageHistory, replyMessage],
  };
  const latestState = {
    ...userOnlyState,
    testMode: true,
    statusCursor: 4,
  };

  const merged = mergeGeneratedReplyState(latestState, userOnlyState, plannedState, [replyMessage]);

  assert.equal(merged.testMode, true);
  assert.equal(merged.statusCursor, 4);
  assert.equal(merged.messageHistory.at(-1)?.id, replyMessage.id);
});

await runCase("reply merge replaces matching local message ids with enhanced content", () => {
  const userOnlyState = readyState({
    messageHistory: [createAgentMessage("text", "Before leaving", "Before leaving", 1_100)],
    statusCursor: 2,
  });
  const localReply = createAgentMessage("text", "Local reply", "Local reply", 1_700);
  const enhancedReply = { ...localReply, textEn: "Enhanced reply", textZh: "增强回复" };
  const plannedState = {
    ...userOnlyState,
    lastActiveAt: 1_700,
    statusCursor: 3,
    messageHistory: [...userOnlyState.messageHistory, enhancedReply],
  };
  const latestState = {
    ...userOnlyState,
    messageHistory: [...userOnlyState.messageHistory, localReply],
  };

  const merged = mergeGeneratedReplyState(latestState, userOnlyState, plannedState, [enhancedReply]);

  assert.equal(merged.messageHistory.length, latestState.messageHistory.length);
  assert.equal(merged.messageHistory.at(-1)?.textEn, "Enhanced reply");
});

await runCase("sending a user message commits an agent response immediately", () => {
  const state = readyState({
    messageHistory: [createAgentMessage("text", "Before leaving", "Before leaving", 1_100)],
  });

  const committed = commitCompanionUserMessage("what are you doing", state, "en", 1_800);
  const newMessages = committed.messageHistory.slice(state.messageHistory.length);

  assert.equal(newMessages[0]?.sender, "user");
  assert.equal(newMessages.some((message) => message.sender === "agent"), true);
  assert.equal(committed.unreadCount, 0);
});

await runCase("visual action follows the current city local time", () => {
  const kyotoLunchUtc = Date.UTC(2026, 5, 29, 3, 0, 0);
  const kyotoNightUtc = Date.UTC(2026, 5, 29, 13, 0, 0);

  const lunchState = generateCompanionReply("what did you eat", readyState({ currentLocationId: "kyoto" }), "en", kyotoLunchUtc).state;
  const nightState = generateCompanionReply("what did you eat", readyState({ currentLocationId: "kyoto" }), "en", kyotoNightUtc).state;

  assert.equal(getCompanionLocalTimeInfo(lunchState, kyotoLunchUtc).hour, 12);
  assert.equal(getCompanionAction(lunchState, kyotoLunchUtc), "food");
  assert.equal(getCompanionLocalTimeInfo(nightState, kyotoNightUtc).hour, 22);
  assert.equal(getCompanionAction(nightState, kyotoNightUtc), "sleepy");
});

await runCase("meal time turns ordinary travel visuals into food state", () => {
  const kyotoBreakfastUtc = Date.UTC(2026, 5, 29, 23, 0, 0);
  const walkingState = readyState({
    currentLocationId: "kyoto",
    visualAction: "walking",
    lastActiveAt: kyotoBreakfastUtc,
  });
  const mapState = readyState({
    currentLocationId: "kyoto",
    visualAction: "map",
    lastActiveAt: kyotoBreakfastUtc,
  });
  const excitedState = readyState({
    currentLocationId: "kyoto",
    visualAction: "excited",
    lastActiveAt: kyotoBreakfastUtc,
  });

  assert.equal(getCompanionLocalTimeInfo(walkingState, kyotoBreakfastUtc).meal, "breakfast");
  assert.equal(getCompanionAction(walkingState, kyotoBreakfastUtc), "food");
  assert.equal(getCompanionAction(excitedState, kyotoBreakfastUtc), "food");
  assert.equal(getCompanionAction(mapState, kyotoBreakfastUtc), "map");
});

await runCase("rotating snippets vary by cursor for status, food, and photo", () => {
  const kyotoA = generateCompanionReply("what are you doing", readyState({ currentLocationId: "kyoto", statusCursor: 0 }), "en", 7_000);
  const kyotoB = generateCompanionReply("what are you doing", readyState({ currentLocationId: "kyoto", statusCursor: 1 }), "en", 8_000);
  const osakaFoodA = generateCompanionReply("what did you eat", readyState({ currentLocationId: "osaka", statusCursor: 0 }), "en", 9_000);
  const osakaFoodB = generateCompanionReply("what did you eat", readyState({ currentLocationId: "osaka", statusCursor: 1 }), "en", 10_000);
  const parisPhotoA = generateCompanionReply("send a photo", readyState({ currentLocationId: "paris", statusCursor: 0 }), "en", 11_000);
  const parisPhotoB = generateCompanionReply("send a photo", readyState({ currentLocationId: "paris", statusCursor: 1 }), "en", 12_000);

  assert.notEqual(kyotoA.messages[1].textEn, kyotoB.messages[1].textEn);
  assert.notEqual(osakaFoodA.messages[1].textEn, osakaFoodB.messages[1].textEn);
  assert.notEqual(parisPhotoA.messages[1].image?.captionEn, parisPhotoB.messages[1].image?.captionEn);
});

await runCase("companion behavior profiles expose distinct interests and prompt lines", () => {
  const fox = getCompanionBehaviorProfile("mira");
  const dog = getCompanionBehaviorProfile("piko");
  const rabbit = getCompanionBehaviorProfile("nori");
  const penguin = getCompanionBehaviorProfile("toto");

  assert.equal(fox.preferredActions.includes("photo"), true);
  assert.equal(dog.preferredActions.includes("food"), true);
  assert.equal(rabbit.preferredActions.includes("map"), true);
  assert.equal(penguin.interestTags.includes("aurora"), true);
  assert.match(pickInterestPromptLine("mira", "en", 1), /light|camera|corner/i);
  assert.match(pickInterestPromptLine("piko", "en", 1), /snack|market|smell|food/i);
});

await runCase("passive companion messages reflect selected animal interests", () => {
  const dog = selectCharacter(createDefaultCompanionState(1_000), "piko", 1_000);
  const fox = selectCharacter(createDefaultCompanionState(1_000), "mira", 1_000);
  const dogResult = addPassiveCompanionMessage({ ...dog, currentLocationId: "osaka", statusCursor: 0 }, "en", Date.UTC(2026, 5, 29, 4), {
    incrementUnread: false,
  });
  const foxResult = addPassiveCompanionMessage({ ...fox, currentLocationId: "paris", statusCursor: 0 }, "en", Date.UTC(2026, 5, 29, 10), {
    incrementUnread: false,
  });

  assert.equal(dogResult.state.visualAction, "food");
  assert.match(dogResult.message.textEn, /snack|market|smell|food|taste/i);
  assert.equal(foxResult.state.visualAction, "photo");
  assert.match(foxResult.message.textEn, /light|camera|corner|photo/i);
});

await runCase("reply API uses Gemini when configured and keeps the local media plan", async () => {
  const originalFetch = global.fetch;
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalGeminiModel = process.env.GEMINI_MODEL;
  const originalAzureKey = process.env.AZURE_OPENAI_API_KEY;
  const originalAzureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const originalAzureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const originalOpenAiKey = process.env.OPENAI_API_KEY;

  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.GEMINI_MODEL = "gemini-test-model";
  delete process.env.AZURE_OPENAI_API_KEY;
  delete process.env.AZURE_OPENAI_ENDPOINT;
  delete process.env.AZURE_OPENAI_DEPLOYMENT;
  delete process.env.OPENAI_API_KEY;

  let requestedUrl = "";
  let requestedBody: any = null;
  let requestedPromptPayload: any = null;
  global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedBody = JSON.parse(String(init?.body));
    requestedPromptPayload = JSON.parse(requestedBody.contents[0].parts[0].text);
    const replyId = requestedPromptPayload.candidateAgentMessages.at(-1).id;
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    messages: [
                      {
                        id: replyId,
                        textZh: "我刚拍到一张像明信片一样的街角，风里还有热乎乎的小吃香气。",
                        textEn: "I just photographed a postcard-like corner, and the air smells like warm street snacks.",
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as typeof fetch;

  try {
    const response = await companionReplyPost(
      new Request("http://localhost/api/companion/reply", {
        method: "POST",
        body: JSON.stringify({
          input: "send a photo",
          lang: "en",
          now: 2_000,
          state: readyState({ currentLocationId: "kyoto" }, 1_000),
        }),
      })
    );
    const body = await response.json();

    assert.equal(body.generatedBy, "gemini");
    assert.equal(body.messages[1].textEn, "I just photographed a postcard-like corner, and the air smells like warm street snacks.");
    assert.equal(body.messages[1].image.src.includes("unsplash.com"), true);
    assert.match(requestedUrl, /generativelanguage\.googleapis\.com/);
    assert.equal(requestedBody.generationConfig.responseMimeType, "application/json");
    assert.equal(requestedBody.contents[0].parts[0].text.includes("send a photo"), true);
    assert.equal(requestedBody.systemInstruction.parts[0].text.includes("Travel preference tags"), true);
    assert.equal(requestedBody.systemInstruction.parts[0].text.includes("Interest behavior tags"), true);
    assert.equal(requestedBody.systemInstruction.parts[0].text.includes("Mira should notice light"), true);
    assert.equal(requestedPromptPayload.companion.personalityEn.includes("Chases evening light"), true);
    assert.deepEqual(requestedPromptPayload.companion.tagsEn, ["curious", "camera", "dusk"]);
    assert.equal(requestedPromptPayload.companion.interestTags.includes("photo"), true);
    assert.match(requestedPromptPayload.companion.interestPromptEn, /light|camera|corner/i);
  } finally {
    global.fetch = originalFetch;
    if (originalGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalGeminiKey;
    if (originalGeminiModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalGeminiModel;
    if (originalAzureKey === undefined) delete process.env.AZURE_OPENAI_API_KEY;
    else process.env.AZURE_OPENAI_API_KEY = originalAzureKey;
    if (originalAzureEndpoint === undefined) delete process.env.AZURE_OPENAI_ENDPOINT;
    else process.env.AZURE_OPENAI_ENDPOINT = originalAzureEndpoint;
    if (originalAzureDeployment === undefined) delete process.env.AZURE_OPENAI_DEPLOYMENT;
    else process.env.AZURE_OPENAI_DEPLOYMENT = originalAzureDeployment;
    if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalOpenAiKey;
  }
});

await runCase("exploration resolves direct city, country, tag, random, nearby, and wishlist conversion", () => {
  const kyotoState = readyState({ currentLocationId: "kyoto", statusCursor: 0 }, 1_000);
  const paris = resolveCompanionExploration("Paris", kyotoState, { now: 2_000, warp: "year-start" });
  const japan = resolveCompanionExploration("Japan", readyState({ currentLocationId: "reykjavik" }, 1_000), {
    now: 2_100,
    warp: "t-90",
  });
  const seaside = resolveCompanionExploration("somewhere by the seaside", kyotoState, { now: 2_200, warp: "t-30" });
  const ipHinted = resolveCompanionExploration("", kyotoState, {
    now: 2_300,
    warp: "year-start",
    ipHint: { countryCode: "FR", city: "Paris" },
  });
  const nearby = resolveCompanionExploration("", kyotoState, { now: 2_400, warp: "t-14", mode: "nearby" });
  const wishlistItem = companionFindingToWishlistItem(paris);

  assert.equal(paris.cityId, "paris");
  assert.equal(paris.source, "direct-input");
  assert.equal(japan.source, "country-match");
  assert.equal(japan.countryEn, "Japan");
  assert.equal(seaside.source, "tag-match");
  assert.equal(seaside.tags.includes("seaside"), true);
  assert.equal(ipHinted.cityId, "paris");
  assert.equal(ipHinted.source, "ip-hint");
  assert.notEqual(nearby.cityId, "kyoto");
  assert.equal(nearby.source, "nearby");
  assert.equal(typeof nearby.distanceKm, "number");
  assert.equal((nearby.distanceKm ?? 9999) < 60, true);
  assert.equal(wishlistItem.label, "Paris");
  assert.equal(wishlistItem.source, "companion");
  assert.notEqual(paris.textEn, resolveCompanionExploration("Paris", kyotoState, { now: 2_500, warp: "t-14" }).textEn);
});

await runCase("random exploration respects companion personality preferences", () => {
  const foodCompanion = selectCharacter(createDefaultCompanionState(1_000), "piko", 1_000);
  const finding = resolveCompanionExploration("", { ...foodCompanion, currentLocationId: "kyoto" }, { now: 2_600 });

  assert.equal(finding.source, "random");
  assert.equal(finding.tags.some((tag) => ["food", "street", "breakfast", "chocolate", "cafe"].includes(tag)), true);
});

await runCase("destination onboarding discovery returns unique limited candidates", () => {
  const state = readyState({ currentLocationId: "kyoto" }, 1_000);
  const candidates = resolveCompanionDiscovery("", state, { now: 2_700, limit: 3 });
  const cityIds = new Set(candidates.map((finding) => finding.cityId));

  assert.equal(candidates.length, 3);
  assert.equal(cityIds.size, 3);
  assert.equal(candidates.some((finding) => finding.cityId === "kyoto"), false);
});

await runCase("destination onboarding preserves direct city intent", () => {
  const state = readyState({ currentLocationId: "kyoto" }, 1_000);
  const candidates = resolveCompanionDiscovery("Paris", state, { now: 2_800, limit: 3 });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.cityId, "paris");
  assert.equal(candidates[0]?.source, "direct-input");
});

await runCase("destination onboarding preference and companion personality shape candidates", () => {
  const foodCompanion = selectCharacter(createDefaultCompanionState(1_000), "piko", 1_000);
  const candidates = resolveCompanionDiscovery("", { ...foodCompanion, currentLocationId: "kyoto" }, {
    now: 2_900,
    preference: "food",
    limit: 3,
  });

  assert.equal(candidates.length, 3);
  assert.equal(candidates[0]?.tags.some((tag) => ["food", "street", "breakfast", "chocolate", "cafe"].includes(tag)), true);
});

await runCase("pixel companion maps visible states to distinct motion classes", () => {
  assert.equal(getPixelCompanionMotionClass("walking", true), "pixel-walk");
  assert.equal(getPixelCompanionMotionClass("photo", true), "pixel-photo");
  assert.equal(getPixelCompanionMotionClass("food", true), "pixel-food");
  assert.equal(getPixelCompanionMotionClass("map", true), "pixel-map");
  assert.equal(getPixelCompanionMotionClass("sleepy", true), "pixel-sleepy");
  assert.equal(getPixelCompanionMotionClass("excited", true), "pixel-hop");
  assert.equal(getPixelCompanionMotionClass("idle", true), "pixel-idle");
  assert.equal(getPixelCompanionMotionClass("idle", false), "");
});

await runCase("IP hint reads common deployment headers without requiring them", async () => {
  const vercelHeaders = new Headers({
    "x-vercel-ip-country": "JP",
    "x-vercel-ip-city": "Tokyo",
  });
  const cloudflareHeaders = new Headers({
    "cf-ipcountry": "FR",
  });

  assert.deepEqual(getIpLocationHintFromHeaders(vercelHeaders), { countryCode: "JP", city: "Tokyo" });
  assert.deepEqual(getIpLocationHintFromHeaders(cloudflareHeaders), { countryCode: "FR" });
  assert.equal(getIpLocationHintFromHeaders(new Headers()), null);

  const response = await companionIpHintGet(
    new Request("http://localhost/api/companion/ip-hint", {
      headers: vercelHeaders,
    })
  );
  const body = await response.json();

  assert.equal(body.hint.countryCode, "JP");
  assert.equal(body.hint.city, "Tokyo");
});
}

void main();
