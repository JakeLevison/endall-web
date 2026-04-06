# Backlog

## Phase 1 — Demo-Ready MVP

Items from the [Q2 2026 product roadmap](../vault/Endall/Strategy/product-roadmap-2026-Q2.md). These must be complete before live demos.

- [ ] **Post-call approve/reject mode** — Voice pipeline post-call review. Contractor sees call summary and can approve (create job) or reject (flag as spam/wrong number). Blocks demo readiness.
- [ ] **Workflow documentation for Kunaal onboarding** — End-to-end setup guide: env vars, Supabase schema, Railway deploy, ElevenLabs agent config, Twilio wiring. Must be followable without Jake.
- [ ] **Demo signup → SDR auto-trigger chain** — When a prospect submits the demo form, auto-create an outreach prospect and trigger the SDR sequence. No manual handoff.
- [ ] **Anti-bot detection on demo form** — Add Cloudflare Turnstile to the demo booking form. Prevents fake submissions from polluting the SDR pipeline.

## Pre-launch Blockers

- [ ] **Stripe integration** — Payment processing for subscriptions. Required before any paid tier goes live. Scope: checkout flow, webhook handling, customer portal, billing management. Do not ship paid plans without this.