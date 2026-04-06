"use client";

import { useState } from "react";
import { ArrowRight, Check, Building2, Users, Mail, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  href: string;
};

const STEPS: Step[] = [
  {
    id: "company",
    title: "Set up your company",
    description: "Add your company name, domain, and industry",
    icon: <Building2 className="size-5" />,
    action: "Go to Settings",
    href: "/settings",
  },
  {
    id: "contacts",
    title: "Import your contacts",
    description: "Upload a CSV or add contacts manually",
    icon: <Users className="size-5" />,
    action: "Add Contacts",
    href: "/contacts",
  },
  {
    id: "sequence",
    title: "Create your first sequence",
    description: "Set up a multi-step email cadence",
    icon: <Mail className="size-5" />,
    action: "Create Sequence",
    href: "/sequences",
  },
  {
    id: "workflow",
    title: "Build a workflow",
    description: "Automate a process with triggers and actions",
    icon: <Zap className="size-5" />,
    action: "Create Workflow",
    href: "/workflows",
  },
];

interface WelcomeWizardProps {
  completedSteps?: string[];
  onDismiss: () => void;
}

export default function WelcomeWizard({ completedSteps = [], onDismiss }: WelcomeWizardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const completed = new Set(completedSteps);
  const progress = completed.size / STEPS.length;

  return (
    <div className="border border-[var(--border)] bg-[var(--overlay-weak)] rounded-lg p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Welcome to endall</h2>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
            Complete these steps to get started
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-[12px] h-7 text-[var(--text-muted)] border-[var(--border)] bg-[var(--overlay-weak)]"
          onClick={() => { setDismissed(true); onDismiss(); }}
        >
          Dismiss
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--overlay-soft)] rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STEPS.map((step) => {
          const done = completed.has(step.id);
          return (
            <a
              key={step.id}
              href={step.href}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                done
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-[var(--border)] bg-[var(--overlay-weak)] hover:bg-[var(--overlay-soft)]"
              }`}
            >
              <div
                className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                  done ? "bg-emerald-500/10 text-emerald-400" : "bg-[var(--overlay-soft)] text-[var(--text-tertiary)]"
                }`}
              >
                {done ? <Check className="size-5" /> : step.icon}
              </div>
              <div className="min-w-0">
                <p className={`text-[13px] font-medium ${done ? "text-emerald-400" : "text-[var(--text-primary)]"}`}>
                  {step.title}
                </p>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">{step.description}</p>
                {!done && (
                  <span className="inline-flex items-center gap-1 text-[12px] text-[var(--text-tertiary)] mt-1.5">
                    {step.action}
                    <ArrowRight className="size-3" />
                  </span>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
