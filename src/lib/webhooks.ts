/**
 * Webhook Trigger System
 *
 * Fires HTTP POST to configured URLs when CRM records are created, updated, or deleted.
 * Webhooks are configured per-tenant in the webhook_configs table.
 *
 * Usage (in API routes or server actions):
 *   await fireWebhooks(supabase, tenantId, "contact.created", { id, first_name, ... });
 */

import { SupabaseClient } from "@supabase/supabase-js";

export type WebhookEventType =
  | "contact.created"
  | "contact.updated"
  | "contact.deleted"
  | "company.created"
  | "company.updated"
  | "company.deleted"
  | "deal.created"
  | "deal.updated"
  | "deal.stage_changed"
  | "deal.deleted"
  | "activity.created"
  | "sequence.enrollment.created"
  | "sequence.enrollment.replied"
  | "task.created"
  | "task.completed";

type WebhookConfig = {
  id: string;
  url: string;
  events: string[];
  secret: string | null;
  is_active: boolean;
};

/**
 * Fire all matching webhooks for a given event.
 * Non-blocking — failures are logged but don't throw.
 */
export async function fireWebhooks(
  supabase: SupabaseClient,
  tenantId: string,
  event: WebhookEventType,
  payload: Record<string, unknown>
): Promise<void> {
  // Fetch active webhook configs that subscribe to this event
  const { data: configs, error } = await supabase
    .from("webhook_configs")
    .select("id, url, events, secret, is_active")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (error || !configs?.length) return;

  const matching = configs.filter(
    (c: WebhookConfig) =>
      c.events.includes(event) || c.events.includes("*")
  );

  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  // Fire all webhooks in parallel, log failures
  await Promise.allSettled(
    matching.map(async (config: WebhookConfig) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Endall-Event": event,
      };

      // HMAC signature if secret is configured
      if (config.secret) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(config.secret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
        headers["X-Endall-Signature"] = Array.from(new Uint8Array(sig))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }

      try {
        const resp = await fetch(config.url, {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        // Log the delivery attempt
        await supabase.from("webhook_deliveries").insert({
          tenant_id: tenantId,
          webhook_config_id: config.id,
          event,
          status: resp.ok ? "success" : "failed",
          status_code: resp.status,
          payload: JSON.parse(body),
        });
      } catch (err) {
        await supabase.from("webhook_deliveries").insert({
          tenant_id: tenantId,
          webhook_config_id: config.id,
          event,
          status: "error",
          status_code: 0,
          error_message: err instanceof Error ? err.message : "Unknown error",
          payload: JSON.parse(body),
        });
      }
    })
  );
}
