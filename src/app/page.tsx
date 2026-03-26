import Link from "next/link";

const features = [
  {
    label: "CRM",
    title: "Every relationship, one view.",
    description:
      "Contacts, companies, deals, and pipeline. Custom fields, activity timelines, automatic enrichment. See every interaction in context.",
  },
  {
    label: "Sequences",
    title: "Outreach that runs itself.",
    description:
      "Multi-step email cadences with smart scheduling, personalization tokens, and auto-unenroll on reply. A/B test subject lines. Track every open and click.",
  },
  {
    label: "Workflows",
    title: "Automate any business process.",
    description:
      "Trigger on any event. Branch on any condition. Execute any action. AI-powered classification, summarization, and research — built into every workflow.",
  },
  {
    label: "Tasks",
    title: "Ship work, not status updates.",
    description:
      "Issues, projects, boards, and sprints. Prioritize what matters, assign with one click, track progress without meetings.",
  },
  {
    label: "AI Assistant",
    title: "Ask anything about your business.",
    description:
      'Natural language interface across all your data. "Prep me for my meeting with Acme." "Draft a follow-up to Sarah." "What deals are at risk?"',
  },
  {
    label: "Reports",
    title: "Decisions backed by data.",
    description:
      "Pipeline analytics, revenue metrics, activity tracking. Real-time dashboards that update as your data changes.",
  },
];

const logos = [
  "Endall HVAC",
  "PHT Investment Group",
  "Independence Point Advisors",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-3 max-w-6xl mx-auto">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-white"
          >
            endall
          </Link>
          <div className="hidden sm:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-white text-zinc-900 px-4 py-1.5 rounded-md hover:bg-zinc-200 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-3 py-1 rounded-full border border-zinc-700 text-xs text-zinc-400">
            Now in early access
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1]">
            The AI operating system
            <br />
            <span className="text-zinc-500">for your business.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            CRM, email sequences, workflow automation, task management, and AI
            agents. One platform. No duct tape.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="bg-white text-zinc-900 px-6 py-3 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Start for free
            </Link>
            <a
              href="#features"
              className="border border-zinc-700 text-zinc-300 px-6 py-3 rounded-md text-sm font-medium hover:bg-zinc-900 transition-colors"
            >
              See what&apos;s inside
            </a>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-12 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-widest text-zinc-600 mb-6">
            Built by operators, for operators
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-zinc-500">
            {logos.map((name) => (
              <span key={name} className="whitespace-nowrap">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need.
              <br />
              <span className="text-zinc-500">Nothing you don&apos;t.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800/50 rounded-xl overflow-hidden">
            {features.map((feature) => (
              <div
                key={feature.label}
                className="bg-zinc-950 p-8 hover:bg-zinc-900/50 transition-colors"
              >
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                  {feature.label}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="py-24 px-6 border-t border-zinc-800/50"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-16">
            Three minutes to operational.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Connect",
                description:
                  "Link your email, calendar, and tools. Endall syncs your contacts, conversations, and data automatically.",
              },
              {
                step: "02",
                title: "Configure",
                description:
                  "Set up your pipeline stages, sequences, and workflows. Start from templates or build custom.",
              },
              {
                step: "03",
                title: "Operate",
                description:
                  "AI agents handle the routine. You focus on relationships, deals, and decisions that matter.",
              },
            ].map((item) => (
              <div key={item.step}>
                <div className="text-xs font-mono text-zinc-600 mb-3">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing placeholder */}
      <section
        id="pricing"
        className="py-24 px-6 border-t border-zinc-800/50"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Simple pricing. Start free.
          </h2>
          <p className="text-zinc-400 mb-10">
            No credit card required. Upgrade when you&apos;re ready.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800/50 rounded-xl overflow-hidden max-w-3xl mx-auto">
            {[
              {
                name: "Starter",
                price: "Free",
                description: "For individuals getting started",
                features: [
                  "Up to 500 contacts",
                  "Basic sequences",
                  "AI assistant",
                  "Email integration",
                ],
              },
              {
                name: "Pro",
                price: "$49",
                period: "/user/mo",
                description: "For growing teams",
                features: [
                  "Unlimited contacts",
                  "Advanced workflows",
                  "Full automation engine",
                  "Priority support",
                ],
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "For organizations at scale",
                features: [
                  "Unlimited everything",
                  "Dedicated instance",
                  "Custom integrations",
                  "SLA & onboarding",
                ],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-8 ${plan.highlighted ? "bg-zinc-900" : "bg-zinc-950"}`}
              >
                <div className="text-sm font-medium text-zinc-400 mb-1">
                  {plan.name}
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {plan.price}
                  {plan.period && (
                    <span className="text-sm font-normal text-zinc-500">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mb-6">
                  {plan.description}
                </p>
                <ul className="text-sm text-zinc-400 space-y-2 text-left">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-zinc-600 mt-0.5">-</span>
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
      <section className="py-24 px-6 border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Stop duct-taping tools together.
          </h2>
          <p className="text-zinc-400 mb-8">
            One platform for CRM, outreach, automation, and AI. Start free in
            three minutes.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-zinc-900 px-8 py-3 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-600">
          <span>Endall AI, Inc.</span>
          <div className="flex gap-6">
            <a href="mailto:jake@endall.ai" className="hover:text-zinc-400">
              jake@endall.ai
            </a>
            <a href="#" className="hover:text-zinc-400">
              Privacy
            </a>
            <a href="#" className="hover:text-zinc-400">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
