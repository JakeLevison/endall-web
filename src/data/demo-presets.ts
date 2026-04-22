// Cached demo responses for the interactive demo.
// The response text is cached per preset so the chat renders instantly. The
// file attached to each response is generated on demand at download click
// time by POST /api/demo/{presetPath} — no static files in /public anymore.
// That's deliberate: the older static files hardcoded "Patriot Electric"
// inside every cell, which is a zero-tolerance shipping-rule violation.
//
// Company name is dynamic:
//   - If the user filled the demo gate, localStorage has their company name.
//     Each download POST carries it through to the bridge so the file
//     renders with their name.
//   - If the user landed on /demo/interactive without filling the gate, the
//     bridge falls back to "Cornerstone MEP Partners" (neutral fictional MEP
//     contractor, no collision with any real or test tenant).
//   - Chat text still shows "your company" in the fallback case for the
//     preset response copy — that's a UI choice, not a data dependency.

const PLACEHOLDER = "{{company}}";
const FALLBACK_COMPANY_TEXT = "your company";
const FALLBACK_COMPANY_SLUG = "Sample_Company";

function getDemoCompany(): string {
  if (typeof window === "undefined") return FALLBACK_COMPANY_TEXT;
  try {
    return localStorage.getItem("endall_demo_company") || FALLBACK_COMPANY_TEXT;
  } catch {
    return FALLBACK_COMPANY_TEXT;
  }
}

function getDemoCompanySlug(): string {
  const name = getDemoCompany();
  if (name === FALLBACK_COMPANY_TEXT) return FALLBACK_COMPANY_SLUG;
  return name.trim().replace(/\s+/g, "_");
}

/** Resolve {{company}} placeholders at render time. */
function r(text: string): string {
  return text.replaceAll(PLACEHOLDER, getDemoCompany());
}

export type DemoFile = {
  /** Display name shown in the chat bubble download affordance. */
  filename: string;
  /** Bridge preset path — last segment of POST /api/demo/{presetPath}.
   *  The client POSTs company_name and streams bytes back to trigger
   *  a download. No static file lives in /public for this. */
  presetPath:
    | "npv"
    | "budget"
    | "financial-model"
    | "estimate"
    | "proposal"
    | "competitive-analysis"
    | "financial-review"
    | "capabilities";
};

export type DemoPreset = {
  id: string;
  userMessage: string;          // what shows in the user bubble
  intro?: string;               // optional clarifying question (fires first)
  response: string;             // final assistant response
  files?: DemoFile[];
  renderDelayMs?: number;       // typing animation length for the final response
};

