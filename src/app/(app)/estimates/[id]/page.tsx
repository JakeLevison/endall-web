"use client";

import { use, useEffect, useState } from "react";
import { SendEstimateButton } from "@/components/estimates/EmailDraftReviewModal";

type LineItem = {
  id: string;
  estimate_id: string;
  order_index: number;
  category: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  trade: string | null;
  tier: string | null;
  extended: number;
};

type Estimate = {
  id: string;
  tenant_id: string;
  estimate_number: string;
  status: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  project_address: string | null;
  project_description: string;
  payment_terms: string;
  timeline_weeks: number;
  valid_until: string | null;
  grand_total: number;
  line_items: LineItem[];
};

type FetchState =
  | { kind: "loading" }
  | { kind: "ready"; estimate: Estimate }
  | { kind: "not_found" }
  | { kind: "error"; message: string };

function formatUSD(n: number): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export default function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [state, setState] = useState<FetchState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/estimates/${encodeURIComponent(id)}`,
          { cache: "no-store" },
        );
        if (cancelled) return;
        if (res.status === 404) {
          setState({ kind: "not_found" });
          return;
        }
        if (!res.ok) {
          setState({
            kind: "error",
            message: `Could not load estimate (${res.status}).`,
          });
          return;
        }
        const estimate = (await res.json()) as Estimate;
        setState({ kind: "ready", estimate });
      } catch (err) {
        if (cancelled) return;
        setState({
          kind: "error",
          message: (err as Error).message || "network error",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.kind === "loading") {
    return (
      <main className="p-6">
        <p
          data-testid="estimate-loading"
          className="text-[13px] text-[var(--text-muted)]"
        >
          Loading estimate…
        </p>
      </main>
    );
  }

  if (state.kind === "not_found") {
    return (
      <main className="p-6">
        <h1 className="text-[15px] font-medium text-[var(--text-primary)]">
          Estimate not found
        </h1>
        <p
          data-testid="estimate-not-found"
          className="mt-2 text-[13px] text-[var(--text-muted)]"
        >
          We couldn&apos;t find an estimate with that ID. It may have been
          deleted or belong to a different workspace.
        </p>
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className="p-6">
        <p
          role="alert"
          data-testid="estimate-error"
          className="text-[13px] text-red-400"
        >
          {state.message}
        </p>
      </main>
    );
  }

  const { estimate } = state;

  return (
    <main className="p-6">
      <div className="max-w-3xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[15px] font-medium text-[var(--text-primary)]">
              Estimate {estimate.estimate_number}
            </h1>
            <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
              {estimate.customer_name}
              {estimate.customer_email ? ` · ${estimate.customer_email}` : ""}
            </p>
            {estimate.project_address ? (
              <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                {estimate.project_address}
              </p>
            ) : null}
          </div>
          <span
            data-testid="estimate-status"
            className="rounded-md border border-[var(--border)] bg-[var(--overlay-soft)] px-2 py-1 text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]"
          >
            {estimate.status}
          </span>
        </header>

        <section>
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <table
              data-testid="line-items-table"
              className="w-full text-[13px]"
            >
              <thead className="bg-[var(--overlay-weak)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit price</th>
                  <th className="px-3 py-2 text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {estimate.line_items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-3 text-[var(--text-muted)]"
                    >
                      No line items.
                    </td>
                  </tr>
                ) : (
                  estimate.line_items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-[var(--border)]"
                    >
                      <td className="px-3 py-2 text-[var(--text-primary)]">
                        {item.name}
                      </td>
                      <td className="px-3 py-2 text-right text-[var(--text-tertiary)]">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-3 py-2 text-right text-[var(--text-tertiary)]">
                        {formatUSD(item.unit_price)}
                      </td>
                      <td className="px-3 py-2 text-right text-[var(--text-primary)]">
                        {formatUSD(item.extended)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border)] bg-[var(--overlay-weak)]">
                  <td
                    colSpan={3}
                    className="px-3 py-2 text-right text-[11px] uppercase tracking-wide text-[var(--text-muted)]"
                  >
                    Grand total
                  </td>
                  <td
                    data-testid="grand-total"
                    className="px-3 py-2 text-right font-medium text-[var(--text-primary)]"
                  >
                    {formatUSD(estimate.grand_total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div className="flex justify-end">
          <SendEstimateButton estimateId={estimate.id} />
        </div>
      </div>
    </main>
  );
}
