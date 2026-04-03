# Claude Code Session Prompt — Bridge Fixes: NPV Template + Chat Persistence + File Storage
## Paste this entire block into CS

---

## CONTEXT

You are working on the Endall Ask Endall bridge at ~/chief-of-staff/deploy/ask-endall-bridge/. This is a Python backend (FastAPI/Flask) running on Railway that powers the Ask Endall chat interface on the Endall website (endall-web, Next.js on Vercel).

The website repo is at /home/jakob/endall-web/. Supabase is the database. The bridge communicates with the frontend via API.

There are FOUR problems to fix in this session. Do them in order.

---

## TASK 1: Replace Static NPV Generator with Formula-Driven Template

### The Problem
The current NPV generator at `deploy/ask-endall-bridge/templates/npv.py` produces Excel files where nearly all values are hardcoded — Python computes everything and bakes static numbers into cells. The Assumptions tab says "Change any blue number and everything recalculates" but that's false. Only 8 cells out of ~120 have actual formulas.

### The Fix
Rewrite `templates/npv.py` so that the generated .xlsx file uses Excel formulas for ALL calculations. The only hardcoded values should be the user's inputs (company name, project name, contract value, cost percentages, timeline, etc.) placed on the Assumptions tab. Everything else must be formula references.

### Architecture (4 tabs):

**Tab 1: Summary**
- Title: `=Assumptions!B5&" — Project Returns Summary"` (dynamic from company name)
- Project, Customer, Timeline: all `=Assumptions!Bx` references
- Contract Value, Total Cost, Gross Profit, Gross Margin: formula references to Assumptions
- NPV: `='Cash Flow Detail'!N21` (total of discounted cash flows)
- Go/No-Go: `=IF(AND(B18>0,B15>=0.1),"PROCEED","REVIEW — margin or NPV below threshold")`

**Tab 2: Assumptions & Inputs**
- All user inputs in blue font with yellow background (industry standard for editable cells)
- Inputs: Company Name, Project Name, Customer, Contract Value, Timeline (months), Discount Rate (annual), Labor %, Materials %, Subs %, Equipment %, Upfront Billing %, Retention %
- Calculated fields (formulas, black font): Total Cost %, Total Estimated Cost, Gross Profit, Gross Margin %, Upfront Amount, Retention Amount, Monthly Progress Billing
- Key formula: Monthly Progress Billing = `=IF(B11=0,0,(B10-B27-B28)/B11)`

**Tab 3: Cash Flow Detail**
- Support up to 12 months dynamically (columns B through M, plus TOTAL in N)
- Each month auto-hides if beyond timeline: `=IF(month>Assumptions!$B$11,0,...)`
- Rows: Labor, Materials, Subs, Equipment, Total Outflows, Billing (with upfront in month 1, retention release in final month), Net Cash Flow, Cumulative Cash Flow, Discount Factor, Discounted Cash Flow, Cumulative NPV
- Every monthly value is a formula referencing Assumptions tab
- Discount factor: `=IF(m>Assumptions!$B$11,"",1/((1+Assumptions!$B$12)^(m/12)))`
- Billing month 1: `=Assumptions!$B$29+Assumptions!$B$27` (progress + upfront)
- Billing final month: `=Assumptions!$B$29+Assumptions!$B$28` (progress + retention)

**Tab 4: Sensitivity**
- 5×5 grid: NPV by Labor Cost % × Timeline (months) — offsets of -8%, -4%, base, +4%, +8% labor and -2, -1, base, +1, +2 months
- NPV by Discount Rate: 5 scenarios at -4%, -2%, base, +2%, +4%
- ALL values must be formulas, not pre-computed

### Formatting Standards
- Blue font (0,0,255) for all hardcoded inputs
- Black font for all formulas
- Yellow background for editable input cells
- Currency format: $#,##0
- Percentage format: 0.0%
- Font: Arial 11pt throughout
- Section headers: Arial 13pt bold, dark blue (1F4E79)

### NPVInput Dataclass
Keep the existing `NPVInput` dataclass interface so the intake flow doesn't break. Just change what the generator produces — formulas instead of static values.

### Validation
After rewriting, generate a test file and verify:
```bash
python3 -c "
from templates.npv import generate_npv
from templates.npv import NPVInput
inp = NPVInput(company_name='Test Corp', project_name='Electrical Fit-Out', customer_name='Big GC', contract_value=2400000, timeline_months=5)
path = generate_npv(inp)
print(f'Generated: {path}')
"
```
Then check the output file — count formulas vs static values. Target: 200+ formulas, zero hardcoded calculation values. Only labels and user inputs should be static.

---

## TASK 2: Fix "Acme Corp" Default — Use User's Company Name

### The Problem
When a user asks Ask Endall to generate an NPV analysis, the output defaults to "Acme Corp" even though the chat intake flow asks for company/project details. The user's actual answers aren't being passed to the NPV generator.

