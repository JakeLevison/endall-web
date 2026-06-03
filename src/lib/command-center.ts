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

// Company names the bridge stores when it couldn't identify the caller's
// company. These read as broken/low-trust in the feed, so we fall back to
// the caller's name or phone instead of rendering the literal placeholder.
const PLACEHOLDER_TARGETS = new Set(["", "unknown", "n/a", "none", "null"]);

export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  const ten =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (ten.length === 10) {
    return `+1 ${ten.slice(0, 3)}-${ten.slice(3, 6)}-${ten.slice(6)}`;
  }
  return raw.trim();
}

interface LogTargetSource {
  company_name?: string | null;
  input_data?: Record<string, unknown> | null;
}

// Best human-readable label for what a log acted on: a real company name,
// else the caller's name, else their formatted phone, else null (so the
// caller can omit the "— Unknown" suffix entirely).
export function logTargetLabel(log: LogTargetSource): string | null {
  const company = (log.company_name ?? "").trim();
  if (company && !PLACEHOLDER_TARGETS.has(company.toLowerCase())) return company;

  const contact = (log.input_data?.contact ?? null) as
    | { name?: string | null; phone?: string | null }
    | null;
  const name = (contact?.name ?? "").trim();
  if (name) return name;

  const phone = formatPhone(contact?.phone);
  if (phone) return phone;

  return null;
}
