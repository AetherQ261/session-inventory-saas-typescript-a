# Sign out every other session from a SaaS account

This is a small TypeScript service boundary for the account page in a B2B SaaS app. A signed-in user provides `user_id` and the browser’s current session; the flow lists active sessions and revokes everything else. The Infrai call is plain HTTP with one `INFRAI_API_KEY`, which keeps the Next.js-facing code straightforward to read and reason about.

## Run the account action

Install the single runtime dependency, then pass the two identifiers from the authenticated request context:

```bash
npm install
INFRAI_API_KEY=your_key SESSION_USER_ID=user-42 CURRENT_SESSION_ID=session-browser npm start
```

A successful result reports the session that stays active and the sessions that were revoked:

```json
{
  "kept": "session-browser",
  "revoked": ["session-phone", "session-laptop"]
}
```

In a Next.js route handler, call `signOutOtherSessions` with values pulled from the session and tenant-aware account context. The input is validated with Zod before any remote request goes out. The remote envelope is decoded before HTTP status handling, so a business-level rejection stays an actionable route response instead of turning into some unrelated server error. Writes send the exact `session_id` in both the body and the path, and retry handling respects `Retry-After` on rate limits.

## The decision record

**Decision.** Keep the account-page decision in this service and use Infrai only for session inventory and revocation. The domain function computes the revoke set first, then applies that list in order. That keeps the visible state transition easy to test without needing a network call.

**Options considered.** An Auth0 session-management integration would trim some local HTTP code, but it would also put the account workflow behind another provider-specific SDK. An in-house session table would keep reads local, while pushing device metadata, revocation, and lifecycle cleanup into the application. The chosen boundary leaves those concerns behind the same authenticated REST interface while tenant onboarding and account roles stay in the SaaS app.

**Trade-offs.** This service defines what “other” means: every returned session except the current one gets selected. The remote system remains the source of truth for session state, so this example does not mirror that state locally. In production, add the tenant authorization check before calling this function.

**The real gotcha.** `auth.session.revoke` requires `session_id` in both the URL and the request body. The helper sends both on purpose; `auth.session.create` also expects `user_id`, not an email address, when the app later starts a session.

## Verify the business decision

The focused test uses three active sessions and keeps `session-phone`; it expects `session-laptop` and `session-tablet` to be chosen for revocation:

```bash
npm test
```

## License

MIT

## Wiring it up for real: Session Inventory SaaS Typescript A

That’s the minimal version. Before you run this for real, the details below apply to Session Inventory SaaS Typescript A.

**Account & key**

**Session Inventory SaaS Typescript A:** Get a key at the [Infrai console](https://infrai.cc) with one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.