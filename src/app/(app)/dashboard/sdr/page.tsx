"use client";

import { useMemo, useRef, useState } from "react";
import useSWR from "swr";
import {
  Plus,
  Upload,
  RefreshCw,
  Sparkles,
  Users,
  PhoneOutgoing,
  CheckCircle2,
  Percent,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { posthog } from "@/lib/posthog";

// ── types ────────────────────────────────────────────────────────────

type ProspectStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "disqualified"
  | "converted"
  | string;

type Prospect = {
  id: string;
  tenant_id: string;
  company_name: string;
  contact_name: string;
  contact_title?: string | null;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  status: ProspectStatus;
  notes?: string | null;
  last_contacted_at?: string | null;
  created_at?: string | null;
};

type ProspectListResponse = {
  rows?: Prospect[];
  prospects?: Prospect[];
  total?: number;
};

// ── helpers ──────────────────────────────────────────────────────────

const fetcher = async (url: string): Promise<ProspectListResponse> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return res.json();
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  qualified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  disqualified: "bg-red-500/10 text-red-400 border-red-500/20",
  converted: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function statusPill(status: string) {
  const cls =
    STATUS_COLORS[status] ||
    "bg-zinc-500/10 text-[var(--text-tertiary)] border-zinc-500/20";
  return (
    <Badge
      variant="outline"
      className={`text-[11px] font-normal capitalize ${cls}`}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function formatRelative(iso: string | undefined | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// status sort order
function statusWeight(s: string): number {
  switch (s) {
    case "qualified":
      return 0;
    case "converted":
      return 1;
    case "contacted":
      return 2;
    case "new":
      return 3;
    case "disqualified":
      return 4;
    default:
      return 5;
  }
}

type SortKey = "date" | "status";

// ── subcomponents ────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4">
      <div className="flex items-start gap-3">
        <div className="size-7 rounded-md bg-[var(--overlay-soft)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
          <Icon className="size-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            {label}
          </p>
          <p className="mt-1 text-[18px] font-medium text-[var(--text-primary)] tabular-nums">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function AddProspectDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setCompany("");
    setContact("");
    setPhone("");
    setEmail("");
    setNotes("");
    setErrorMsg(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);
    if (!company.trim() || !contact.trim()) {
      setErrorMsg("Company and contact name are required.");
      return;
    }
    setSubmitting(true);
    posthog.capture("sdr_prospect_create_clicked");
    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: company.trim(),
          contact_name: contact.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        setErrorMsg("Could not save prospect. Try again.");
        return;
      }
      reset();
      onCreated();
      onOpenChange(false);
    } catch {
      setErrorMsg("Could not save prospect. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add prospect</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="sdr-company">Company name *</Label>
            <Input
              id="sdr-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Mechanical"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sdr-contact">Contact name *</Label>
            <Input
              id="sdr-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Jane Smith"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sdr-phone">Phone</Label>
              <Input
                id="sdr-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-0100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sdr-email">Email</Label>
              <Input
                id="sdr-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@acme.com"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sdr-notes">Notes</Label>
            <Textarea
              id="sdr-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Met at trade show, asked about commercial mechanical retrofits"
              rows={3}
            />
          </div>
          {errorMsg && (
            <p role="alert" className="text-[12px] text-red-400">
              {errorMsg}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving..." : "Save prospect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── page ─────────────────────────────────────────────────────────────

export default function SdrPage() {
  const { data, error, isLoading, mutate } = useSWR<ProspectListResponse>(
    "/api/prospects?limit=200",
    fetcher,
  );

  const rows: Prospect[] = useMemo(() => {
    if (!data) return [];
    return data.rows ?? data.prospects ?? [];
  }, [data]);

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const sortedRows = useMemo(() => {
    const r = [...rows];
    if (sortKey === "status") {
      r.sort((a, b) => statusWeight(a.status) - statusWeight(b.status));
    } else {
      r.sort((a, b) => {
        const da = a.last_contacted_at || a.created_at || "";
        const db = b.last_contacted_at || b.created_at || "";
        return new Date(db).getTime() - new Date(da).getTime();
      });
    }
    return r;
  }, [rows, sortKey]);

  const stats = useMemo(() => {
    const total = rows.length;
    const contacted = rows.filter((r) =>
      ["contacted", "qualified", "disqualified", "converted"].includes(r.status),
    ).length;
    const qualified = rows.filter((r) =>
      ["qualified", "converted"].includes(r.status),
    ).length;
    const converted = rows.filter((r) => r.status === "converted").length;
    const rate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { total, contacted, qualified, rate };
  }, [rows]);

  const recentActivity = useMemo(() => {
    return rows
      .filter((r) => !!r.last_contacted_at)
      .sort(
        (a, b) =>
          new Date(b.last_contacted_at as string).getTime() -
          new Date(a.last_contacted_at as string).getTime(),
      )
      .slice(0, 8);
  }, [rows]);

  const onEnrich = async (prospect: Prospect) => {
    if (enrichingId) return;
    setEnrichingId(prospect.id);
    posthog.capture("sdr_prospect_enrich_clicked");
    try {
      const res = await fetch(
        `/api/prospects/${encodeURIComponent(prospect.id)}/enrich`,
        { method: "POST" },
      );
      if (res.ok) {
        showToast(`Enriched ${prospect.company_name}.`);
        mutate();
      } else {
        showToast("Enrichment failed. Try again.");
      }
    } catch {
      showToast("Enrichment failed. Try again.");
    } finally {
      setEnrichingId(null);
    }
  };

  const onImportClick = () => fileInputRef.current?.click();

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    posthog.capture("sdr_prospect_import_clicked");
    try {
      const csv = await file.text();
      const res = await fetch("/api/prospects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, source: "csv-upload" }),
      });
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        const count =
          typeof body?.inserted === "number"
            ? body.inserted
            : typeof body?.created === "number"
              ? body.created
              : null;
        showToast(
          count != null
            ? `Imported ${count} ${count === 1 ? "prospect" : "prospects"}.`
            : "Import queued.",
        );
        mutate();
      } else {
        showToast("Import failed. Check the CSV format.");
      }
    } catch {
      showToast("Import failed. Try again.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
            SDR activity
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            Prospects, outbound activity, and pipeline conversion at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus />
            Add prospect
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onImportClick}
            disabled={importing}
          >
            <Upload className={importing ? "animate-pulse" : ""} />
            {importing ? "Importing..." : "Import CSV"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onImportFile}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Prospects" value={stats.total} icon={Users} />
        <StatCard
          label="Contacted"
          value={stats.contacted}
          icon={PhoneOutgoing}
        />
        <StatCard
          label="Qualified"
          value={stats.qualified}
          icon={CheckCircle2}
        />
        <StatCard
          label="Conversion rate"
          value={`${stats.rate}%`}
          icon={Percent}
        />
      </div>

      {error && !isLoading && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] text-[var(--text-primary)]">
              Could not load prospects.
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">
              Refresh the page, or try again in a moment.
            </p>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-[13px] font-medium text-[var(--text-primary)]">
            Prospects
          </h2>
          <div className="flex items-center gap-1" role="group" aria-label="Sort prospects">
            <span className="text-[11px] text-[var(--text-muted)] mr-1">Sort:</span>
            {(["date", "status"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={sortKey === k}
                onClick={() => setSortKey(k)}
                className={`text-[12px] capitalize rounded-md px-2.5 py-1 transition-colors ${
                  sortKey === k
                    ? "bg-[var(--overlay-medium)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--overlay-weak)]"
                }`}
              >
                {k === "date" ? "Last activity" : "Status"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="flex flex-col">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 border-b border-[var(--border)] last:border-b-0 bg-[var(--overlay-weak)] animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : sortedRows.length === 0 && !error ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-8 text-center">
            <Users className="size-6 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[13px] text-[var(--text-primary)] mb-1">
              No prospects yet.
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mb-4">
              Add one manually or import a CSV to get started.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                <Plus />
                Add prospect
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onImportClick}
                disabled={importing}
              >
                <Upload />
                Import CSV
              </Button>
            </div>
          </div>
        ) : sortedRows.length > 0 ? (
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--border)] hover:bg-transparent">
                  <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                    Contact
                  </TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)] hidden md:table-cell">
                    Company
                  </TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                    Status
                  </TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)] hidden md:table-cell">
                    Source
                  </TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)] hidden lg:table-cell">
                    Last activity
                  </TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-[var(--border)] hover:bg-[var(--overlay-weak)] transition-colors"
                  >
                    <TableCell className="text-[13px] text-[var(--text-primary)] font-medium py-2.5">
                      <div className="flex flex-col">
                        <span>{row.contact_name || "–"}</span>
                        {row.contact_title ? (
                          <span className="text-[11px] text-[var(--text-muted)] font-normal">
                            {row.contact_title}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-[13px] text-[var(--text-tertiary)] py-2.5 hidden md:table-cell">
                      {row.company_name || "–"}
                    </TableCell>
                    <TableCell className="py-2.5">
                      {statusPill(row.status)}
                    </TableCell>
                    <TableCell className="text-[13px] text-[var(--text-muted)] py-2.5 hidden md:table-cell capitalize">
                      {row.source || "–"}
                    </TableCell>
                    <TableCell className="text-[13px] text-[var(--text-muted)] py-2.5 hidden lg:table-cell">
                      {formatRelative(row.last_contacted_at) || "–"}
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEnrich(row)}
                        disabled={enrichingId === row.id}
                      >
                        {enrichingId === row.id ? (
                          <RefreshCw className="animate-spin" />
                        ) : (
                          <Sparkles />
                        )}
                        {enrichingId === row.id ? "Enriching..." : "Enrich"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-[13px] font-medium text-[var(--text-primary)]">
          Recent outbound activity
        </h2>
        {recentActivity.length === 0 ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-6 text-center">
            <PhoneOutgoing className="size-5 text-[var(--text-muted)] mx-auto mb-2" />
            <p className="text-[12px] text-[var(--text-muted)]">
              No outbound activity yet. Contact attempts will appear here once
              prospects are dialed or emailed.
            </p>
          </div>
        ) : (
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--border)] hover:bg-transparent">
                  <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                    Contact
                  </TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)] hidden md:table-cell">
                    Company
                  </TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                    Outcome
                  </TableHead>
                  <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)] text-right">
                    When
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((row) => (
                  <TableRow
                    key={`activity-${row.id}`}
                    className="border-[var(--border)] hover:bg-transparent"
                  >
                    <TableCell className="text-[13px] text-[var(--text-primary)] font-medium py-2.5">
                      {row.contact_name || "–"}
                    </TableCell>
                    <TableCell className="text-[13px] text-[var(--text-tertiary)] py-2.5 hidden md:table-cell">
                      {row.company_name || "–"}
                    </TableCell>
                    <TableCell className="py-2.5">
                      {statusPill(row.status)}
                    </TableCell>
                    <TableCell className="text-[13px] text-[var(--text-muted)] py-2.5 text-right">
                      {formatRelative(row.last_contacted_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <AddProspectDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => {
          showToast("Prospect added.");
          mutate();
        }}
      />

      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: "var(--surface-hover)",
            border: "1px solid var(--overlay-medium)",
            borderRadius: 12,
            padding: "12px 18px",
            color: "var(--text-primary)",
            fontSize: 13,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            maxWidth: 360,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
