# Endall Feature Audit — Ask Endall Interface + Site-Wide

Generated: 2026-04-03

---

## STEP 1: INVENTORY — Ask Endall Preset Actions

### 8 Quick Action Buttons

| # | Action ID | Label | Current State | Output Type | Frontend | Backend | Template |
|---|-----------|-------|---------------|-------------|----------|---------|----------|
| 1 | `npv_analysis` | Analyze project returns | **FUNCTIONAL** (just rebuilt) | .xlsx (4 tabs, 268 formulas) | ChatPanel.tsx:37, page.tsx:53 | server.py TEMPLATE path | templates/npv.py |
| 2 | `generate_budget` | Generate a budget | Template path, formula-driven | .xlsx (single tab, Budget/Actual/Var) | ChatPanel.tsx:34, page.tsx:51 | server.py TEMPLATE path | templates/budget.py |
| 3 | `financial_model` | Build a financial model | Skills API, AI generates file | .xlsx (5 tabs spec'd in engine.py) | ChatPanel.tsx:32, page.tsx:50 | engine.py Skills API, Opus model | None (AI-generated) |
| 4 | `capabilities_doc` | Create a capabilities doc | Skills API, zero-input | .pptx or .pdf | ChatPanel.tsx:35, page.tsx:52 | engine.py Skills API, Sonnet 4.5 | None (AI-generated) |
| 5 | `project_estimate` | Estimate a project | Skills API, intake then generate | .xlsx | ChatPanel.tsx:38, page.tsx:54 | engine.py Skills API, Sonnet 4.5 | None (AI-generated) |
| 6 | `proposal` | Draft a proposal | Skills API, intake then generate | .docx or .pdf | ChatPanel.tsx:39, page.tsx:55 | engine.py Skills API, Sonnet 4.5 | None (AI-generated) |
| 7 | `competitive_analysis` | Research competitors | Skills API, web search | .pdf report | ChatPanel.tsx:40, page.tsx:56 | engine.py Skills API, Opus | None (AI-generated) |
| 8 | `review_financials` | Review my financials | Skills API, 4-phase workflow | .pdf summary | ChatPanel.tsx:41, page.tsx:57 | engine.py Skills API, Opus | None (AI-generated) |

### Routing Logic (server.py:349-523)

Two paths:
- **Template path** (`generate_budget`, `npv_analysis`): Claude does intake conversation only, parses JSON, calls Python template. Zero AI tokens for file generation. Sub-second.
- **Skills API path** (everything else): Full AI + Anthropic Skills (xlsx/pptx/docx/pdf). Uses `engine.py` AskEndall class with pause_turn loops. 30-120 seconds. Model routed via `select_model()`.

### Model Routing (engine.py:49-54)

| Model | Actions |
|-------|---------|
| Opus | financial_model, competitive_analysis, npv_analysis, review_financials, swot_analysis |
| Sonnet 4.5 | generate_budget, project_estimate, capabilities_doc, proposal, brochure |
| Sonnet 4 | Default / plain chat |

---

## STEP 2: CORE FUNCTIONALITY AUDIT

### A. Chat Persistence — BROKEN

**Current state:** React useState only. No localStorage, no Supabase, no sessionStorage.

**What happens on F5:** Everything gone. Messages, workflow state, file references, conversation context -- all lost.

**Session ID:** Generated as `"web-" + window.location.hostname` (ChatPanel.tsx). This is stable across refreshes but the conversation history isn't persisted anywhere.

**Bridge side:** In-memory dict `_template_sessions` (server.py:343) and `_sessions` (server.py:47). Also lost on Railway redeploy.

**What needs to happen:**
1. Frontend: persist messages to localStorage on every update, restore on mount
2. Bridge: persist conversations to Supabase `conversations` table (needs migration)
3. "New Chat" button: clear localStorage + create new session_id
4. File references within messages need to survive refresh (they use bridge URLs which are stable if bridge hasn't redeployed)

**Files involved:**
- `src/components/chat/ChatPanel.tsx` (state at lines 59-75)
- `src/app/(app)/dashboard/ask-endall/page.tsx` (state at lines 68-86)
- `deploy/ask-endall-bridge/server.py` (session dicts at lines 47-48, 343-344)

---

### B. My Files — PARTIAL

**Current state:** The tab exists and fetches from `GET ${BRIDGE_URL}/files`. Metadata is saved to Supabase `generated_files` table on every file generation (server.py:109-127).

**What works:**
- Files are listed with name, description, workflow, created_at
- Download links point to `${BRIDGE_URL}/download/{file_id}`
- Fallback to Anthropic Files API if bridge file missing

**What's broken:**
- **File binary storage is ephemeral.** Files live on Railway's temp filesystem (`/tmp/ask-endall-files/`). On redeploy, all binaries are gone. Metadata in Supabase survives but downloads 404.
- **No user upload.** Files are AI-generated only, no manual upload capability.
- **No organization.** Flat list, no folders, no search, no bulk actions.
- **No file preview for non-xlsx types** (preview_html only generated for Excel files).

**What needs to happen:**
1. Upload file binaries to Supabase Storage bucket `generated-files` (private)
2. Update download endpoint to fetch from Supabase Storage
3. Remove dependency on `_file_registry` in-memory dict
4. Add user file upload capability (optional, lower priority)

**Files involved:**
- `deploy/ask-endall-bridge/server.py` (lines 48, 109-127, 540-581, 584-597)
- `src/components/chat/ChatPanel.tsx` (files tab, lines 85-92, 395-458)
- `src/app/api/chat/download/route.ts` (proxy, lines 10-77)

---

### C. Contact Form — FUNCTIONAL

**Location:** `/contact` page, submits to `/api/contact-submit`

**What works:**
- Form validates and submits
- Inserts to Supabase `contact_submissions` table
- Sends email notification via Resend to jake@endall.ai + levison1995@gmail.com
- Error handling with fallback display

**What's missing:**
- No connection to CRM (submissions don't create contacts in `contacts` table)
- No auto-reply to the submitter
- No Obsidian vault integration
- Resend API key may be a placeholder (check `.env.local`)

**Files:** `src/app/contact/page.tsx`, `src/app/api/contact-submit/route.ts`

---

### D. Demo Request Form — FUNCTIONAL

**Location:** `/demo` page, submits to `/api/demo-submit`

**What works:**
- Full form with trade/team size dropdowns
- Inserts to Supabase `demo_requests` table
- Sends email notification via Resend
- Redirects to `/demo/confirmation` with Calendly link

**What's missing:**
- No CRM integration (demo requests don't create contacts/deals)
- No automated follow-up sequence trigger
- Calendly is an external link (not embedded)

**Files:** `src/app/demo/page.tsx`, `src/app/api/demo-submit/route.ts`, `src/app/demo/confirmation/page.tsx`

---

### E. Other Interactive Elements

| Element | Location | Status |
|---------|----------|--------|
| **Email Compose** | ComposeDialog.tsx | Proxies to COS API `/api/gmail`. Works if COS is running. |
| **Gmail Sync** | EmailPanel.tsx | Proxies to COS API. Works if COS is running. |
| **Calendar** | /api/calendar | Proxies to COS API. GET events + POST create. |
| **Quick Search** | QuickSearch.tsx (Cmd+/) | Searches Supabase contacts/companies. Works. |
| **Dashboard Stats** | /dashboard | Fetches from Supabase. Real data. Works. |
| **Deals Kanban** | /deals | Drag-drop with dnd-kit. Supabase CRUD. Works. |
| **Tasks Kanban** | /tasks | Drag-drop. Supabase CRUD. Works. |
| **Contacts CRUD** | /contacts | Table with create/edit/export. Works. |
| **Companies CRUD** | /companies | Table with create/edit. Works. |
| **Sequences** | /sequences | Template selection, status tracking. Works (needs COS for processing). |
| **Workflows** | /workflows | Trigger types, enrollment tracking. UI works, execution depends on COS. |
| **Reports** | /reports | Pipeline metrics, activity counts. Supabase queries. Works. |
| **Outreach** | /outreach | Prospect management. Supabase CRUD. Works. |
| **Settings: Profile** | /settings | Edit name. Supabase update. Works. |
| **Settings: Team** | /settings | Hardcoded to Jake only. Invite flow is UI-only placeholder. |
| **Settings: Integrations** | /settings | Hardcoded list. Connect buttons are non-functional. |
| **Settings: Billing** | /settings | Hardcoded "Founder Plan". Upgrade disabled. |
| **Settings: Custom Fields** | /settings | Supabase CRUD for field definitions. Works. |
| **Auth (Login/Signup)** | /login, /signup | Supabase Auth. Works. Middleware auth gate currently disabled. |

---

## STEP 3: CLASSIFICATION

### HARDCODED — Needs Full Rebuild

| # | Feature | Current State | Why |
|---|---------|---------------|-----|
| 1 | `financial_model` | Skills API generates full AI file | Output quality is inconsistent. No template control. No formula guarantee. AI decides structure. Needs template like NPV/budget. |
| 2 | `project_estimate` | Skills API generates file | Same as above. Needs structured template with formula-driven cost breakdown. |
| 3 | `proposal` | Skills API generates file | AI-generated DOCX. No template standardization. Inconsistent formatting/content. |
| 4 | `capabilities_doc` | Skills API, zero-input | AI invents content. Should pull from company profile + CRM data. |
| 5 | `competitive_analysis` | Skills API + web search | AI-generated PDF. No structured template. Quality depends entirely on AI. |
| 6 | `review_financials` | Skills API, 4-phase | No connection to actual financial data. AI makes up numbers. |
| 7 | Settings: Integrations | Hardcoded list, non-functional buttons | Purely decorative. |
| 8 | Settings: Billing | Hardcoded "Founder Plan" | Purely decorative. |
| 9 | Settings: Team | Hardcoded to Jake, invite is placeholder | UI-only, no backend. |

### PARTIAL — Has Logic But Incomplete/Buggy

| # | Feature | What Works | What's Broken |
|---|---------|------------|---------------|
| 1 | **Chat persistence** | Session ID is stable | Messages lost on refresh. No Supabase storage. No localStorage. |
| 2 | **My Files** | Metadata in Supabase, list endpoint works | File binaries ephemeral (Railway /tmp). Lost on redeploy. No upload. |
| 3 | **Contact form** | Supabase + email notification | No CRM integration, no auto-reply, no vault sync. |
| 4 | **Demo form** | Supabase + email + Calendly link | No CRM integration, no follow-up sequence, Calendly not embedded. |
| 5 | `generate_budget` | Template path, formula-driven Excel | Already good but no tests. Needs TDD parity with NPV. |
| 6 | **Auth middleware** | Code exists, currently disabled | Lines 44-49 of middleware.ts. Needs activation for production. |
| 7 | **Email/Calendar** | Proxies to COS API | Only works when COS API is running (localhost:8100 or deployed). |

### FUNCTIONAL — Works End to End

| # | Feature | Notes |
|---|---------|-------|
| 1 | `npv_analysis` | Just rebuilt. 46 tests, 268 formulas, TDD. Gold standard. |
| 2 | Dashboard stats/charts | Real Supabase queries. Works. |
| 3 | Contacts/Companies CRUD | Full table with create/edit/search/export. |
| 4 | Deals Kanban | Drag-drop, stage management. |
| 5 | Tasks Kanban | Drag-drop, status management. |
| 6 | Reports | Pipeline metrics from Supabase. |
| 7 | Quick Search | Searches contacts/companies in real time. |
| 8 | Auth (login/signup) | Supabase Auth works. |
| 9 | Settings: Profile | Name edit + save. |
| 10 | Settings: Custom Fields | Full CRUD for field definitions. |
| 11 | Plain chat (no action) | Claude API + CRM context + web search. Works. |

---

## STEP 4: SEQUENCING — Recommended Build Order

### Tier 1: Foundation Fixes (blocks everything)

| Order | Feature | Complexity | Why First |
|-------|---------|------------|-----------|
| 1.1 | **Chat persistence** | Medium | Every demo fails when chat disappears on refresh. Affects every action. |
| 1.2 | **File storage (Supabase Storage)** | Medium | Every generated file is lost on redeploy. My Files is broken without this. |

### Tier 2: Template Conversions (highest demo impact)

| Order | Feature | Complexity | Why Next |
|-------|---------|------------|----------|
| 2.1 | **generate_budget tests** | Low | Already formula-driven. Just needs TDD parity with NPV (add 20+ tests). |
| 2.2 | **project_estimate template** | Medium | High demo value. Contractors estimate projects daily. Convert from Skills API to template path. |
| 2.3 | **proposal template** | Medium-High | High demo value. Needs structured DOCX template with SOW sections, pricing table. |
| 2.4 | **financial_model template** | High | Most complex. 5-tab workbook with KPI dashboard, P&L, job margins, cash flow, assumptions. The "flagship" output. |

### Tier 3: Intelligence Layer (requires real data)

| Order | Feature | Complexity | Why Here |
|-------|---------|------------|----------|
| 3.1 | **Contact form -> CRM** | Low | Form works. Just needs to also create a contact record in `contacts` table. |
| 3.2 | **Demo form -> CRM + sequence** | Low-Medium | Form works. Needs to create contact + trigger automated follow-up. |
| 3.3 | **review_financials** | High | Needs real QuickBooks or manual data input to be meaningful. Park until data integration exists. |
| 3.4 | **competitive_analysis** | Medium | Web search works. Needs structured template output instead of raw AI generation. |
| 3.5 | **capabilities_doc** | Medium | Should pull real company data from CRM, not invent content. |

### Tier 4: Platform Polish (pre-launch)

| Order | Feature | Complexity | Why Last |
|-------|---------|------------|----------|
| 4.1 | **Auth middleware activation** | Low | Flip the flag in middleware.ts, test protected routes. |
| 4.2 | **Settings: Integrations** | High | Real OAuth flows for Gmail, Calendar, Slack. Not needed for MVP demo. |
| 4.3 | **Settings: Billing** | High | Stripe integration. Not needed until paying customers. |
| 4.4 | **Settings: Team** | Medium | Multi-user support. Not needed for single-user pilot. |

### Critical Path for Live Demo

```
Chat persistence (1.1) → File storage (1.2) → Budget tests (2.1) → Project estimate (2.2) → Proposal (2.3)
```

This gives you a working Ask Endall where:
- Chat survives refresh
- Files survive redeploy
- 4 of 8 actions produce high-quality, formula-driven output
- Remaining 4 still work via Skills API (lower quality but functional)
