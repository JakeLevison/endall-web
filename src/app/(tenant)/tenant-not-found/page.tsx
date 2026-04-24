/**
 * Neutral 404 served on tenant subdomains when the URL path is not a
 * customer-facing surface. No Endall branding leaks.
 */

export const metadata = {
  title: "Site not found",
};

export default function TenantNotFoundPage() {
  return (
    <section style={{ textAlign: "center", padding: "64px 24px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 500, margin: "0 0 12px" }}>
        Site not found
      </h1>
      <p style={{ color: "#5f5e5a", fontSize: "14px" }}>
        The page you requested could not be located.
      </p>
    </section>
  );
}
