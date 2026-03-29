"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Building2, HandCoins, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SearchResult = {
  id: string;
  type: "contact" | "company" | "deal";
  name: string;
  subtitle: string;
  href: string;
};

interface QuickSearchProps {
  open: boolean;
  onClose: () => void;
}

const typeIcon = {
  contact: <Users className="size-4 text-blue-400" />,
  company: <Building2 className="size-4 text-emerald-400" />,
  deal: <HandCoins className="size-4 text-amber-400" />,
};

export default function QuickSearch({ open, onClose }: QuickSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const q = query.trim();
      const items: SearchResult[] = [];

      // Search contacts
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, email, companies(name)")
        .is("merged_into", null)
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(5);

      for (const c of contacts || []) {
        const company = (c.companies as unknown as { name: string } | null)?.name;
        items.push({
          id: c.id,
          type: "contact",
          name: `${c.first_name} ${c.last_name}`,
          subtitle: company || c.email || "",
          href: `/contacts/${c.id}`,
        });
      }

      // Search companies
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, industry")
        .is("merged_into", null)
        .or(`name.ilike.%${q}%,domain.ilike.%${q}%`)
        .limit(5);

      for (const co of companies || []) {
        items.push({
          id: co.id,
          type: "company",
          name: co.name,
          subtitle: co.industry || "",
          href: `/companies/${co.id}`,
        });
      }

      // Search deals
      const { data: deals } = await supabase
        .from("deals")
        .select("id, name, amount, stage")
        .ilike("name", `%${q}%`)
        .limit(5);

      for (const d of deals || []) {
        items.push({
          id: d.id,
          type: "deal",
          name: d.name,
          subtitle: `$${Number(d.amount).toLocaleString()} — ${d.stage}`,
          href: `/deals/${d.id}`,
        });
      }

      setResults(items);
      setSelectedIdx(0);
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      router.push(results[selectedIdx].href);
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 998 }} />
      <div style={{
        position: "fixed",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(500px, 90vw)",
        background: "#111113",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        zIndex: 999,
        overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Search className="size-4 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search contacts, companies, deals..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 15, color: "#fff",
            }}
          />
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X className="size-4 text-zinc-600" />
          </button>
        </div>

        {results.length > 0 && (
          <div style={{ maxHeight: 320, overflowY: "auto", padding: "4px 0" }}>
            {results.map((r, idx) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => { router.push(r.href); onClose(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 16px", background: idx === selectedIdx ? "rgba(255,255,255,0.04)" : "transparent",
                  border: "none", cursor: "pointer", textAlign: "left",
                }}
              >
                {typeIcon[r.type]}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14, color: "#fff", margin: 0 }}>{r.name}</p>
                  <p style={{ fontSize: 12, color: "#666", margin: 0 }}>{r.subtitle}</p>
                </div>
                <span style={{ fontSize: 10, color: "#555", textTransform: "uppercase" }}>{r.type}</span>
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && !loading && (
          <div style={{ padding: "24px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#666" }}>No results for "{query}"</p>
          </div>
        )}
      </div>
    </>
  );
}