### The Fix
1. Read `server.py` — find where the NPV intake conversation happens
2. Trace how user responses flow from the chat to the `generate_npv()` call
3. Find where "Acme Corp" is hardcoded as a default — it's likely in the NPVInput dataclass or in the intake flow
4. Make sure the user's actual responses (company name, project name, contract value, etc.) are passed through to NPVInput
5. If the user doesn't provide a value, the default should be blank or "Your Company" — never "Acme Corp"

Show me the before/after of the intake → generation flow.

---

## TASK 3: Fix Chat Resetting on Page Refresh

### The Problem
When the user refreshes the Ask Endall page, the entire chat conversation disappears. The download links from generated files are lost. Chat should persist and only reset when the user clicks "New Chat."

### Root Cause (likely)
The bridge stores conversation state in memory (Python dict or similar). Page refresh = new session = empty conversation.

### The Fix
1. Read `server.py` — find how conversations are stored (likely an in-memory dict keyed by session_id)
2. Create a `conversations` table in Supabase (or add to an existing one):
   ```sql
   CREATE TABLE IF NOT EXISTS conversations (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     session_id TEXT NOT NULL,
     messages JSONB NOT NULL DEFAULT '[]',
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );
   CREATE INDEX idx_conversations_session ON conversations(session_id);
   ```
3. On every message exchange, persist the conversation to Supabase (upsert by session_id)
4. On page load / session reconnect, load the existing conversation from Supabase
5. "New Chat" should create a new session_id, not just clear memory

Also check the frontend side (`/home/jakob/endall-web/src/`):
- How is session_id generated? Is it stable across refreshes? (Should be stored in localStorage or a cookie)
- Does the frontend send session_id on initial load to fetch existing conversation?
- If session_id is regenerated on every page load, that's the bug — fix it to persist

Write the migration SQL to a file so Jake can run it in Supabase SQL editor.

---

## TASK 4: Fix My Files — Durable File Storage via Supabase Storage

### The Problem
Generated files (NPV analyses, budgets, etc.) are stored on Railway's ephemeral filesystem and tracked in an in-memory dict (`_file_registry`). When Railway restarts or the bridge redeploys, all files are lost. The My Files tab shows nothing because files don't persist.

Migration 016 (`generated_files` table) has been run in Supabase. The table exists.

### The Fix
1. Read `server.py` — find `_file_registry`, `_save_file_metadata()`, and the `/files` and `/download` endpoints
2. Set up Supabase Storage:
   - Create a storage bucket called `generated-files` in Supabase (or document the SQL/API call for Jake to run)
   - The bucket should be private (authenticated access only)
3. When a file is generated:
   a. Upload the file to Supabase Storage (`generated-files` bucket)
   b. Save metadata to the `generated_files` table (file name, storage path, session_id, created_at)
   c. Return a download URL that goes through the bridge (not a direct Supabase URL)
4. When `/files` is called:
   a. Query the `generated_files` table filtered by session_id
   b. Return the file list with download URLs
5. When `/download/{file_id}` is called:
   a. Look up the file in `generated_files` table
   b. Fetch from Supabase Storage
   c. Stream to the user
6. Remove the in-memory `_file_registry` — everything goes through Supabase now

### Supabase Storage Setup
Check if the Supabase client is already initialized in the bridge code. If so, use it. If not, add:
```python
from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
```

For the storage bucket, document the setup steps (Jake may need to create the bucket in the Supabase dashboard: Storage → New Bucket → "generated-files" → Private).

### Frontend Alignment
Check `/home/jakob/endall-web/src/` — make sure the My Files tab and chat download links both use the same URL pattern to fetch files. The download URL returned by the bridge must match what the frontend expects.

---

## OUTPUT

After all four tasks, give me:

### Summary Report
- Task 1 (NPV): Formula count in new output, confirmation it's fully dynamic
- Task 2 (Acme Corp): What was the default, what is it now, how does user input flow through
- Task 3 (Chat persistence): What storage was used before, what's used now, migration SQL location
- Task 4 (File storage): What storage was used before, what's used now, any Supabase dashboard steps Jake needs to do manually

### Migration SQL Files
Save all migration SQL to files Jake can run:
- `017_conversations.sql`
- Any Supabase Storage bucket creation steps

### Files Changed
List every file modified or created.

### What To Test
Step-by-step testing instructions for each fix.

### Commit
Stage everything in deploy/ask-endall-bridge/ and show me `git diff --stat`. Also stage any frontend changes in endall-web if you touched that repo. STOP before committing — show me the full change summary first.

---

## DO NOT:
- Break the existing chat flow — if something can't be fixed cleanly, document what's needed and skip it
- Remove any existing functionality
- Change the website's visual design or routing
- Use "Endall AI," "handles/handling," "software," or any banned language in user-facing strings
- Hardcode any API keys in code — use environment variables
