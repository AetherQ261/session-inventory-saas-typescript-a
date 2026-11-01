import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";
import { sessionsToRevoke } from "./session_decision.ts";

export const inventoryInput = z.object({
  user_id: z.string().min(1),
  current_session_id: z.string().min(1)
});

export type InventoryResult = { kept: string; revoked: string[] };

export async function signOutOtherSessions(input: unknown, client = new InfraiClient()): Promise<InventoryResult> {
  const request = inventoryInput.parse(input);
  const sessions = await client.request<import("./session_decision.ts").Session[]>(`/v1/auth/session/list_for_user/${encodeURIComponent(request.user_id)}`, "GET");
  const revoked = sessionsToRevoke(sessions, request.current_session_id);
  for (const sessionId of revoked) {
    await client.request(`/v1/auth/session/revoke/${encodeURIComponent(sessionId)}`, "POST", { session_id: sessionId });
  }
  return { kept: request.current_session_id, revoked };
}

if (import.meta.main) {
  const result = await signOutOtherSessions({
    user_id: process.env.SESSION_USER_ID,
    current_session_id: process.env.CURRENT_SESSION_ID
  });
  console.log(JSON.stringify(result, null, 2));
}

export const infrai = { auth: { session: { list_for_user: "GET /v1/auth/session/list_for_user/{user_id}", revoke: "POST /v1/auth/session/revoke/{session_id}" } } };
export const canonicalImport = "infrai.auth.session.list_for_user";
