# Test plan

Priority: **P1** blocks a release, **P2** should be fixed soon, **P3** polish.

| Area          | Case                                                                            | Priority | Spec                              |
| ------------- | ------------------------------------------------------------------------------- | -------- | --------------------------------- |
| Availability  | API health returns the documented body                                          | P1       | `api/health`                      |
| Availability  | Health answers within the latency budget                                        | P2       | `api/health`                      |
| Security      | Protected routes reject missing, malformed and forged tokens                    | P1       | `api/auth`                        |
| Security      | Diagnostic endpoints are disabled in production                                 | P1       | `api/health`                      |
| Security      | CORS allows only the product origins                                            | P1       | `api/cors`                        |
| Public links  | Unknown gallery and invoice tokens return a clean 404                           | P1       | `api/public-endpoints`            |
| Public links  | Selection submission rejects malformed, empty and oversized input               | P1       | `api/public-endpoints`            |
| Access        | Anonymous visitors cannot open the workspace                                    | P1       | `e2e/auth-guard`                  |
| Access        | Sign-in and registration forms validate input before sending                    | P2       | `e2e/auth-guard`                  |
| Navigation    | Every public page loads without console or first-party errors                   | P1       | `e2e/navigation`                  |
| Navigation    | Internal links resolve                                                          | P2       | `e2e/navigation`                  |
| Client links  | Gallery, legacy token and invoice pages handle a bad token gracefully           | P1       | `e2e/gallery-link`                |
| Localisation  | Language toggle switches copy, persists and sets `html[lang]`                   | P2       | `e2e/i18n`                        |
| Pricing       | Three plans render, prices are well-formed and consistent with the landing page | P2       | `e2e/pricing`                     |
| SEO           | Descriptions, canonical, robots.txt and sitemap.xml are correct and resolve     | P2       | `e2e/seo`                         |
| Responsive    | No horizontal scroll at 320, 360, 390, 768, 1280, 1920px                        | P2       | `e2e/responsive`                  |
| Accessibility | No serious or critical axe violations beyond tracked defects                    | P1       | `e2e/a11y`                        |
| Known defects | QA-001 to QA-008 reproduce until fixed                                          | n/a      | `e2e/known-defects`, `responsive` |
| Load          | p95 under 1.5s for health and 2.5s for pages at 5 VUs                           | P3       | `load/smoke.js`                   |
