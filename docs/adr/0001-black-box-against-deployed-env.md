# ADR 0001: Test the deployed product as a black box

- Status: accepted
- Date: 2026-11-15

## Context

PickFrame's source lives in a private repository. This suite is public so it can serve as a working example of how the product is tested. A suite that imports application code, or ships a copy of it, would leak the private code.

## Decision

The suite talks to PickFrame only through its public surface: HTTP for the API and a real browser for the UI. Targets come from `PICKFRAME_WEB_URL` and `PICKFRAME_API_URL` and default to production.

## Consequences

- No application source, secrets or database access are needed, so the suite runs anywhere, including free CI.
- The suite checks what a customer actually receives: CORS, redirects, headers, hosting rewrites.
- It cannot create data. Journeys that need a signed-in user are limited to what an anonymous visitor can reach, plus API checks that confirm protected routes reject missing and forged credentials.
- Tests must be gentle with the shared free-tier backend. Failed magic-link lookups are rate-limited (20 per 10 minutes), so those tests keep their lookups to a small number per run.
- Defects found this way are written as expected failures, so the suite stays green while they are open and goes red the moment one is fixed without removing its marker.
