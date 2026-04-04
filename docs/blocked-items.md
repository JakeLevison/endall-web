# Blocked Items

## 1. Daily Summary Email — Resend API 403

**Date:** 2026-04-04
**Error:** `Resend API error 403: error code: 1010`
**Script:** `scripts/daily_summary.py --send`
**Impact:** Email delivery fails. Markdown archive still saves to vault.

**Root cause:** Likely one of:
- Resend API key doesn't have permission to send from the configured `from` address
- Domain (endall.ai) not verified in Resend dashboard
- API key scope is restricted to a different domain

**Action needed:** Jake to check Resend dashboard at resend.com/domains — verify endall.ai domain is verified and the API key has send permissions. The `from` address in `daily_summary.py` must match a verified domain.

## 2. Railway Bridge Redeploy

**Date:** 2026-04-04
**Impact:** Bug fixes 4-9 (timeout, model routing, Excel templates) are committed but need Railway to redeploy the bridge service.
**Action needed:** Check Railway dashboard — if auto-deploy is enabled on the chief-of-staff repo, it should have picked up commits `ad46f2f` and `ce77f7a`. If not, trigger manual deploy.

## 3. Live End-to-End Testing

**Date:** 2026-04-04
**Impact:** Test matrix items marked MANUAL (response time <30s, DOCX file opens) cannot be verified without a running bridge + live Anthropic API calls.
**Status:** All 355 automated tests pass. Code-level verification complete. Live testing deferred to after Railway redeploy.
**Action needed:** After Railway redeploy, manually test each of the 8 preset actions in the Ask Endall UI.
