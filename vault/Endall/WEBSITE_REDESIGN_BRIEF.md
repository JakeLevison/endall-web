# Endall Website Redesign Brief

**Date:** 2026-04-03
**Auditor:** Claude Opus 4.6
**Codebase:** /home/jakob/endall-web/src/
**Product state:** 8 working preset actions, 325 tests green, chat persistence, file storage, conversation history

---

## Executive Summary

The site is well-built technically -- clean dark theme, responsive, good animations, no broken pages. But it undersells the product. The hero communicates "we answer your phone" when the product is now a full AI operations platform with financial modeling, proposals, estimates, competitive analysis, and document generation. The feature cards mention these capabilities but bury them below the fold behind call answering. The demo form is solid but has no social proof, no urgency, and no way to try the product without booking a call.

The biggest single issue: **the site was designed for a phone-answering product, but the product is now an operations platform.** The messaging hierarchy needs to flip.

---

## Brand Compliance Audit

| Rule | Status | Notes |
|------|--------|-------|
| "Endall" not "Endall AI" | PASS | No violations found |
| "Founder" not "Co-Founder" | PASS | Team.tsx line 20: "Founder & CEO" |
| No "handles/handling" | PASS | No violations in marketing copy |
| No "software" | PASS | Clean |
| No "built for the buildout" | PASS | Not present |
| No Kunaal mentions | PASS | Not present |
| Positioning as "operations platform" | PARTIAL | Hero says "front office" -- closer to "answering service" framing |

---

## Critical Issues (Fix Before Next Demo)

### 1. Privacy & Terms links are dead

