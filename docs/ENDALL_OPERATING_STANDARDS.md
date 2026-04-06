# ENDALL OPERATING STANDARDS

Save this file to the Obsidian vault at `vault/Endall/OPERATING_STANDARDS.md` and reference it at the top of every future SESSION_HANDOFF.md.

---

## Product Philosophy

Every module, agent, workflow, and interface in the Endall system must meet these standards. This is not aspirational — this is the bar.

### 1. Show, Don't Tell

If something can be interactive instead of static, make it interactive. If a visitor can click through and experience the product rather than read about it, that's always better. Static content is acceptable when interaction would add complexity without clarity. The test: would a contractor understand this faster by clicking through it or by reading about it?

### 2. Quality Is Non-Negotiable

Nothing ships half-built. Every page, every component, every interaction must work in both light and dark mode. Every button must go somewhere. Every link must scroll to the top. Every form must validate. Every text must be legible. If it's on the site, it works perfectly. If it doesn't work perfectly, it doesn't ship.

### 3. Compound Intelligence

Every Endall module and agent must be designed to learn, evolve, and get smarter over time. This means:
- Every interaction generates data that feeds back into the system
- Lead scoring improves as more calls are processed
- Outreach sequences optimize based on reply rates
- The morning briefing gets more relevant as it learns what the contractor acts on
- The system compounds — month 3 is meaningfully better than month 1

This is not a feature request. This is an architectural requirement. Every new module must answer: "How does this get smarter over time?" If the answer is "it doesn't," redesign it.

### 4. Contractor-First Design

The end user is an MEP contractor running a 10-30 person crew. They check their phone between job sites. They don't read paragraphs. They don't learn new tools voluntarily. Everything must be:
- Scannable in under 5 seconds
- Operable with one hand on a phone
- Self-explanatory without a tutorial
- Immediately valuable without configuration

### 5. Dynamic Over Static (When It Earns It)

Default to interactive and dynamic when:
- It helps the visitor understand the product faster
- It demonstrates a capability that's hard to explain in text
- It creates engagement that leads to a demo booking
- It replaces a paragraph with a click

Stay static when:
- The information is simple and direct
- Animation would distract from the message
- The interaction adds load time without adding clarity

### 6. Cross-Functional Feedback Loops

No module operates in isolation. The front desk feeds the SDR. The SDR feeds the pipeline. The pipeline feeds the briefing. The briefing feeds the contractor's decisions. The contractor's actions feed back into lead scoring. Design every module with its upstream inputs and downstream outputs explicitly defined.

---

## Design Standards

- All text: minimum 14px body, 12px caption
- Light mode: body text #1F2937 minimum, secondary #4B5563 minimum
- Dark mode: body text #E5E7EB minimum, secondary #9CA3AF minimum
- Touch targets: 44px minimum on mobile
- Transitions: under 300ms, respect prefers-reduced-motion
- Both light and dark mode tested before any push
- Scroll to top on every navigation event
- No dead buttons, no broken links, no invisible text

---

## Naming and Copy Standards

- "Endall" never "Endall AI"
- "Operations team" / "ops team" never "software"
- Never use "handles" / "handling"
- Voice/calls is never the lead feature — always position as one part of a larger ops replacement
- Jake's public title: "Founder" (not Co-Founder)
- Email signature: Jake Levison / Founder, Endall / (203) 610-9399 / endall.ai

---

## Production URL Map

| Service | URL | Env Var |
|---------|-----|---------|
| **Vercel (frontend)** | `https://endall.ai` | — (production domain) |
| **Ask Endall Bridge (Railway)** | `https://ask-endall-bridge-production.up.railway.app` | `ASK_ENDALL_BRIDGE_URL`, `NEXT_PUBLIC_OPS_API_URL` |
| **Chief-of-Staff API (Railway)** | TBD — set via env var | `COS_API_URL` |
| **ElevenLabs** | Via SDK (API key auth) | `ELEVENLABS_API_KEY` |
| **Twilio** | Via SDK (account SID + auth token) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` |
| **Supabase** | `https://jqvtrbyzgccmedsqopyd.supabase.co` | `NEXT_PUBLIC_SUPABASE_URL` |
| **Resend (email)** | Via SDK | `RESEND_API_KEY` |
| **Cloudflare Turnstile** | Via widget + server verify | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |

All backend URLs must be set via environment variables in Vercel. Localhost fallbacks exist for local development only. See `docs/PRODUCTION_URL_AUDIT.md` for the full audit.

---

## PostHog Analytics

### Project Setup
- **Provider:** PostHog Cloud (US region — `https://us.i.posthog.com`)
- **Integration:** `posthog-js` client-side, initialized in `src/lib/posthog.ts`
- **Provider wrapper:** `src/components/providers/PostHogProvider.tsx` (mounted in root layout)
- **Page views:** Automatic via PostHog `capture_pageview: true`

### Tracked Events
| Event | Trigger | Properties |
|-------|---------|------------|
| `page_view` | Automatic (all pages) | — |
| `demo_form_started` | User lands on `/demo/request` | — |
| `demo_form_completed` | Successful demo form submission | `trade`, `team_size` |
| `demo_form_abandoned` | User leaves `/demo/request` without submitting | — |
| `command_center_viewed` | Dashboard page loads | — |
| `ask_endall_query` | User submits a question in Ask Endall | `query_length` |

### Rules
- No session replay, feature flags, or advanced PostHog features without explicit approval
- Only add new events through a PR with Jake's sign-off
- Never capture PII (names, emails, phone numbers) in event properties

---

## Environment Variables Added (PostHog)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | Yes (for analytics) | PostHog project API key. Leave empty to disable tracking. |

Full env var reference: `.env.example`
