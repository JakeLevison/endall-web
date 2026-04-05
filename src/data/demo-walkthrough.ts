// Cached responses for the /demo walkthrough (AskStep + GenerateStep).
// These are the 3 suggested questions contractors see first. When clicked,
// they render from this file in <1.5s instead of hitting /api/chat.
//
// Free-text input still hits the real API as a fallback.

export type WalkthroughPreset = {
  question: string;
  response: string;
  typingDelayMs: number;
};

export const WALKTHROUGH_PRESETS: WalkthroughPreset[] = [
  {
    question: "What should I charge for a 200A panel upgrade?",
    response:
      "For a standard 200A residential service upgrade in the mid-Atlantic, pricing usually lands between **$2,800 and $4,500** depending on:\n\n- **Meter location** — outdoor pedestal runs $2,800-$3,400; indoor-to-outdoor relocations push $3,800-$4,500.\n- **Mast/riser length** — standard 10ft mast is fine; 16ft+ riser adds $300-$500 in materials and labor.\n- **Breaker count** — 30-circuit panel is the baseline; 40-42 circuit adds $250-$400.\n- **Utility coordination** — most markets, a day of crew time. Tight-scheduling utilities (Dominion, PEPCO) eat a half-day more.\n\nTypical margin target: **35-42% gross** on a clean swap, **28-35%** if you're pulling permits and dealing with inspection delays. If the panel is Federal Pacific or Zinsco, price in removal/disposal separately ($150-$300) and flag it as a liability risk.",
    typingDelayMs: 900,
  },
  {
    question: "How do I price a data center electrical bid?",
    response:
      "Data center electrical is its own discipline. For a rough-in bid you're pricing on three levers:\n\n- **$/kW installed** — industry benchmark for MEP electrical on hyperscale shells is **$800-$1,400 per kW**. Colo/edge sites run $1,200-$1,800/kW because of tighter timelines.\n- **Labor multiplier** — data center work typically uses a 1.35-1.5x multiplier over standard commercial because of night shifts, security protocols, and tight crew coordination with mechanical trades.\n- **Schedule risk premium** — liquidated damages on these jobs are brutal ($25K-$100K/day). Bake a 3-5% schedule contingency into your bid above normal overhead.\n\nDon't bid the first data center opportunity as a low-margin foot-in-the-door. GCs like Meridian, Clune, and DPR scrutinize your second bid against your first — come in at **12-15% net margin on your first one** or you'll be locked into that number forever.",
    typingDelayMs: 1000,
  },
  {
    question: "What's a good profit margin for commercial mechanical work?",
    response:
      "Commercial mechanical (plumbing, piping, sheet metal, controls) margin targets depend on delivery model:\n\n- **Service work** — 40-55% gross, 18-25% net. This is your cash engine.\n- **T&M retrofits** — 30-38% gross, 12-18% net.\n- **Plan-and-spec new construction** — 22-28% gross, 6-10% net. Hardest money in the trade.\n- **Design-build** — 28-35% gross, 10-15% net, with the leverage shifting to you if you own the engineering.\n\nIf your service division is running under 40% gross, check labor utilization first — most underperforming shops have trucks billing 4-5 hours a day when they should be at 6.5+. After that, audit truck stock and parts markup (your 35% markup should be 45-60%).\n\nRule of thumb: if you can't hit 10% net profit company-wide, your pricing is wrong, your estimating is wrong, or your labor productivity is broken. It's rarely all three.",
    typingDelayMs: 1000,
  },
];

// Generic fallback for free-text when not matching a preset.
export const WALKTHROUGH_FALLBACK =
  "I can give you specific numbers if you point me at the scope. In the full product, Endall pulls your actual job history, margins, and local benchmarks to answer this precisely. For the demo, try one of the suggested questions above.";
