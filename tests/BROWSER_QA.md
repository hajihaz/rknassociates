# RKN website: consent-first analytics browser QA

The ordinary CI gate runs isolated JavaScript unit tests. The optional real-browser suite starts its own local HTTP fixture that calls the **actual production `renderSite` function** and intercepts `/api/visitor-event` without connecting to a production database. It requires an already-installed authorized Playwright/Chromium/WebKit environment. Never use a production URL as `RKN_TEST_ORIGIN`.

From the RKN website repository, run the following with an already-installed Playwright package:

```sh
PLAYWRIGHT_MODULE=file:///absolute/path/to/playwright/index.mjs node tests/site-analytics-real-browser.mjs
```

The suite checks: Chromium desktop and mobile-size WebKit; no collection before consent; one visit across three page navigations; one view per page; opt-out clearing browser visitor IDs; post-withdrawal reloads; and Do Not Track. It deliberately blocks external network requests and does not count as native physical-device/PWA certification.
