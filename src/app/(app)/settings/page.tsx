"use client";

import { useState, useEffect } from "react";
import {
  User,
  Users,
  Plug,
  CreditCard,
  ListTree,
  Mail,
  Calendar,
  MessageSquare,
  Send,
  Link,
  Webhook,
  Check,
  Plus,
  Loader2,
  Building2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

/* ─── Company Tab ─────────────────────────────────────────────────── */
//
// Demo-time company switcher. Reads + writes to the bridge's
// /settings/company endpoint (company_settings table). When Jake changes
// "Patriot Electric" to "Mercer Mechanical" here, the next voice call uses
// that name without a Railway redeploy.

type CompanySettings = {
  company_id: string;
  company_name: string;
  phone_greeting: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  timezone: string;
  industry: string;
  city: string;
  state: string;
  corridor: string;
  briefing_email: string;
  briefing_time: string;
};

const EMPTY_COMPANY: CompanySettings = {
  company_id: "default",
  company_name: "",
  phone_greeting: "",
  owner_name: "",
  owner_email: "",
  owner_phone: "",
  timezone: "America/New_York",
  industry: "",
  city: "",
  state: "",
  corridor: "",
  briefing_email: "",
  briefing_time: "06:00",
};

function CompanyTab() {
  const [data, setData] = useState<CompanySettings>(EMPTY_COMPANY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch("/api/settings/company?company_id=default", {
          cache: "no-store",
        });
        const body = await resp.json();
        if (!resp.ok) {
          setError(body.detail || body.error || "Could not load company settings");
        } else {
          setData({ ...EMPTY_COMPANY, ...body });
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (key: keyof CompanySettings) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setData((prev) => ({ ...prev, [key]: e.target.value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const resp = await fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await resp.json();
      if (!resp.ok) {
        setError(body.detail || body.error || "Save failed");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        // update local state from server-returned row if provided
        if (body.settings) {
          setData({ ...EMPTY_COMPANY, ...body.settings });
        }
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="size-4 animate-spin text-[var(--text-muted)] mx-auto" />
      </div>
    );
  }

  const field = (
    key: keyof CompanySettings,
    label: string,
    placeholder?: string,
    disabled = false
  ) => (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </Label>
      <Input
        value={(data[key] as string) || ""}
        onChange={handleChange(key)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus-visible:ring-white/10 disabled:opacity-60"
      />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-[13px] font-medium text-[var(--text-primary)] mb-1">Company</h2>
        <p className="text-[11px] text-[var(--text-muted)]">
          Controls what the voice agent says, which address the briefing ships
          to, and what Ask Endall calls your business. Saved instantly — takes
          effect on the next call or briefing.
        </p>
      </div>
      <Separator className="bg-[var(--overlay-soft)]" />

      {error && (
        <div className="px-3 py-2 rounded-md border border-red-500/30 bg-red-500/10 text-[12px] text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field("company_name", "Company name", "Patriot Electric")}
          {field("company_id", "Company ID", "default", true)}
          {field("industry", "Industry", "electrical")}
          {field("timezone", "Timezone", "America/New_York")}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Phone greeting
          </Label>
          <Input
            value={data.phone_greeting || ""}
            onChange={handleChange("phone_greeting")}
            placeholder="Thanks for calling {{company_name}}, how can I help?"
            className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus-visible:ring-white/10"
          />
          <p className="text-[10px] text-[var(--text-muted)]">
            {"{{company_name}}"} is replaced at call time.
          </p>
        </div>

        <Separator className="bg-[var(--overlay-soft)]" />

        <div>
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-3">
            Owner
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("owner_name", "Owner name", "Jake Levison")}
            {field("owner_email", "Owner email", "jake@endall.ai")}
            {field("owner_phone", "Owner phone", "(203) 610-9399")}
          </div>
        </div>

        <Separator className="bg-[var(--overlay-soft)]" />

        <div>
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-3">
            Location
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field("city", "City", "Ashburn")}
            {field("state", "State", "VA")}
            {field("corridor", "Corridor", "northern_virginia")}
          </div>
        </div>

        <Separator className="bg-[var(--overlay-soft)]" />

        <div>
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-3">
            Daily briefing
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("briefing_email", "Briefing email", "jake@endall.ai")}
            {field("briefing_time", "Briefing time", "06:00")}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-4 disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="size-3.5 animate-spin mr-1" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="size-3.5 mr-1" />
              Saved
            </>
          ) : (
            "Save changes"
          )}
        </Button>
        {saved && (
          <span className="text-[11px] text-emerald-400 animate-in fade-in">
            Live on the next call.
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Profile Tab ─────────────────────────────────────────────────── */

function ProfileTab() {
  const [name, setName] = useState("Jake Levison");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-[13px] font-medium text-[var(--text-primary)] mb-1">Profile</h2>
        <p className="text-[11px] text-[var(--text-muted)]">Manage your personal information.</p>
      </div>
      <Separator className="bg-[var(--overlay-soft)]" />
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="bg-[var(--overlay-medium)] text-[15px] font-medium text-[var(--text-secondary)]">
            JL
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-[13px] text-[var(--text-primary)] font-medium">Jake Levison</p>
          <p className="text-[11px] text-[var(--text-muted)]">Owner</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Full name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] focus-visible:ring-white/10"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Email</Label>
          <Input
            value="jake@endall.ai"
            disabled
            className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-muted)] disabled:opacity-60"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Role</Label>
          <div className="h-8 flex items-center px-3 rounded-md border border-[var(--border)] bg-[var(--overlay-weak)]">
            <span className="text-[13px] text-[var(--text-tertiary)]">Owner</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-4"
        >
          {saved ? (
            <>
              <Check className="size-3.5 mr-1" />
              Saved!
            </>
          ) : (
            "Save changes"
          )}
        </Button>
        {saved && (
          <span className="text-[11px] text-emerald-400 animate-in fade-in">
            Changes saved successfully.
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Team Tab ────────────────────────────────────────────────────── */

function TeamTab() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  const members = [
    { name: "Jake Levison", email: "jake@endall.ai", role: "Owner", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-medium text-[var(--text-primary)] mb-1">Team</h2>
          <p className="text-[11px] text-[var(--text-muted)]">Manage team members and their roles.</p>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-3"
        >
          <Plus className="size-4 mr-1" />
          Invite member
        </Button>
      </div>
      <Separator className="bg-[var(--overlay-soft)]" />
      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[var(--border)] hover:bg-transparent">
              <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Name</TableHead>
              <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Email</TableHead>
              <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Role</TableHead>
              <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.email} className="border-[var(--border)] hover:bg-[var(--overlay-weak)] transition-colors">
                <TableCell className="text-[13px] text-[var(--text-primary)] font-medium py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-6">
                      <AvatarFallback className="bg-[var(--overlay-medium)] text-[9px] text-[var(--text-tertiary)]">
                        {m.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {m.name}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[var(--text-tertiary)] py-2.5">{m.email}</TableCell>
                <TableCell className="py-2.5">
                  <Badge variant="outline" className="text-[11px] font-normal bg-purple-500/10 text-purple-400 border-purple-500/20">
                    {m.role}
                  </Badge>
                </TableCell>
                <TableCell className="py-2.5">
                  <Badge variant="outline" className="text-[11px] font-normal bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    {m.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-[#0F0F10] border-[var(--border)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-[var(--text-primary)]">Invite team member</DialogTitle>
            <DialogDescription className="text-[12px] text-[var(--text-muted)]">
              Send an invitation to join your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Email address</Label>
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus-visible:ring-white/10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F0F10] border-[var(--border)]">
                  <SelectItem value="admin" className="text-[13px] text-[var(--text-secondary)]">Admin</SelectItem>
                  <SelectItem value="member" className="text-[13px] text-[var(--text-secondary)]">Member</SelectItem>
                  <SelectItem value="viewer" className="text-[13px] text-[var(--text-secondary)]">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setInviteOpen(false)}
                className="text-[13px] h-8 px-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--overlay-soft)]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setInviteOpen(false)}
                className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-4"
              >
                Send invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Integrations Tab ────────────────────────────────────────────── */

const integrations = [
  { name: "Gmail", description: "Sync emails and send messages from your CRM.", icon: Mail, connected: false },
  { name: "Google Calendar", description: "Sync meetings and schedule events.", icon: Calendar, connected: false },
  { name: "Slack", description: "Get notifications and updates in Slack.", icon: MessageSquare, connected: false },
  { name: "Telegram", description: "Receive alerts and control via Telegram.", icon: Send, connected: false },
  { name: "Zoho Mail", description: "Connect your Zoho Mail account.", icon: Mail, connected: false },
  { name: "Brevo", description: "Email campaigns and marketing automation.", icon: Mail, connected: false },
  { name: "LinkedIn", description: "Import contacts and track engagement.", icon: Link, connected: false },
  { name: "Webhooks", description: "Send and receive data via HTTP webhooks.", icon: Webhook, connected: false },
];

function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[13px] font-medium text-[var(--text-primary)] mb-1">Integrations</h2>
        <p className="text-[11px] text-[var(--text-muted)]">Connect external services to your workspace.</p>
      </div>
      <Separator className="bg-[var(--overlay-soft)]" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {integrations.map((int) => (
          <div
            key={int.name}
            className="p-4 rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] hover:bg-[var(--overlay-weak)] transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="size-9 rounded-lg bg-[var(--overlay-soft)] border border-[var(--border)] flex items-center justify-center">
                <int.icon className="size-4 text-[var(--text-tertiary)]" />
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] font-normal ${
                  int.connected
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-zinc-500/10 text-[var(--text-muted)] border-zinc-500/20"
                }`}
              >
                {int.connected ? "Connected" : "Not connected"}
              </Badge>
            </div>
            <p className="text-[13px] text-[var(--text-primary)] font-medium mb-1">{int.name}</p>
            <p className="text-[11px] text-[var(--text-muted)] mb-3 leading-relaxed">{int.description}</p>
            <Button
              variant="ghost"
              className="h-7 px-3 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--overlay-soft)] bg-transparent"
            >
              Connect
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Billing Tab ─────────────────────────────────────────────────── */

function BillingTab() {
  const [counts, setCounts] = useState({ contacts: 0, companies: 0, deals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const supabase = createClient();
        const [c, co, d] = await Promise.all([
          supabase.from("contacts").select("id", { count: "exact", head: true }),
          supabase.from("companies").select("id", { count: "exact", head: true }),
          supabase.from("deals").select("id", { count: "exact", head: true }),
        ]);
        setCounts({
          contacts: c.count ?? 0,
          companies: co.count ?? 0,
          deals: d.count ?? 0,
        });
      } catch {
        // Tables may not exist yet
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
  }, []);

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-[13px] font-medium text-[var(--text-primary)] mb-1">Billing</h2>
        <p className="text-[11px] text-[var(--text-muted)]">Manage your plan and view usage.</p>
      </div>
      <Separator className="bg-[var(--overlay-soft)]" />

      {/* Current plan */}
      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] text-[var(--text-primary)] font-medium">Founder Plan</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Active</p>
          </div>
          <Badge variant="outline" className="text-[10px] font-normal bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Active
          </Badge>
        </div>
        <Separator className="bg-[var(--overlay-soft)] my-3" />
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] text-[var(--text-muted)] mb-1">Contacts</p>
            <p className="text-[15px] font-medium text-[var(--text-primary)]">
              {loading ? <Loader2 className="size-3.5 animate-spin text-[var(--text-muted)]" /> : counts.contacts.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--text-muted)] mb-1">Companies</p>
            <p className="text-[15px] font-medium text-[var(--text-primary)]">
              {loading ? <Loader2 className="size-3.5 animate-spin text-[var(--text-muted)]" /> : counts.companies.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--text-muted)] mb-1">Deals</p>
            <p className="text-[15px] font-medium text-[var(--text-primary)]">
              {loading ? <Loader2 className="size-3.5 animate-spin text-[var(--text-muted)]" /> : counts.deals.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <Button
        disabled
        className="bg-[var(--overlay-soft)] text-[var(--text-muted)] text-[13px] h-8 px-4 cursor-not-allowed"
      >
        Upgrade plan — Coming soon
      </Button>
    </div>
  );
}

/* ─── Custom Fields Tab ───────────────────────────────────────────── */

type CustomField = {
  id: string;
  object_type: string;
  field_name: string;
  field_label: string;
  field_type: string;
  required: boolean;
};

function CustomFieldsTab() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newField, setNewField] = useState({
    object_type: "contact",
    field_name: "",
    field_label: "",
    field_type: "text",
  });
  const [saving, setSaving] = useState(false);

  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;

  const fetchFields = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("custom_field_definitions")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setFields(data as CustomField[]);
    } catch {
      // Table may not exist yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleAdd = async () => {
    if (!newField.field_name || !newField.field_label) return;
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from("custom_field_definitions").insert({
        tenant_id: tenantId,
        object_type: newField.object_type,
        field_name: newField.field_name.toLowerCase().replace(/\s+/g, "_"),
        field_label: newField.field_label,
        field_type: newField.field_type,
        required: false,
      });
      setAddOpen(false);
      setNewField({ object_type: "contact", field_name: "", field_label: "", field_type: "text" });
      await fetchFields();
    } catch {
      // Silently handle
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-medium text-[var(--text-primary)] mb-1">Custom Fields</h2>
          <p className="text-[11px] text-[var(--text-muted)]">Define custom fields for your CRM objects.</p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-3"
        >
          <Plus className="size-4 mr-1" />
          Add field
        </Button>
      </div>
      <Separator className="bg-[var(--overlay-soft)]" />

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="size-4 animate-spin text-[var(--text-muted)] mx-auto" />
        </div>
      ) : fields.length === 0 ? (
        <div className="py-16 text-center">
          <div className="size-10 rounded-lg bg-[var(--overlay-soft)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
            <ListTree className="size-5 text-[var(--text-muted)]" />
          </div>
          <p className="text-[13px] text-[var(--text-muted)] mb-1">No custom fields</p>
          <p className="text-[11px] text-[var(--text-muted)]">Add custom fields to extend your CRM objects.</p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--border)] hover:bg-transparent">
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Field Name</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Object Type</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Field Type</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Required</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((f) => (
                <TableRow key={f.id} className="border-[var(--border)] hover:bg-[var(--overlay-weak)] transition-colors">
                  <TableCell className="text-[13px] text-[var(--text-primary)] font-medium py-2.5">
                    <div>
                      <span>{f.field_label}</span>
                      <span className="text-[11px] text-[var(--text-muted)] ml-2">{f.field_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant="outline" className="text-[11px] font-normal bg-blue-500/10 text-blue-400 border-blue-500/20 capitalize">
                      {f.object_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] text-[var(--text-tertiary)] py-2.5 capitalize">{f.field_type}</TableCell>
                  <TableCell className="text-[13px] text-[var(--text-muted)] py-2.5">{f.required ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#0F0F10] border-[var(--border)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-[var(--text-primary)]">Add custom field</DialogTitle>
            <DialogDescription className="text-[12px] text-[var(--text-muted)]">
              Create a new custom field for a CRM object type.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Object type</Label>
              <Select value={newField.object_type} onValueChange={(v) => setNewField((p) => ({ ...p, object_type: v }))}>
                <SelectTrigger className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F0F10] border-[var(--border)]">
                  <SelectItem value="contact" className="text-[13px] text-[var(--text-secondary)]">Contact</SelectItem>
                  <SelectItem value="company" className="text-[13px] text-[var(--text-secondary)]">Company</SelectItem>
                  <SelectItem value="deal" className="text-[13px] text-[var(--text-secondary)]">Deal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Field label</Label>
              <Input
                value={newField.field_label}
                onChange={(e) => setNewField((p) => ({ ...p, field_label: e.target.value }))}
                placeholder="e.g. LinkedIn URL"
                className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus-visible:ring-white/10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Field name (key)</Label>
              <Input
                value={newField.field_name}
                onChange={(e) => setNewField((p) => ({ ...p, field_name: e.target.value }))}
                placeholder="e.g. linkedin_url"
                className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus-visible:ring-white/10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Field type</Label>
              <Select value={newField.field_type} onValueChange={(v) => setNewField((p) => ({ ...p, field_type: v }))}>
                <SelectTrigger className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F0F10] border-[var(--border)]">
                  <SelectItem value="text" className="text-[13px] text-[var(--text-secondary)]">Text</SelectItem>
                  <SelectItem value="number" className="text-[13px] text-[var(--text-secondary)]">Number</SelectItem>
                  <SelectItem value="date" className="text-[13px] text-[var(--text-secondary)]">Date</SelectItem>
                  <SelectItem value="boolean" className="text-[13px] text-[var(--text-secondary)]">Boolean</SelectItem>
                  <SelectItem value="select" className="text-[13px] text-[var(--text-secondary)]">Select</SelectItem>
                  <SelectItem value="url" className="text-[13px] text-[var(--text-secondary)]">URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setAddOpen(false)}
                className="text-[13px] h-8 px-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--overlay-soft)]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={saving || !newField.field_name || !newField.field_label}
                className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-4 disabled:opacity-40"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                Add field
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Settings Page ───────────────────────────────────────────────── */

const tabs = [
  { value: "company", label: "Company", icon: Building2 },
  { value: "profile", label: "Profile", icon: User },
  { value: "team", label: "Team", icon: Users },
  { value: "integrations", label: "Integrations", icon: Plug },
  { value: "billing", label: "Billing", icon: CreditCard },
  { value: "custom-fields", label: "Custom Fields", icon: ListTree },
];

export default function SettingsPage() {
  return (
    <div className="p-6 bg-[#0A0A0B] min-h-full">
      <h1 className="text-[15px] font-medium text-[var(--text-primary)] mb-6">Settings</h1>

      <Tabs defaultValue="company">
        <TabsList className="bg-[var(--overlay-soft)] border border-[var(--border)] h-8 mb-6">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-[13px] text-[var(--text-muted)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:bg-[var(--overlay-medium)] h-6 px-3 gap-1.5"
            >
              <tab.icon className="size-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="company">
          <CompanyTab />
        </TabsContent>
        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="team">
          <TeamTab />
        </TabsContent>
        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>
        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>
        <TabsContent value="custom-fields">
          <CustomFieldsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
