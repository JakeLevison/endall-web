import Link from "next/link";
import type { AgentDescriptor, AgentTier } from "./roster";

const TIER_LABEL: Record<AgentTier, string> = {
  health: "Live agent",
  metrics: "Metrics only",
  freshness: "Freshness only",
};

// Stub detail view for an agent card. Real per-agent drill-downs (call
// transcripts, campaign history, intel rows) land in a later pass — this
// keeps the route honest rather than fabricating content.
export function AgentDetail({
  descriptor,
  id,
}: {
  descriptor: AgentDescriptor | null;
  id: string;
}) {
  return (
    <div className="p-6 space-y-3">
      <Link
        href="/command-center"
        className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      >
        ← Command Center
      </Link>

      {descriptor ? (
        <>
          <h1
            className="text-[18px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {descriptor.label}
          </h1>
          <p className="text-[13px] text-[var(--text-muted)]">
            {TIER_LABEL[descriptor.tier]}
          </p>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Detailed agent view — coming soon.
          </p>
        </>
      ) : (
        <>
          <h1
            className="text-[18px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Agent not found
          </h1>
          <p className="text-[13px] text-[var(--text-muted)]">
            No agent matches “{id}”.
          </p>
        </>
      )}
    </div>
  );
}
