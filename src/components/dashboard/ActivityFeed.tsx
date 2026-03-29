"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, Calendar, FileText, Clock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type FeedItem = {
  id: string;
  type: string;
  subject: string;
  contactName: string;
  contactId: string | null;
  time: string;
};

const typeIcon: Record<string, React.ReactNode> = {
  email: <Mail className="size-3.5" />,
  call: <Phone className="size-3.5" />,
  meeting: <Calendar className="size-3.5" />,
  note: <FileText className="size-3.5" />,
  task: <Clock className="size-3.5" />,
};

const typeColor: Record<string, string> = {
  email: "bg-blue-500/10 text-blue-400",
  call: "bg-amber-500/10 text-amber-400",
  meeting: "bg-purple-500/10 text-purple-400",
  note: "bg-emerald-500/10 text-emerald-400",
  task: "bg-zinc-500/10 text-zinc-400",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("activities")
        .select("id, type, subject, contact_id, created_at, contacts(first_name, last_name)")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        setItems(
          data.map((a: Record<string, unknown>) => {
            const contact = a.contacts as unknown as { first_name: string; last_name: string } | null;
            return {
              id: a.id as string,
              type: (a.type as string) || "note",
              subject: (a.subject as string) || "",
              contactName: contact ? `${contact.first_name} ${contact.last_name}` : "",
              contactId: a.contact_id as string | null,
              time: (a.created_at as string) || "",
            };
          })
        );
      }
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <div className="border border-white/[0.04] bg-white/[0.01] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <h3 className="text-[13px] font-medium text-white">Recent Activity</h3>
      </div>
      <div>
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-0"
          >
            <div className={`size-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${typeColor[item.type] || typeColor.note}`}>
              {typeIcon[item.type] || typeIcon.note}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-white truncate">{item.subject}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {item.contactId ? (
                  <Link href={`/contacts/${item.contactId}`} className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
                    {item.contactName}
                  </Link>
                ) : (
                  <span className="text-[11px] text-zinc-600">{item.contactName}</span>
                )}
                <span className="text-[11px] text-zinc-700">{item.time ? timeAgo(item.time) : ""}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
