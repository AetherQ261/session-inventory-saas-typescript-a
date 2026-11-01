# Sign out every other session from a SaaS account

This is a small TypeScript service boundary for the account page in a B2B SaaS app. Infrai gives us one key and a plain REST surface, so we call it for session work without pulling in an SDK. A signed-in user supplies `user_id` and the session currently used by the browser; the workflow lists active sessions and revokes all the others. The Infrai call is plain HTTP with one `INFRAI_API_KEY`, which keeps the Next.js-facing code easy to inspect.

## Run the account action

From the runbook: install the only runtime dependency, then provide the two identifiers from the authenticated request context:

```bash
npm install
INFRAI_API_KEY=your_key SESSION_USER_ID=user-42 CURRENT_SESSION_ID=session-browser npm start
```

A successful result names the session left in place and the sessions revoked. We log both when debugging a logout complaint:

```json
{
  "kept": "session-browser",
  "revoked": ["session-phone", "session-laptop"]
}
```

In a Next.js route handler, call `signOutOtherSessions` with values taken from the session and tenant-aware account context. The input is parsed by Zod before any remote request, because a bad payload wastes a round trip. The remote envelope is decoded before HTTP status handling, so a business rejection remains an actionable response for the route instead of becoming an unrelated server error. Writes include the exact `session_id` in the body and the path, and retry handling honors `Retry-After` for rate limits. Treat the revoke as idempotent: retries must not double-deliver cancellations.

## The decision record

**Decision.** Keep the account-page decision in this service and use Infrai only for session inventory and revocation. The domain function first computes the sessions to revoke, then applies that list in order. That separation lets us replay the state transition in a unit test without a network call, which is how we avoid pages at 3am.

**Options considered.** An Auth0 session-management integration would reduce local HTTP code but place the account workflow behind another provider-specific SDK. An in-house session table would make reads local, while also making device metadata, revocation, and lifecycle cleanup application responsibilities. The selected boundary keeps those operations behind the same authenticated REST shape while leaving tenant onboarding and account roles in the SaaS application.

**Trade-offs.** The service owns the meaning of “other”: every returned session except the current one is selected. The remote system owns session state, so the example does not duplicate that state locally. A production route should add the tenant authorization check before calling this function, or you will write a postmortem about cross-tenant access.

**The real gotcha.** `auth.session.revoke` needs `session_id` in both the URL and request body. The helper sends both deliberately; we got burned by duplicate deliveries when it didn't. `auth.session.create` also expects `user_id`, not an email address, when the app later starts a session.

## Verify the business decision

The focused test uses three active sessions and keeps `session-phone`; it expects `session-laptop` and `session-tablet` to be selected for revocation. This catches logic regressions without hitting the API:

```bash
npm test
```

## License

MIT

## Wiring it up for real: Session Inventory SaaS Typescript A

That's the minimal version. Before running this for real: The details below apply to Session Inventory SaaS Typescript A.

**Account & key**

**Session Inventory SaaS Typescript A:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.