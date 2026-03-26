import Link from "next/link";

const features = [
  {
    label: "CRM",
    title: "Every relationship, one view.",
    description:
      "Contacts, companies, deals, pipeline. Custom fields, activity timelines, automatic enrichment.",
  },
  {
    label: "Sequences",
    title: "Outreach on autopilot.",
    description:
      "Multi-step email cadences. Smart scheduling. Personalization tokens. Auto-unenroll on reply.",
  },
  {
    label: "Workflows",
    title: "Automate any process.",
    description:
      "Trigger on any event. Branch on any condition. AI classification, summarization, and research built in.",
  },
  {
    label: "Tasks",
    title: "Ship work, not updates.",
    description:
      "Issues, projects, boards, sprints. Prioritize, assign, and track without the meetings.",
  },
  {
    label: "AI",
    title: "Ask anything.",
    description:
      "Natural language across all your data. Meeting prep. Deal briefs. Follow-up drafts. Account research.",
  },
  {
    label: "Reports",
    title: "Decisions, not dashboards.",
    description:
      "Pipeline analytics. Revenue metrics. Activity tracking. Real-time, always current.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-300 selection:bg-zinc-700">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.04] bg-[#0A0A0B]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-5xl mx-auto">
          <Link href="/" className="text-[15px] font-medium tracking-[-0.01em] text-white">
            endall
          </Link>
          <div className="hidden md:flex items-center gap-7">
            <a href="#features" className="text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors">
              How it works
            </a>
            <a href="#pricing" className="text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors hidden sm:block">
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-[13px] font-medium text-zinc-900 bg-white px-3.5 py-1.5 rounded-md hover:bg-zinc-100 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block mb-6 sm:mb-8 px-2.5 py-0.5 rounded-full border border-white/[0.06] text-[11px] tracking-wide text-zinc-500 uppercase">
            Early access
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-[4.5rem] font-semibold tracking-[-0.035em] leading-[1.1] text-white">
            The AI operating system
            <br />
            <span className="text-zinc-600">for your business</span>
          </h1>
          <p className="mt-4 sm:mt-5 text-[15px] sm:text-[17px] text-zinc-500 max-w-lg mx-auto leading-relaxed tracking-[-0.01em] px-2">
            CRM, email sequences, workflow automation, task management, and AI
            agents. One platform.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
            <Link
              href="/signup"
              className="bg-white text-zinc-900 px-5 py-2.5 rounded-md text-[13px] font-medium hover:bg-zinc-100 transition-colors text-center"
            >
              Start for free
            </Link>
            <a
              href="#features"
              className="border border-white/[0.08] text-zinc-400 px-5 py-2.5 rounded-md text-[13px] font-medium hover:border-white/[0.15] hover:text-zinc-300 transition-all text-center"
            >
              See what&apos;s inside
            </a>
          </div>
        </div>
      </section>

      {/* Divider line */}
      <div className="max-w-5xl mx-auto border-t border-white/[0.04]" />

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 text-center mb-12">
            Platform
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-white/[0.03] rounded-lg overflow-hidden">
            {features.map((feature) => (
              <div
                key={feature.label}
                className="bg-[#0A0A0B] p-7 hover:bg-white/[0.02] transition-colors"
              >
                <div className="text-[11px] font-medium text-zinc-600 uppercase tracking-[0.1em] mb-3">
                  {feature.label}
                </div>
                <h3 className="text-[15px] font-medium text-white tracking-[-0.01em] mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <div className="max-w-5xl mx-auto border-t border-white/[0.04]" />
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 text-center mb-12">
            Getting started
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
            {[
              {
                step: "01",
                title: "Connect",
                description:
                  "Link email, calendar, and tools. Data syncs automatically.",
              },
              {
                step: "02",
                title: "Configure",
                description:
                  "Pipeline stages, sequences, workflows. Templates or custom.",
              },
              {
                step: "03",
                title: "Operate",
                description:
                  "AI handles the routine. You handle the relationships.",
              },
            ].map((item) => (
              <div key={item.step}>
                <div className="text-[11px] font-mono text-zinc-700 mb-2">
                  {item.step}
                </div>
                <h3 className="text-[15px] font-medium text-white tracking-[-0.01em] mb-1.5">
                  {item.title}
                </h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <div className="max-w-5xl mx-auto border-t border-white/[0.04]" />
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 mb-12">
            Pricing
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/[0.03] rounded-lg overflow-hidden">
            {[
              {
                name: "Starter",
                price: "Free",
                sub: "For individuals",
                features: ["500 contacts", "Basic sequences", "AI assistant", "Email sync"],
              },
              {
                name: "Pro",
                price: "$49",
                period: "/user/mo",
                sub: "For teams",
                features: ["Unlimited contacts", "Advanced workflows", "Full automation", "Priority support"],
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                sub: "For organizations",
                features: ["Unlimited everything", "Dedicated instance", "Custom integrations", "SLA"],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-7 text-left ${plan.highlighted ? "bg-white/[0.02]" : "bg-[#0A0A0B]"}`}
              >
                <div className="text-[11px] font-medium text-zinc-600 uppercase tracking-[0.1em] mb-4">
                  {plan.name}
                </div>
                <div className="text-2xl font-semibold text-white tracking-[-0.02em]">
                  {plan.price}
                  {plan.period && (
                    <span className="text-[13px] font-normal text-zinc-600">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-zinc-600 mt-0.5 mb-5">
                  {plan.sub}
                </p>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="text-[13px] text-zinc-500">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="max-w-5xl mx-auto border-t border-white/[0.04]" />
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white mb-3">
            Stop duct-taping tools together.
          </h2>
          <p className="text-[15px] text-zinc-500 mb-8">
            One platform. Three minutes to operational.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-zinc-900 px-6 py-2.5 rounded-md text-[13px] font-medium hover:bg-zinc-100 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-zinc-700">
          <span>Endall AI</span>
          <div className="flex gap-5">
            <a href="mailto:jake@endall.ai" className="hover:text-zinc-500 transition-colors">
              Contact
            </a>
            <a href="#" className="hover:text-zinc-500 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-zinc-500 transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
