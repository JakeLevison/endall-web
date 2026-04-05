// Competitive intel on form submissions: extract email domain and flag
// submissions from known competitor companies. Informational only — we
// don't block or show different content to flagged submissions.

const COMPETITOR_DOMAINS = new Set([
  "servicetitan.com",
  "housecallpro.com",
  "jobber.com",
  "fieldedge.com",
  "askviktor.com",
]);

export type EmailIntel = {
  email_domain: string | null;
  is_competitor: boolean;
};

export function analyzeEmail(email: string | null | undefined): EmailIntel {
  if (!email || typeof email !== "string") {
    return { email_domain: null, is_competitor: false };
  }
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) {
    return { email_domain: null, is_competitor: false };
  }
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain) return { email_domain: null, is_competitor: false };
  return {
    email_domain: domain,
    is_competitor: COMPETITOR_DOMAINS.has(domain),
  };
}
