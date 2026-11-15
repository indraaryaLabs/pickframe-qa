# pickframe-qa

[![QA](https://github.com/indraaryaLabs/pickframe-qa/actions/workflows/qa.yml/badge.svg)](https://github.com/indraaryaLabs/pickframe-qa/actions/workflows/qa.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Black-box quality suite for [PickFrame](https://pickframe.satuarah.click), a SaaS for photographers that handles client galleries, selections and invoices. It tests the deployed product the way a visitor and an API client meet it: HTTP contracts, real browser journeys, accessibility and load.

It runs on every push, on every pull request and once a day against production, so a regression in the live product shows up without anyone looking.

## What it covers

| Layer            | Project / tool                             |  Tests |
| ---------------- | ------------------------------------------ | -----: |
| API contract     | Playwright `request`, project `api`        |     61 |
| Browser journeys | Playwright, project `e2e-desktop` (Chrome) |    103 |
| Touch devices    | Playwright, project `e2e-mobile` (Pixel 7) |      3 |
| Accessibility    | axe-core, WCAG 2.2 AA, 7 pages             | in e2e |
| Load             | k6, 5 virtual users, manual workflow       |      1 |

Highlights:

- **Security-minded API checks**: forged, unsigned and wrongly signed JWTs are rejected, the CORS allow-list never echoes an unlisted origin or uses a wildcard with credentials, diagnostic endpoints are disabled, oversized bodies are refused.
- **Journeys that matter to a customer**: anonymous visitors cannot reach the workspace, forms validate before sending, bad gallery and invoice links fail with a clear message, ID/EN switching persists.
- **Responsive and accessible**: no sideways scroll from 320px to 1920px, WCAG 2.2 AA audit of every public page.
- **Defects are tracked, not hidden**: each confirmed bug is an expected-failure test that asserts the correct behaviour. The run stays green while it is open and turns red the moment someone fixes it without removing the marker.

## Findings so far

Eight defects found in production, each with evidence and a suggested fix.

| ID                                | Summary                                                    | Severity |
| --------------------------------- | ---------------------------------------------------------- | -------- |
| [QA-001](docs/findings/QA-001.md) | Unknown URLs show the "gallery could not load" error       | Major    |
| [QA-002](docs/findings/QA-002.md) | Document title repeats the brand ("PickFrame · PickFrame") | Minor    |
| [QA-003](docs/findings/QA-003.md) | Every unknown URL declares the home page as canonical      | Minor    |
| [QA-004](docs/findings/QA-004.md) | Gallery error exposes a status code, partly English        | Minor    |
| [QA-005](docs/findings/QA-005.md) | Missing assets return the HTML app shell instead of 404    | Minor    |
| [QA-006](docs/findings/QA-006.md) | Low-contrast text on landing, pricing and sign-in          | Major    |
| [QA-007](docs/findings/QA-007.md) | Button accessible names omit their visible text            | Minor    |
| [QA-008](docs/findings/QA-008.md) | Pricing and guide pages scroll sideways on small phones    | Minor    |

## Getting started

Requires Node.js 20 or newer.

```bash
npm ci
npx playwright install chromium
npm test
```

Open the HTML report with `npm run report`.

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm test`          | All Playwright projects                             |
| `npm run test:api`  | API contract tests only                             |
| `npm run test:e2e`  | Browser tests, desktop and mobile                   |
| `npm run test:a11y` | Accessibility audit only                            |
| `npm run load`      | k6 smoke test (needs [k6](https://k6.io) installed) |
| `npm run verify`    | Typecheck, lint and format check                    |

### Pointing it somewhere else

The defaults target production. Override them to test a preview or a local build:

```bash
PICKFRAME_WEB_URL=http://localhost:5173 \
PICKFRAME_API_URL=http://localhost:8080 \
npm test
```

See [.env.example](.env.example) for every variable. Set `PW_CHANNEL=chrome` to use an installed Chrome instead of downloading Chromium.

## Project layout

```
tests/
  api/        HTTP contract tests
  e2e/        browser journeys, SEO, i18n, responsive, accessibility, known defects
  support/    environment, JWT helpers, page guards
load/         k6 smoke script
docs/
  test-strategy.md   scope, principles, gates
  test-plan.md       cases by area and priority
  findings/          one write-up per defect
  adr/               architecture decisions
.github/workflows/   CI (qa.yml) and manual load run (load.yml)
```

## Design decisions

- **Black box, public repo, private product.** The suite never imports application code. See [ADR 0001](docs/adr/0001-black-box-against-deployed-env.md).
- **Gentle on a shared free-tier backend.** CI uses two workers, failed magic-link lookups are kept under the API's rate limit, and the load test is small and manual.
- **No fixed sleeps.** Tests wait for a visible state. Helpers wait for the document title and animations to settle, which removes the usual source of flakiness.
- **Third-party noise is separated from first-party failures.** A blocked web font does not fail a journey test.

More in [docs/test-strategy.md](docs/test-strategy.md).

## CI

[`qa.yml`](.github/workflows/qa.yml) runs static checks first, then the API and browser jobs in parallel. Reports and traces are uploaded as artifacts for 14 days. The load run is a manual workflow so nobody hammers a free-tier service by accident.

## License

[MIT](LICENSE)
