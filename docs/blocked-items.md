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

**Date:** 2026-04-04 (updated 2026-04-05)
**Impact:** Test matrix items marked MANUAL (response time <30s, DOCX file opens) cannot be verified without a running bridge + live Anthropic API calls.
**Status:** All 355+ automated tests pass. Code-level verification complete. Live testing deferred to after Railway redeploy.
**Action needed:** After Railway redeploy, manually test each of the 8 preset actions in the Ask Endall UI.

## 4. NPV Excel: Static Formulas + Wrong Blue (Bug 2)

**Date:** 2026-04-05
**Root cause:** Railway bridge is running OLD code from before formula engine + blue font fixes.
**Evidence:** 54 NPV tests pass locally (200+ formulas verified, royal blue verified). The deployed bridge hasn't picked up commits `ad46f2f` (Excel fixes) or `ce77f7a` (timeout/model routing).
**Fix:** Railway redeploy resolves this. No code changes needed — the template code is correct.

## 5. Financial Model Timeout (Bug 3)

**Date:** 2026-04-05
**Root cause:** Financial Model uses Opus (line 49 of llm_provider.py) which is slower. max_tokens was increased to 8192 in commit `ce77f7a` but Railway hasn't deployed it yet.
**Additional factor:** Financial Model has the most complex intake prompt + largest JSON output. May need to move from Opus to Sonnet 4.5 like we did for Review Financials.
**Fix:** Railway redeploy first. If still timing out, move financial_model from OPUS_ACTIONS to SONNET_45_ACTIONS.
