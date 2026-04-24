/**
 * Customer-facing estimate approval page.
 *
 * Stubbed in R2-7 subdomain-routing slice. Estimator Slice E3 (R2-8)
 * wires the real tokenized approval flow: PDF embed, line items, comment
 * thread, approve/reject with signature capture. This file is the mount
 * point and a 404 guard.
 */

import { notFound } from "next/navigation";

export default async function ApprovePage({
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
        Estimate approval
      </h1>
      <p style={{ color: "#5f5e5a", fontSize: "14px" }}>
        This approval page is under construction and will be wired by
        Estimator Slice E3. Your link is valid.
      </p>
    </section>
  );
}