// Raw presets use {{company}} — resolve via getDemoPresets() below.
const RAW_PRESETS: Record<string, DemoPreset> = {
  financial_model: {
    id: "financial_model",
    userMessage: "[Build a financial model]",
    intro:
      `I'll build a 3-year financial model for ${PLACEHOLDER}. Pulling in your 2024-2025 actuals and projecting 2026 based on your current pipeline.`,
    response:
      "Your financial model is ready. Here's what I built:\n\n- **P&L tab**: 2024 actuals, 2025 actuals, 2026 projection ($5.4M revenue, 8.0% EBITDA)\n- **KPI Dashboard**: Gross margin, EBITDA margin, revenue growth, avg job size, close rate, DSO\n- **Cash Flow projection**: monthly, 12 months out\n- **Assumptions tab**: every driver is editable\n\nYou're on pace for +16% revenue growth and a 3-point margin expansion. The model flags DSO at 48 days — above your 35-day target — as the biggest drag on working capital.",
    files: [
      {
        filename: `${PLACEHOLDER}_Financial_Model.xlsx`,
        presetPath: "financial-model",
      },
    ],
    renderDelayMs: 1100,
  },

  generate_budget: {
    id: "generate_budget",
    userMessage: "[Generate a budget]",
    intro:
      `I'll build a monthly operating budget for ${PLACEHOLDER} based on your Q1 run-rate and 2026 targets.`,
    response:
      "Your monthly budget is ready.\n\n- **Revenue target**: $412K/month ($4.94M annual)\n- **Labor**: $173K (42% of revenue, Q1 running $8.4K hot)\n- **Materials**: $128K (31%)\n- **Subs, insurance, vehicles, OH**: $88K\n- **Owner comp**: $16K\n- **Target net profit**: $6.9K/month (1.7%) — Q1 actual beat it at $13.5K (3.1%)\n\nLabor overrun on DC-11 punch list is the main variance. Once that closes, you'll be back at target.",
    files: [
      {
        filename: `${PLACEHOLDER}_Budget.xlsx`,
        presetPath: "budget",
      },
    ],
    renderDelayMs: 1000,
  },

  npv_analysis: {
    id: "npv_analysis",
    userMessage: "[Analyze project returns]",
    intro:
      "I'll run NPV on the Ashburn DC-14 electrical rough-in: $4.25M contract, 14 months, 10% discount rate.",
    response:
      "NPV analysis complete. Recommendation: **GO**.\n\n- **Baseline NPV**: $287,500\n- **IRR**: 18.4%\n- **Payback**: 9.2 months\n- **Break-even cost overrun**: +22%\n\nSensitivity: profitable through +20% overrun. Above +22%, NPV turns negative. The biggest risk is labor - crew availability in May-June overlaps with your DC-11 punch list.",
    files: [
      {
        filename: `${PLACEHOLDER}_NPV_Analysis.xlsx`,
        presetPath: "npv",
      },
    ],
    renderDelayMs: 1100,
  },

  project_estimate: {
    id: "project_estimate",
    userMessage: "[Estimate a project]",
    intro:
      "I'll estimate the Ashburn DC-14 electrical rough-in. 200k SF shell, 200A main switchgear, commercial data center scope.",
    response:
      "Estimate ready.\n\n- **Total bid**: $289,150 (20% markup on cost)\n- **Materials**: $135,830 (switchgear, transformers, panels, feeders)\n- **Labor**: $82,320 (840 hours, journeyman + helper)\n- **PM + commissioning**: $22,800\n- **Overhead**: $19,280 (8%)\n- **Margin**: $28,920 (12%)\n\nTimeline: mobilize May 1, rough-in complete Sept 15, commissioning Oct 1.",
    files: [
      {
        filename: `${PLACEHOLDER}_Estimate.xlsx`,
        presetPath: "estimate",
      },
    ],
    renderDelayMs: 1100,
  },

  proposal: {
    id: "proposal",
    userMessage: "[Draft a proposal]",
    intro:
      `I'll draft a proposal to Meridian Construction for the Ashburn DC-14 electrical rough-in, using ${PLACEHOLDER}'s current estimate.`,
    response:
      "Proposal drafted.\n\n- Cover page with Meridian branding conventions\n- Scope of work (switchgear, transformers, panels, feeders, lighting, devices, commissioning)\n- Timeline (mobilize May 1, complete Oct 1)\n- Pricing breakdown totaling $289,150\n- Net 30 terms with 10% mobilization + monthly progress billing\n\nReady to review and send.",
    files: [
      {
        filename: `${PLACEHOLDER}_Proposal.docx`,
        presetPath: "proposal",
      },
    ],
    renderDelayMs: 1200,
  },

  competitive_analysis: {
    id: "competitive_analysis",
    userMessage: "[Research competitors]",
    intro:
      `I'll research the Ashburn DC corridor electrical competitive landscape for ${PLACEHOLDER}.`,
    response:
      "Competitive analysis ready. Three primary competitors in your corridor:\n\n- **Power Design Inc.** - national MEP, strong on mega-projects >$50M, slow on sub-$5M scopes\n- **Mona Electric Group** - regional leader, strong Meridian relationship\n- **Rosendin Electric** - tier-1 national, premium pricing, best-in-class safety\n\n**Your positioning**: the responsive sub-$5M DC specialist. Emphasize schedule certainty, owner-on-site, and crew continuity in every Meridian and Compass bid. Your 15-20% cost edge on sub-$3M rough-ins is the lead argument.",
    files: [
      {
        filename: `${PLACEHOLDER}_Competitive_Analysis.docx`,
        presetPath: "competitive-analysis",
      },
    ],
    renderDelayMs: 1100,
  },

  review_financials: {
    id: "review_financials",
    userMessage: "[Review my financials]",
    intro:
      "Pulling your March 2026 P&L, comparing to budget, and identifying variances.",
    response:
      "March review complete.\n\n- **Revenue**: $438K, +6.4% over $412K target\n- **Net margin**: 3.1% vs 1.7% target\n- **Labor**: $8.4K over budget (DC-11 punch list)\n- **Retention outstanding**: $42K from Meridian on DC-09, 38 days past due\n\n**Action items**:\n1. Close DC-11 punch list by April 12 - $18K labor at risk\n2. Invoice Meridian for DC-09 retention\n3. Re-bid DC-14 with +2% contingency before April 20\n4. Schedule Q2 safety refresher for apprentices",
    files: [
      {
        filename: `${PLACEHOLDER}_Financial_Review.docx`,
        presetPath: "financial-review",
      },
    ],
    renderDelayMs: 1100,
  },

  capabilities_doc: {
    id: "capabilities_doc",
    userMessage: "[Create a capabilities doc]",
    intro:
      `I'll generate a capabilities deck for ${PLACEHOLDER}, targeted at data center GCs in the Ashburn corridor.`,
    response:
      `Capabilities deck ready. 5 slides:\n\n- **Cover**: ${PLACEHOLDER}, Ashburn VA, data center electrical specialists\n- **Who We Are**: 22 journeymen, 8 apprentices, $4.6M revenue, Loudoun/PW focus\n- **Recent Projects**: DC-11, DC-09, Loudoun Logistics Park\n- **Capabilities**: 15kV switchgear, generator/UPS, NFPA 70E arc-flash\n- **Why ${PLACEHOLDER}**: DC-only focus, 100% on-time, zero OSHA recordables across 3.8M safe hours`,
    files: [
      {
        filename: `${PLACEHOLDER}_Capabilities.pptx`,
        presetPath: "capabilities",
      },
    ],
    renderDelayMs: 1200,
  },
};

/** Returns presets with {{company}} resolved to the user's company name. */
export function getDemoPresets(): Record<string, DemoPreset> {
  const slug = getDemoCompanySlug();
  const resolved: Record<string, DemoPreset> = {};
  for (const [key, preset] of Object.entries(RAW_PRESETS)) {
    resolved[key] = {
      ...preset,
      intro: preset.intro ? r(preset.intro) : undefined,
      response: r(preset.response),
      files: preset.files?.map((f) => ({
        filename: f.filename.replaceAll(PLACEHOLDER, slug),
        presetPath: f.presetPath,
      })),
    };
  }
  return resolved;
}

/** Return the user's saved company name, or empty string if none. The
 *  bridge falls back to "Cornerstone MEP Partners" when this is empty. */
export function getDemoCompanyOrEmpty(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("endall_demo_company") || "";
  } catch {
    return "";
  }
}

// Keep backward-compat default export for non-dynamic callers.
// This resolves at import time (server-side = "your company").
export const DEMO_PRESETS = RAW_PRESETS;
