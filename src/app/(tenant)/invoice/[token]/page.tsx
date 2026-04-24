/**
 * Customer-facing invoice view page.
 *
 * Stubbed in R2-7. A later slice (Invoicing follow-up after Field ops)
 * wires the real tokenized invoice view.
 */

import { notFound } from "next/navigation";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 16) {
    notFound();
  }
  return (
    <section>
      <h1 style={{ fontSize: "20px", fontWeight: 500, margin: "0 0 12px" }}>
        Invoice
      </h1>
      <p style={{ color: "#5f5e5a", fontSize: "14px" }}>
        This invoice view is under construction and will be wired in a
        follow-up slice.
      </p>
    </section>
  );
}
