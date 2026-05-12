"use client";

import {
  FileCheck,
  Building2,
  ClipboardCheck,
  Plug,
  Wrench,
  Flame,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const jurisdictions = [
  { name: "NYC DOB", scope: "Buildings, plumbing, sprinkler" },
  { name: "ConEd", scope: "Service upgrades, gas turn-ons" },
  { name: "NJ DCA", scope: "Mechanical, electrical, plumbing" },
  { name: "NYC DEP", scope: "Backflow, water tap" },
  { name: "Westchester DOB", scope: "Permits, inspections" },
];

const checklistGroups = [
  {
    title: "Boiler replacement",
    icon: Flame,
    items: [
      "Asbestos report on file",
      "Manufacturer cut sheets attached",
      "Combustion air calculations",
      "Chimney liner sizing confirmed",
      "DOB LAA filing required",
    ],
  },
  {
    title: "Service upgrade",
    icon: Plug,
    items: [
      "Load letter submitted to utility",
      "Meter pan spec confirmed",
      "Riser diagram attached",
      "Coordination with ConEd scheduled",
    ],
  },
  {
    title: "Steam to hydronic conversion",
    icon: Wrench,
    items: [
      "Heat-loss calculation",
      "Radiator schedule updated",
      "Near-boiler piping diagram",
      "Mechanical permit application drafted",
    ],
  },
];

function ComingSoonBanner() {
  return (
    <div
      className="flex items-center gap-2 rounded-md border px-3 py-2 mb-6"
      style={{
        background: "var(--overlay-weak)",
        borderColor: "var(--border)",
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ background: "var(--text-muted)" }}
        aria-hidden="true"
      />
      <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
        Coming Q3 2026
      </span>
      <span
        className="text-[12px]"
        style={{ color: "var(--text-faint)" }}
      >
        Preview of permitting features in active development.
      </span>
    </div>
  );
}

function CardShell({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <header
        className="flex items-start justify-between gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <Icon
            className="size-4 mt-0.5 shrink-0"
            style={{ color: "var(--text-tertiary)" }}
          />
          <div className="min-w-0">
            <h2
              className="text-[13px] font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h2>
            <p
              className="text-[12px] mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {description}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] uppercase tracking-wide font-normal shrink-0"
          style={{
            color: "var(--text-muted)",
            borderColor: "var(--border)",
            background: "transparent",
          }}
        >
          Preview
        </Badge>
      </header>
      {children}
    </section>
  );
}

function PermitTrackerCard() {
  const columns = ["Job", "Jurisdiction", "Status", "Submitted"];
  const rows = [0, 1, 2, 3];

  return (
    <CardShell
      title="Permit application tracker"
      description="Every open application, who owns it, and what is blocking it."
      icon={FileCheck}
    >
      <div>
        <div
          className="grid grid-cols-4 gap-4 px-4 py-2"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {columns.map((col) => (
            <div
              key={col}
              className="text-[11px] uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              {col}
            </div>
          ))}
        </div>
        <div>
          {rows.map((i) => (
            <div
              key={i}
              className="grid grid-cols-4 gap-4 px-4 py-3"
              style={{
                borderBottom:
                  i === rows.length - 1 ? "none" : "1px solid var(--border)",
              }}
            >
              {columns.map((col, c) => (
                <div
                  key={col}
                  className="h-3 rounded"
                  style={{
                    background: "var(--overlay-weak)",
                    width: c === 0 ? "85%" : c === 1 ? "60%" : c === 2 ? "45%" : "55%",
                    animation: "permitting-pulse 1.6s ease-in-out infinite",
                    animationDelay: `${(i * 4 + c) * 70}ms`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <div
          className="px-4 py-3 text-[12px]"
          style={{
            color: "var(--text-muted)",
            background: "var(--overlay-weak)",
          }}
        >
          Applications will appear here once integrations with DOB NOW, ACRIS,
          and utility portals are live.
        </div>
      </div>
    </CardShell>
  );
}

function AgencySyncCard() {
  return (
    <CardShell
      title="Agency portal sync"
      description="Auto-pull filing status from city, state, and utility portals."
      icon={Building2}
    >
      <ul>
        {jurisdictions.map((j, i) => (
          <li
            key={j.name}
            className="flex items-center justify-between gap-4 px-4 py-3"
            style={{
              borderBottom:
                i === jurisdictions.length - 1
                  ? "none"
                  : "1px solid var(--border)",
            }}
          >
            <div className="min-w-0">
              <div
                className="text-[13px] font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {j.name}
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {j.scope}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="size-1.5 rounded-full"
                style={{ background: "var(--text-faint)" }}
                aria-hidden="true"
              />
              <span
                className="text-[11px] uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Not connected
              </span>
            </div>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

function ComplianceChecklistCard() {
  return (
    <CardShell
      title="Compliance checklist by job type"
      description="Pre-filing checklists generated from job scope and jurisdiction."
      icon={ClipboardCheck}
    >
      <div>
        {checklistGroups.map((group, gi) => {
          const GroupIcon = group.icon;
          return (
            <div
              key={group.title}
              style={{
                borderBottom:
                  gi === checklistGroups.length - 1
                    ? "none"
                    : "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-2 px-4 py-2.5">
                <GroupIcon
                  className="size-3.5"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <div
                  className="text-[12px] uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  {group.title}
                </div>
              </div>
              <ul className="pb-3">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2.5 px-4 py-1.5"
                  >
                    <span
                      className="size-3.5 rounded border shrink-0"
                      style={{ borderColor: "var(--border)" }}
                      aria-hidden="true"
                    />
                    <span
                      className="text-[13px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

export default function PermittingPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-[15px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Permitting
        </h1>
      </div>

      <ComingSoonBanner />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="lg:col-span-2">
          <PermitTrackerCard />
        </div>
        <AgencySyncCard />
        <ComplianceChecklistCard />
      </div>

      <style>{`
        @keyframes permitting-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}
