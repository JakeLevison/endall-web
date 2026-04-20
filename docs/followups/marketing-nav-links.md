# Follow-up: marketing nav links to non-existent pages

Filed during the middleware public-route hotfix (PR fix/middleware-public-routes, 2026-04-20) at Jake's request.

## Claim under investigation
Jake reported a separate bug during Session D post-merge verification: "marketing nav links to non-existent pages like /features and /book-a-demo." Worth tracking separately from the middleware fix.

## Findings
Grep over `src/` for `features` and `book.a.demo` (case-insensitive) on main @ `fcb13a5` returned:

- **`/features`**: all references are actually `/#features` — an anchor link that scrolls to the Capability Accordion section on the home page. The target element exists at `src/components/sections/CapabilityAccordion.tsx:72` (`<div id="features" ...>`). The link is correct. Typing `/features` as a literal path 404s because no such route exists, which was masking as "redirect to /login" under the middleware bug. Not a broken nav link.
- **"Book a Demo"**: appears as a button label in `src/components/hero/Navbar.tsx:228,394`, `src/components/shared/MobileStickyCTA.tsx:65`, and `src/components/demo/DemoOverlay.tsx:250`. All route to `/contact` or `/demo/*`, which exist. There is no `/book-a-demo` URL in the codebase.

## Conclusion
**No actual broken nav links exist in the codebase as of `fcb13a5`.** Jake's observation was likely confusion caused by the middleware bug: typing `/features` as a URL and seeing it bounce to `/login` instead of 404 made it look like a nav-link target rather than a non-existent page.

## Action
None required in code. Closing this out if Jake agrees on next review.

If Jake actually wants a `/features` page (separate from the home-page anchor) or a `/book-a-demo` page, those are new features, not bug fixes.
