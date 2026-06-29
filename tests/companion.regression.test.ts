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

function readyState(overrides: Partial<CompanionState> = {}, now = 1_000): CompanionState {
  return {
    ...selectCharacter(createDefaultCompanionState(now), "mira", now),
    ...overrides,
  };
}

function runCase(name: string, fn: () => void) {
  fn();
  console.log(`ok ${name}`);
}

runCase("passive activity appends to history without unread when chat is open", () => {
  const state = readyState({ unreadCount: 0, statusCursor: 0 });
  const result = addPassiveCompanionMessage(state, "en", 2_000, { incrementUnread: false });

  assert.equal(result.state.unreadCount, 0);
  assert.equal(result.state.messageHistory.length, state.messageHistory.length + 1);
  assert.equal(result.state.messageHistory.at(-1)?.id, result.message.id);
});

runCase("migration can be re-evaluated on later interactions in accelerated test mode", () => {
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

runCase("vague destination requests match by tags before fallback", () => {
  const seaReply = generateCompanionReply("go to the seaside", readyState(), "en", 5_000);
  const quietReply = generateCompanionReply("go somewhere quiet with temples", readyState(), "en", 6_000);

  assert.equal(seaReply.state.currentLocationId, "reykjavik");
  assert.equal(quietReply.state.currentLocationId, "kyoto");
});

runCase("reply commit merges onto latest state instead of overwriting newer changes", () => {
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

runCase("reply merge replaces matching local message ids with enhanced content", () => {
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

runCase("sending a user message commits an agent response immediately", () => {
  const state = readyState({
    messageHistory: [createAgentMessage("text", "Before leaving", "Before leaving", 1_100)],
  });

  const committed = commitCompanionUserMessage("what are you doing", state, "en", 1_800);
  const newMessages = committed.messageHistory.slice(state.messageHistory.length);

  assert.equal(newMessages[0]?.sender, "user");
  assert.equal(newMessages.some((message) => message.sender === "agent"), true);
  assert.equal(committed.unreadCount, 0);
});

runCase("visual action follows the current city local time", () => {
  const kyotoLunchUtc = Date.UTC(2026, 5, 29, 3, 0, 0);
  const kyotoNightUtc = Date.UTC(2026, 5, 29, 13, 0, 0);

  const lunchState = generateCompanionReply("what did you eat", readyState({ currentLocationId: "kyoto" }), "en", kyotoLunchUtc).state;
  const nightState = generateCompanionReply("what did you eat", readyState({ currentLocationId: "kyoto" }), "en", kyotoNightUtc).state;

  assert.equal(getCompanionLocalTimeInfo(lunchState, kyotoLunchUtc).hour, 12);
  assert.equal(getCompanionAction(lunchState, kyotoLunchUtc), "food");
  assert.equal(getCompanionLocalTimeInfo(nightState, kyotoNightUtc).hour, 22);
  assert.equal(getCompanionAction(nightState, kyotoNightUtc), "sleepy");
});

runCase("rotating snippets vary by cursor for status, food, and photo", () => {
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
