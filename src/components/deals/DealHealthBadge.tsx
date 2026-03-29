"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type HealthLevel = "healthy" | "at_risk" | "critical";

interface DealHealthBadgeProps {
  dealId: string;
  stage: string;
  amount: number;
  closeDate: string | null;
  contactId: string | null;
}

/**
 * Calculates deal health based on:
 * - Days until close date (closer = more urgent)
 * - Stage progression (stuck in early stage with near close = bad)
 * - Recent activity (no activity in 7+ days = at risk)
 * - Deal size (larger deals need more attention)
 */
export default function DealHealthBadge({
  dealId,
  stage,
  amount,
  closeDate,
  contactId,
}: DealHealthBadgeProps) {
  const [health, setHealth] = useState<HealthLevel | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function calculate() {
      let points = 100;

      // 1. Close date proximity
      if (closeDate) {
        const daysLeft = Math.ceil(
          (new Date(closeDate).getTime() - Date.now()) / 86400000
        );
        if (daysLeft < 0) points -= 30; // overdue
        else if (daysLeft < 7) points -= 15;
        else if (daysLeft < 14) points -= 5;
      }

      // 2. Stage vs close date alignment
      const earlyStages = ["New", "Qualified"];
      if (closeDate) {
        const daysLeft = Math.ceil(
          (new Date(closeDate).getTime() - Date.now()) / 86400000
        );
        if (earlyStages.includes(stage) && daysLeft < 30) {
          points -= 20; // early stage but closing soon
        }
      }

      // 3. Recent activity check
      if (contactId) {
        const supabase = createClient();
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: recent } = await supabase
          .from("activities")
          .select("id")
          .eq("contact_id", contactId)
          .gte("created_at", weekAgo)
          .limit(1);

        if (!recent?.length) points -= 20; // no recent activity
      }

      // 4. Deal size factor (larger deals need more attention)
      if (amount > 100000) points -= 5;
      if (amount > 200000) points -= 5;

      const clamped = Math.max(0, Math.min(100, points));
      setScore(clamped);

      if (clamped >= 70) setHealth("healthy");
      else if (clamped >= 40) setHealth("at_risk");
      else setHealth("critical");
    }

    calculate();
  }, [dealId, stage, amount, closeDate, contactId]);

  if (!health) return null;

  const colors = {
    healthy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    at_risk: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const labels = {
    healthy: "Healthy",
    at_risk: "At Risk",
    critical: "Critical",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${colors[health]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          health === "healthy"
            ? "bg-emerald-400"
            : health === "at_risk"
              ? "bg-amber-400"
              : "bg-red-400"
        }`}
      />
      {labels[health]} ({score})
    </span>
  );
}