**Current:** Footer links Privacy (#) and Terms (#) point to `href="#"` -- no pages exist.
**File:** `src/components/sections/Footer.tsx:37-38`
**Impact:** Trust-killer for B2B buyers. MEP contractor owners (35-55) doing diligence will click these.
**Fix:** Create `/privacy` and `/terms` pages with standard B2B SaaS language.
**Skill:** Manual (legal copy) + react-components (page scaffold)
**Effort:** Quick fix
**Conversion impact:** HIGH -- dead legal links kill trust instantly

### 2. Hero CTA goes to /dashboard, not /demo

**Current:** "See How It Works" button links to `/dashboard` (the logged-in app).
**File:** `src/components/hero/HeroHeadline.tsx:158-179`
**Impact:** Cold visitors land in a dashboard that requires context. This is not a demo -- it's a product login. Conversion path breaks.
**Fix:** Change CTA to "Request a Demo" linking to `/demo`, or add a secondary "Try Ask Endall" button that goes to a public demo sandbox.
**Skill:** Manual (1-line href change)
**Effort:** Quick fix
**Conversion impact:** HIGH -- primary CTA sends visitors to wrong destination

### 3. Dashboard sidebar shows CRM features that don't exist

**Current:** App sidebar lists Contacts, Companies, Deals, Sequences, Workflows, Tasks, Reports, Outreach -- 8 CRM modules with full page implementations.
**File:** `src/app/(app)/layout.tsx` sidebar nav items
**Impact:** These pages exist but are not part of the core product promise (Ask Endall). If shown to prospects in a demo, they set expectations for CRM functionality. If they're empty for new users, they look broken.
**Fix:** Either hide non-Ask-Endall sidebar items behind a feature flag, or ensure they have meaningful empty states that don't promise more than delivered.
**Skill:** Manual
**Effort:** Medium
**Conversion impact:** MEDIUM -- sets wrong expectations during demo

---

## Hero Section

### 4. Tagline mispositions the product

**Current:** "Your front office, fully staffed"
**File:** `src/components/hero/HeroHeadline.tsx:65`
**Recommended:** "Your AI ops team" or "The AI operations team for MEP contractors"
**Why:** "Front office" sounds like receptionist/answering service. The product now builds financial models, proposals, estimates, competitive analyses. "Ops team" captures the full scope.
**Skill:** Manual (copy change)
**Effort:** Quick fix
**Conversion impact:** HIGH -- first 5 seconds of comprehension

### 5. Headline word carousel buries the best features

**Current:** Rotates through: Calls, Leads, Front Office, Budgets, Follow-ups, Proposals, Scheduling
**File:** `src/components/hero/HeroHeadline.tsx:6`
**Issue:** Opens with "Calls" -- the commodity feature. Budgets and Proposals (the differentiated features) are words 4 and 6 in a 7-word cycle. Visitors see 1-2 words max before scrolling.
**Recommended:** Reorder to lead with differentiation: `["Operations", "Proposals", "Budgets", "Estimates", "Front Office", "Follow-ups", "Calls"]` or replace carousel with a single clear statement.
**Skill:** Manual (reorder array)
**Effort:** Quick fix
**Conversion impact:** HIGH -- first impression

### 6. Subheadline is too long and buries the lead

**Current:** "Endall answers your calls, qualifies your leads, books your jobs, briefs you every morning, and builds financial models, proposals, and capabilities docs on demand."
**File:** `src/components/hero/HeroHeadline.tsx:154`
**Issue:** 30 words. Leads with call answering. Financial models and proposals -- the real differentiators -- are at the end.
**Recommended:** "Financial models, proposals, project estimates, and competitive analysis -- plus call answering, lead qualification, and morning briefings. One AI ops team runs your entire front office." (Lead with what's unique, close with what's expected.)
**Skill:** Manual (copy)
**Effort:** Quick fix
**Conversion impact:** HIGH

---

## Features Section

### 7. Feature cards don't map 1:1 to working product actions

**Current 8 cards:** Calls, Qualification, Booking, Briefings, Financial Models, Proposals & Docs, Speed, Control
**Working 8 actions:** Financial Model, Budget, Capabilities Doc, NPV Analysis, Project Estimate, Proposal, Competitive Analysis, Review Financials

**Mismatch:** "Speed" and "Control" are value props, not features. Budget, NPV, Competitive Analysis, Review Financials, and Project Estimate are real working features with no dedicated cards.
**Recommended:** Replace Speed/Control with real feature cards. Map each card to one or more working actions:

| Card | Maps To |
|------|---------|
| Calls | (voice agent -- separate system) |
| Lead Qualification | (voice agent logic) |
| Job Booking | (calendar integration) |
| Morning Briefings | (briefing agent) |
| Financial Models & Budgets | financial_model, generate_budget |
| Project Estimates & Proposals | project_estimate, proposal |
| Competitive Analysis | competitive_analysis |
| Financial Reviews & NPV | review_financials, npv_analysis |

Or consolidate to 6 cards (drop Calls/Qualification/Booking into a single "Front Office" card) and give each AI document action its own card.

**Skill:** ui-ux-pro-max (card layout), react-components (new card mocks)
**Effort:** Medium
**Conversion impact:** HIGH -- features section is the decision zone

### 8. Section headline "The front office you never had to hire" reinforces wrong frame

**Current:** `src/app/page.tsx:148`
**Recommended:** "Everything your operations team should be doing" or "8 actions. Zero busywork."
**Skill:** Manual
**Effort:** Quick fix
**Conversion impact:** MEDIUM

### 9. Feature mock components don't match feature content

**Current:** Financial Models card shows AIMock (chat bubbles). Proposals & Docs shows ReportsMock (bar chart). Speed shows AIMock again. Control shows ReportsMock again.
**File:** `src/app/page.tsx:56-78`
**Issue:** Mocks are decorative, not demonstrative. A contractor seeing the Financial Models card wants to see a spreadsheet preview, not chat bubbles.
**Recommended:** Replace mocks with actual product screenshots or simplified previews of real output (Excel preview for financial models, DOCX preview for proposals).
**Skill:** react-components (new mock components), possibly remotion (animated previews)
**Effort:** Medium
**Conversion impact:** MEDIUM -- builds trust that the product actually works

---

## How It Works Section

### 10. 4 steps should be 3 (or reframed)

**Current steps:** (1) We set up on your number, (2) Endall answers your calls, (3) You get a morning briefing, (4) Ask it anything
**Issue:** Steps 1-3 are about call answering. Step 4 ("Ask it anything") is where the real product lives -- financial models, estimates, proposals. It's literally the last step, described in one sentence.
**Recommended:** Reframe as 3 steps focused on the AI ops team:
1. "Tell us about your business" -- setup, service area, job types, company profile
2. "Endall runs your front office" -- calls answered, leads qualified, morning briefings
3. "Ask Endall to build anything" -- financial models, proposals, estimates, competitive analysis, capabilities docs. Show a grid of the 8 action buttons here.

**Skill:** ui-ux-pro-max (layout), react-components (step 3 with action grid)
**Effort:** Medium
**Conversion impact:** HIGH -- this is where comprehension clicks

### 11. "Up and running in days, not weeks" headline is generic

**Recommended:** "Three steps to a fully staffed operation" or "How it works"
**Skill:** Manual
**Effort:** Quick fix
**Conversion impact:** LOW

---

## Ask Endall Interface (Product)

### 12. Empty state is strong but uses emoji icons

**Current:** 8 QUICK_ACTIONS with emoji icons (clipboard, wrench, magnifying glass, etc.)
**File:** `src/hooks/useChat.ts:58-67`, rendered in `src/app/(app)/dashboard/ask-endall/page.tsx`
**Issue per ui-ux-pro-max rule `no-emoji-icons`:** "Use SVG icons, not emojis." Emoji render differently across OS/browser. A contractor on Windows Chrome sees different icons than Mac Safari.
**Recommended:** Replace emoji with Lucide icons (already in the project). Map: FileSpreadsheet for financial model, DollarSign for budget, FileText for capabilities doc, TrendingUp for NPV, Wrench for estimate, FileSignature for proposal, Search for competitive, ClipboardCheck for review.
**Skill:** react-components
**Effort:** Quick fix
**Conversion impact:** LOW (product UX, not marketing)

### 13. Conversation history sidebar hidden on mobile

**Current:** 240px sidebar with conversation history, no mobile equivalent.
**File:** `src/app/(app)/dashboard/ask-endall/page.tsx:55-140`
**Issue:** Mobile users lose access to conversation history entirely.
**Recommended:** Add Sheet drawer (already used in dashboard layout) for mobile conversation access.
**Skill:** react-components
**Effort:** Quick fix
**Conversion impact:** LOW (product UX)

### 14. My Files tab needs better empty state

**Current:** "No files generated yet" -- no guidance on what to do.
**Recommended:** "Generate your first file by choosing an action above. Endall creates Excel workbooks and Word documents you can download and edit." with a pointer to the actions.
**Skill:** Manual
**Effort:** Quick fix
**Conversion impact:** LOW

---

## Demo Form / CTA

### 15. No social proof anywhere on the demo page

**Current:** Two trust signals ("Built for MEP contractors", "Live in under a week") but no logos, testimonials, or numbers.
**File:** `src/app/demo/page.tsx:125-172`
**Recommended:** Add one of: (a) "Trusted by X contractors" with logos, (b) "325 automated workflows, tested and verified" (true -- our test count), (c) a short testimonial from an early user, (d) "8 document types generated instantly" with icons.
**Skill:** ui-ux-pro-max (social proof patterns), react-components
**Effort:** Quick fix
**Conversion impact:** HIGH -- social proof on demo pages directly lifts conversion

### 16. Demo confirmation page has no fallback if Calendly fails

**Current:** Single CTA: "Schedule Your Demo" linking to external Calendly.
**File:** `src/app/demo/confirmation/page.tsx`
**Recommended:** Add "Or email jake@endall.ai and we'll find a time" below the Calendly button.
**Skill:** Manual
**Effort:** Quick fix
**Conversion impact:** MEDIUM

### 17. No "try it now" path exists

**Current:** Only conversion path is Request a Demo (form + Calendly). No self-serve option.
**Issue:** Some prospects want to try before they talk to sales. The product works -- 8 actions, chat persistence, file downloads. Why not let them try?
**Recommended:** Add a "Try Ask Endall" CTA (secondary, below "Request a Demo") that links to a public demo sandbox with sample data pre-loaded. Even a read-only walkthrough video would help.
**Skill:** stitch-loop (demo sandbox page), or remotion (product demo video)
**Effort:** Full rebuild (sandbox) or Medium (video)
**Conversion impact:** HIGH -- self-serve trial is the highest-converting B2B SaaS pattern

---

## Team Page

### 18. Solo founder page looks thin

**Current:** Single team member (Jake Levison, Founder & CEO) with expandable bio.
**File:** `src/components/sections/Team.tsx`
**Issue:** One person on a team page signals early-stage risk to B2B buyers. The bio is strong but the page feels empty.
**Recommended options (pick one):**
- (a) Remove the team page from nav entirely. Replace with "About" that focuses on the company story, not headcount.
- (b) Keep Jake but add advisor/partner logos or "backed by" section.
- (c) Add a section below Jake: "Endall is powered by [X]" describing the AI infrastructure without naming people.

**Skill:** ui-ux-pro-max (page layout), react-components
**Effort:** Medium
**Conversion impact:** MEDIUM

---

## Visual Identity & Design System

### 19. Dark theme is correct for the audience -- keep it

The dark, minimal aesthetic (Geist Sans, #0a0a0a background, subtle borders) reads as "professional operations tool" not "consumer app." This is right for contractor owner-operators who use dark-themed fleet management and accounting tools. No change needed.

### 20. Color palette is entirely monochrome -- needs one accent

**Current:** White, grays, black. No brand color. The only color in the entire site is the blue in the Ask Endall sidebar (#3b82f6) and the sidebar-primary in dark mode (oklch blue).
**Recommended:** Pick one brand accent color (suggestion: a muted blue-green or amber that reads "contractor-grade, not SaaS-y") and use it for:
- Primary CTAs (currently white buttons on dark bg -- low contrast hierarchy)
- Feature card hover states
- Active nav states
- The Endall wordmark

**Skill:** ui-ux-pro-max (palette generation), design-md (document the system)
**Effort:** Medium
**Conversion impact:** MEDIUM -- consistent brand color improves recognition and CTA visibility

### 21. Inline styles everywhere -- no design system

**Current:** Almost all components use inline `style={{}}` objects instead of Tailwind classes or CSS modules. The project has shadcn/ui and Tailwind but the marketing pages don't use them.
**Files:** Every component in `src/components/hero/`, `src/components/sections/`, `src/components/features/`
**Issue:** Makes systematic design changes painful. To change heading size across the site, you'd edit 8+ files.
**Recommended:** Migrate marketing components to Tailwind utility classes matching the existing shadcn/ui pattern used in the app pages. Define shared text styles (heading-1, heading-2, body, caption, mono-label) as Tailwind components.
**Skill:** design-md (document system), react-components (migration)
**Effort:** Full rebuild (but can be done incrementally)
**Conversion impact:** LOW (developer experience, not user-facing)

### 22. Logo entrance animation is clever but delays content

**Current:** Full-screen "endall" logo fades in, holds for 2s, fades out, then the page appears.
**File:** `src/components/hero/LogoEntrance.tsx`
**Mitigation:** Session storage skip on repeat visits (good).
**Issue:** First-time visitors wait 2.6s before seeing any content. For a cold traffic source (ad, email link), this is lost attention.
**Recommended:** Cut to 1.2s total (faster fade, shorter hold). Or remove entirely and let the navbar logo serve as the brand moment.
**Skill:** Manual (timing constants)
**Effort:** Quick fix
**Conversion impact:** MEDIUM -- every second of delay before hero costs conversions

---

## Content Gaps

### 23. No pricing page or pricing signals

**Current:** Pricing section explicitly removed (comment in page.tsx line 18: "Pricing removed -- not showing pricing pre-launch").
**Issue:** B2B contractors want to know ballpark cost before booking a demo. "Custom pricing" is fine, but saying nothing implies either it's expensive or it's not ready.
**Recommended:** Add a simple pricing section: "Starting at $X/month" or "Pricing based on your team size -- see it in your demo" with the 3 trade/size tiers visible.
**Skill:** ui-ux-pro-max (pricing table patterns), react-components
**Effort:** Medium
**Conversion impact:** HIGH -- pricing transparency lifts demo requests

### 24. No case study, use case, or "how contractors use Endall" section

**Recommended:** Even without customer logos, add a section showing specific scenarios: "Your estimator asks Endall to estimate a 50-unit multifamily rewire. 30 seconds later: a 4-tab Excel workbook with labor, materials, subs, and schedule."
**Skill:** ui-ux-pro-max (use case layouts), stitch-loop (dedicated page)
**Effort:** Medium
**Conversion impact:** HIGH -- specificity converts B2B buyers

### 25. No SEO/meta content

**Current:** No meta descriptions, no Open Graph tags, no structured data visible in the layout.
**File:** `src/app/layout.tsx`
**Recommended:** Add metadata export with title, description, OG image for all marketing pages.
**Skill:** Manual
**Effort:** Quick fix
**Conversion impact:** MEDIUM (organic traffic + link sharing)

---

## Prioritized Implementation Order

| # | Item | Effort | Impact | Do First? |
|---|------|--------|--------|-----------|
| 2 | Hero CTA points to /dashboard instead of /demo | Quick | HIGH | YES |
| 4 | Tagline "front office" -> "AI ops team" | Quick | HIGH | YES |
| 5 | Reorder word carousel (differentiation first) | Quick | HIGH | YES |
| 6 | Shorten + reorder subheadline | Quick | HIGH | YES |
| 1 | Privacy & Terms pages (dead links) | Quick | HIGH | YES |
| 15 | Social proof on demo page | Quick | HIGH | YES |
| 22 | Shorten logo entrance animation | Quick | MEDIUM | YES |
| 25 | SEO meta tags | Quick | MEDIUM | YES |
| 10 | Reframe How It Works to 3 steps | Medium | HIGH | NEXT |
| 7 | Feature cards map to real actions | Medium | HIGH | NEXT |
| 23 | Pricing signals | Medium | HIGH | NEXT |
| 24 | Use case / scenario section | Medium | HIGH | NEXT |
| 17 | "Try it now" self-serve path | Medium-Full | HIGH | NEXT |
| 9 | Feature mocks show real output | Medium | MEDIUM | LATER |
| 20 | Brand accent color | Medium | MEDIUM | LATER |
| 18 | Team page -> About page | Medium | MEDIUM | LATER |
| 3 | Hide unused CRM sidebar items | Medium | MEDIUM | LATER |
| 8 | Features section headline | Quick | MEDIUM | LATER |
| 16 | Calendly fallback on confirmation | Quick | MEDIUM | LATER |
| 12 | Replace emoji with Lucide icons | Quick | LOW | LATER |
| 13 | Mobile conversation history drawer | Quick | LOW | LATER |
| 14 | My Files empty state copy | Quick | LOW | LATER |
| 11 | How It Works headline | Quick | LOW | LATER |
| 21 | Migrate inline styles to Tailwind | Full rebuild | LOW | LATER |
| 19 | Dark theme | -- | -- | KEEP |

---

## Quick Wins (can ship today, < 30 min each)

1. **`HeroHeadline.tsx:158`** -- Change `href="/dashboard"` to `href="/demo"`
2. **`HeroHeadline.tsx:65`** -- Change "Your front office, fully staffed" to "Your AI ops team"
3. **`HeroHeadline.tsx:6`** -- Reorder words array: `["Operations", "Proposals", "Budgets", "Estimates", "Front Office", "Follow-ups", "Calls"]`
4. **`HeroHeadline.tsx:154`** -- Rewrite subheadline to lead with differentiators
5. **`Footer.tsx:37-38`** -- Change Privacy/Terms from `#` to `/privacy` and `/terms`, create minimal pages
6. **`LogoEntrance.tsx`** -- Reduce hold phase from 2000ms to 800ms

---

## Skills Mapping

| Skill | Use For |
|-------|---------|
| **ui-ux-pro-max** | Palette, layout patterns, pricing table, social proof, use case section |
| **stitch-loop** | Full page generation (privacy, terms, use cases, demo sandbox) |
| **react-components** | New feature mocks, icon replacements, mobile drawer, card redesigns |
| **design-md** | Document the design system once accent color + typography are locked |
| **remotion** | Product demo video for "try it now" path |
| **Manual** | Copy changes, CTA fixes, meta tags, timing constants |
