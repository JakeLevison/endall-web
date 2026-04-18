export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  "fr-001": "Front Desk",
  "sdr-001": "SDR",
  "research-001": "Research",
  "email-001": "Email",
  front_desk: "Front Desk",
  sdr: "SDR",
  research: "Research",
  email: "Email",
};

export function agentDisplayName(agentId: string | null | undefined): string {
  if (!agentId) return "Unknown";
  const normalized = agentId.trim();
  return (
    AGENT_DISPLAY_NAMES[normalized] ||
    AGENT_DISPLAY_NAMES[normalized.toLowerCase()] ||
    normalized
  );
}

export function isSuccessStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "success" || s === "ok" || s === "completed" || s === "done";
}
