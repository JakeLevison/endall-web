# Demo-preset rebuild — verification evidence

Supports PR #11 (endall-web) paired with chief-of-staff PR #9.

## Zero-tolerance Patriot Electric sweep

Every XML part in every produced file was scanned case-insensitively for the
string "patriot" via `zipfile` + regex. Zero matches across all 16 outputs.

| File | Size | `patriot` matches |
|---|---|---|
| capabilities_doc__Harbor_Electric.pptx | 103,403 | 0 |
| capabilities_doc__Verification_Test_LLC.pptx | 103,433 | 0 |
| competitive_analysis__Harbor_Electric.docx | 825,850 | 0 |
| competitive_analysis__Verification_Test_LLC.docx | 825,856 | 0 |
| financial_model__Harbor_Electric.xlsx | 167,770 | 0 |
| financial_model__Verification_Test_LLC.xlsx | 167,782 | 0 |
| generate_budget__Harbor_Electric.xlsx | 133,250 | 0 |
| generate_budget__Verification_Test_LLC.xlsx | 133,256 | 0 |
| npv_analysis__Harbor_Electric.xlsx | 94,154 | 0 |
| npv_analysis__Verification_Test_LLC.xlsx | 94,166 | 0 |
| project_estimate__Harbor_Electric.xlsx | 35,981 | 0 |
| project_estimate__Verification_Test_LLC.xlsx | 35,993 | 0 |
| proposal__Harbor_Electric.docx | 832,553 | 0 |
| proposal__Verification_Test_LLC.docx | 832,577 | 0 |
| review_financials__Harbor_Electric.docx | 825,374 | 0 |
| review_financials__Verification_Test_LLC.docx | 825,380 | 0 |

## Positive company-name assertion

Each file was then scanned for its caller-supplied company name. All 16
match — the workbook/document actually uses the name the user typed, not
a fallback or a leaked default.

| File | Expected company | Found in body |
|---|---|---|
| capabilities_doc__Harbor_Electric.pptx | Harbor Electric | ✓ |
| capabilities_doc__Verification_Test_LLC.pptx | Verification Test LLC | ✓ |
| competitive_analysis__Harbor_Electric.docx | Harbor Electric | ✓ |
| competitive_analysis__Verification_Test_LLC.docx | Verification Test LLC | ✓ |
| financial_model__Harbor_Electric.xlsx | Harbor Electric | ✓ |
| financial_model__Verification_Test_LLC.xlsx | Verification Test LLC | ✓ |
| generate_budget__Harbor_Electric.xlsx | Harbor Electric | ✓ |
| generate_budget__Verification_Test_LLC.xlsx | Verification Test LLC | ✓ |
| npv_analysis__Harbor_Electric.xlsx | Harbor Electric | ✓ |
| npv_analysis__Verification_Test_LLC.xlsx | Verification Test LLC | ✓ |
| project_estimate__Harbor_Electric.xlsx | Harbor Electric | ✓ |
| project_estimate__Verification_Test_LLC.xlsx | Verification Test LLC | ✓ |
| proposal__Harbor_Electric.docx | Harbor Electric | ✓ |
| proposal__Verification_Test_LLC.docx | Verification Test LLC | ✓ |
| review_financials__Harbor_Electric.docx | Harbor Electric | ✓ |
| review_financials__Verification_Test_LLC.docx | Verification Test LLC | ✓ |

## Evidence directories

- `files/` — the 16 raw office documents produced by the E2E run
- `screenshots/` — 34 PNGs, one per xlsx sheet per file, rendered via
  the HTML-table renderer (scripts/render-xlsx-html.py) because no
  LibreOffice is available in this WSL environment. Shows cell values
  + formula strings legibly
- `text-extracts/` — 8 markdown files, one per docx/pptx, with every
  paragraph / table row / slide text extracted so reviewers can read
  the document content without opening Word/PowerPoint
