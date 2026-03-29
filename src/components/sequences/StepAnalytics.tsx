"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type StepStats = {
  step_id: string;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
};

interface StepAnalyticsProps {
  sequenceId: string;
  stepId: string;
  stepType: string;
}

export default function StepAnalytics({ sequenceId, stepId, stepType }: StepAnalyticsProps) {
  const [stats, setStats] = useState<StepStats | null>(null);

  useEffect(() => {
    if (stepType !== "email") return;

    async function fetchStats() {
      const supabase = createClient();

      // Try sequence_stats table first (pre-aggregated)
      const { data: aggData } = await supabase
        .from("sequence_stats")
        .select("*")
        .eq("sequence_id", sequenceId)
        .eq("step_id", stepId)
        .single();

      if (aggData) {
        setStats({
          step_id: stepId,
          sent: aggData.sent_count || 0,
          opened: aggData.opened_count || 0,
          clicked: aggData.clicked_count || 0,
          replied: aggData.replied_count || 0,
          bounced: aggData.bounced_count || 0,
        });
        return;
      }

      // Fallback: count from email_events directly
      const { data: events } = await supabase
        .from("email_events")
        .select("event_type")
        .eq("sequence_id", sequenceId)
        .eq("step_id", stepId);

      if (events) {
        const counts = { sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0 };
        for (const e of events) {
          const t = e.event_type as keyof typeof counts;
          if (t in counts) counts[t]++;
        }
        setStats({ step_id: stepId, ...counts });
      }
    }

    fetchStats();
  }, [sequenceId, stepId, stepType]);

  if (stepType !== "email" || !stats) return null;
  if (stats.sent === 0) return null;

  const openRate = stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(1) : "0";
  const replyRate = stats.sent > 0 ? ((stats.replied / stats.sent) * 100).toFixed(1) : "0";

  return (
    <div className="flex items-center gap-3 mt-2">
      <Stat label="Sent" value={stats.sent} />
      <Stat label="Opened" value={`${openRate}%`} />
      <Stat label="Replied" value={`${replyRate}%`} />
      {stats.bounced > 0 && <Stat label="Bounced" value={stats.bounced} accent="text-red-400" />}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-zinc-600">{label}:</span>
      <span className={`text-[11px] font-medium ${accent || "text-zinc-400"}`}>{value}</span>
    </div>
  );
}
