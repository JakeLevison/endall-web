/**
 * Customer-facing booking confirmation page. Dedicated surface for the
 * booking-confirmation email's "View your appointment details" CTA. Shows
 * only appointment details (service, date/time, address, contractor) —
 * never the estimate line items, totals, or signature pad. That estimate
 * surface still lives at /approve/{token} and is untouched.
 *
 * Resolves the token against the bridge resolver and only renders when
 * the response shape is a booking (voice_jobs.approval_token). Every
 * other resolution path (estimate, miss, infra failure) returns a
 * uniform 404 to keep the token from being an enumeration oracle. Same
 * robots/referrer policy as /approve/{token} so the token never leaks
 * via the Referer header or browser history.
 */

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  isBookingMeta,
  resolveApprovalAnyViaBridge,
  type PublicBookingMeta,
} from "@/lib/approval-bridge";

export const dynamic = "force-dynamic";

const BOOKING_ROBOTS = {
  robots: { index: false, follow: false, nocache: true },
  other: { referrer: "no-referrer" },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  if (!token || token.length < 16) {
    return { title: "Appointment", ...BOOKING_ROBOTS };
  }
  const meta = await resolveApprovalAnyViaBridge(token);
  if (!meta || !isBookingMeta(meta)) {
    return { title: "Appointment", ...BOOKING_ROBOTS };
  }
  const title =
    (meta.status || "").toLowerCase() === "cancelled"
      ? "Appointment cancelled"
      : "Appointment confirmed";
  return { title, ...BOOKING_ROBOTS };
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "the requested time";
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function tenantLabelFromSlug(slug: string): string {
  const cleaned = (slug || "").trim();
  if (!cleaned) return "Your contractor";
  return cleaned
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function isCancelled(status: string | undefined): boolean {
  return (status || "").trim().toLowerCase() === "cancelled";
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 16) {
    notFound();
  }

  const meta = await resolveApprovalAnyViaBridge(token);
  if (!meta || !isBookingMeta(meta)) {
    notFound();
  }

  const hdrs = await headers();
  const tenantSlug = hdrs.get("x-tenant-slug") || meta.tenant_slug || "";
  const tenantName = meta.tenant_name || tenantLabelFromSlug(tenantSlug);
  const tenantPhone = meta.tenant_phone || "";
  const cancelled = isCancelled(meta.status);

  return cancelled ? (
    <CancelledView meta={meta} tenantName={tenantName} tenantPhone={tenantPhone} />
  ) : (
    <ConfirmedView meta={meta} tenantName={tenantName} tenantPhone={tenantPhone} />
  );
}

function ConfirmedView({
  meta,
  tenantName,
  tenantPhone,
}: {
  meta: PublicBookingMeta;
  tenantName: string;
  tenantPhone: string;
}) {
  const rescheduleHref = tenantPhone ? `tel:${tenantPhone.replace(/\s+/g, "")}` : null;
  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-black/5 pb-4 dark:border-white/10">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          {tenantName}
        </p>
        <h1 className="mt-1 text-2xl font-medium text-neutral-900 dark:text-neutral-100">
          Appointment confirmed
        </h1>
        {meta.caller_name ? (
          <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
            For {meta.caller_name}
          </p>
        ) : null}
      </header>

      <section
        data-testid="appointment-details"
        className="rounded-lg border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5"
      >
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Service</dt>
            <dd className="font-medium text-neutral-900 dark:text-neutral-100">
              {meta.job_type || "Service visit"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">When</dt>
            <dd className="font-medium text-neutral-900 dark:text-neutral-100">
              {formatWhen(meta.scheduled_at)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Where</dt>
            <dd className="font-medium text-neutral-900 dark:text-neutral-100">
              {meta.job_address || "The address on file"}
            </dd>
          </div>
          {tenantPhone ? (
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Questions?</dt>
              <dd className="font-medium text-neutral-900 dark:text-neutral-100">
                {tenantPhone}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <p className="text-sm text-neutral-700 dark:text-neutral-300">
        Need to reschedule?{" "}
        {rescheduleHref ? (
          <a
            href={rescheduleHref}
            className="font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
          >
            Pick a new time.
          </a>
        ) : (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            Call us to pick a new time.
          </span>
        )}
      </p>
    </div>
  );
}

function CancelledView({
  meta,
  tenantName,
  tenantPhone,
}: {
  meta: PublicBookingMeta;
  tenantName: string;
  tenantPhone: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-black/5 pb-4 dark:border-white/10">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          {tenantName}
        </p>
        <h1 className="mt-1 text-2xl font-medium text-neutral-900 dark:text-neutral-100">
          This appointment was cancelled
        </h1>
      </header>

      <section className="rounded-lg border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Service</dt>
            <dd className="font-medium text-neutral-900 dark:text-neutral-100">
              {meta.job_type || "Service visit"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Was scheduled for</dt>
            <dd className="font-medium text-neutral-900 dark:text-neutral-100">
              {formatWhen(meta.scheduled_at)}
            </dd>
          </div>
          {meta.job_address ? (
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Where</dt>
              <dd className="font-medium text-neutral-900 dark:text-neutral-100">
                {meta.job_address}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
        {tenantPhone
          ? `If you need to reschedule, please call us at ${tenantPhone}.`
          : "If you need to reschedule, please call us back."}
      </p>
    </div>
  );
}
