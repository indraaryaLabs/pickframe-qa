# Test strategy

## Goal

Give fast, trustworthy answers to two questions after every change and every night: is PickFrame up, and can a visitor still do what they came to do?

## Scope

| Layer            | What is checked                                                                                                                       | Tool                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| API contract     | Health, authentication guard, forged and malformed tokens, CORS allow-list, public link endpoints, input validation                   | Playwright `request` |
| Browser journeys | Public navigation, auth guard on the workspace, sign-in and registration forms, pricing consistency, client gallery and invoice links | Playwright, Chromium |
| Language switch  | ID/EN toggle, persistence, `html[lang]`, FAQ state                                                                                    | Playwright           |
| SEO              | Descriptions, canonical, robots.txt, sitemap.xml                                                                                      | Playwright           |
| Responsive       | No horizontal scroll from 320px to 1920px, touch target size                                                                          | Playwright, Pixel 7  |
| Accessibility    | WCAG 2.2 AA via axe-core on seven public pages, keyboard entry                                                                        | axe-core             |
| Load             | 5 virtual users for 70 seconds against the public surface                                                                             | k6 (manual workflow) |

Out of scope: anything behind sign-in, payments, and any write that would create data in production. See ADR 0001.

## Principles

1. **Black box.** Only public interfaces are used.
2. **Deterministic.** No fixed sleeps. Tests wait for a visible state, and the page-title and animation helpers wait for stability.
3. **Cheap on the target.** The backend is free-tier and shared. Workers are capped in CI and the load test is manual and small.
4. **Defects are first-class.** A confirmed defect becomes an expected-failure test (`test.fail`) that asserts the correct behaviour, with a write-up in `docs/findings/`.
5. **Fail for the right reason.** Assertions name what is wrong, and third-party failures (fonts, analytics) are reported separately from first-party ones.

## Gates

| Trigger                      | Runs                               |
| ---------------------------- | ---------------------------------- |
| Pull request, push to `main` | Static checks, API, browser        |
| Daily at 03:17 UTC           | Same, to catch drift in production |
| Manual                       | Load smoke                         |

## Risks

- A production outage fails the suite for reasons unrelated to a change. The failing job name shows which layer broke.
- The daily run depends on a free-tier backend that can be cold. Latency budgets are deliberately loose.
