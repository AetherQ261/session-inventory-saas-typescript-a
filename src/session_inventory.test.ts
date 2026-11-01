import test from "node:test";
import assert from "node:assert/strict";
import { sessionsToRevoke } from "./session_decision.ts";

test("keeps the browser session and selects every other active session", () => {
  const sessions = [
    { session_id: "laptop" },
    { session_id: "phone" },
    { session_id: "tablet" }
  ];
  assert.deepEqual(sessionsToRevoke(sessions, "phone"), ["laptop", "tablet"]);
});
