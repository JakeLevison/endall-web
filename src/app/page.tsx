export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          endall
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
            Features
          </a>
          <a href="#pricing" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
            Pricing
          </a>
          <a
            href="/login"
            className="text-sm font-medium bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign in
          </a>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6">
        <section className="py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
            The AI operating system
            <br />
            for your business.
          </h1>
          <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            CRM, email automation, task management, and AI agents — all in one platform.
            Built for SMBs who want enterprise tools without enterprise complexity.
          </p>
          <div className="mt-10 flex gap-4 justify-center">
            <a
              href="/signup"
              className="bg-zinc-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Get started free
            </a>
            <a
              href="#features"
              className="border border-zinc-200 text-zinc-700 px-6 py-3 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              See features
            </a>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 border-t border-zinc-100 dark:border-zinc-800">
          <h2 className="text-3xl font-bold text-center text-zinc-900 dark:text-white mb-16">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "CRM",
                description: "Contacts, companies, deals, and pipeline management. Custom fields, activity tracking, and automatic enrichment.",
              },
              {
                title: "Email Sequences",
                description: "Multi-step outreach cadences with personalization, smart scheduling, and auto-unenroll on reply.",
              },
              {
                title: "Workflow Automation",
                description: "Visual workflow builder with triggers, conditions, branching, and AI-powered actions.",
              },
              {
                title: "Task Management",
                description: "Issues, projects, boards, and sprints. Assign, prioritize, and track work across your team.",
              },
              {
                title: "AI Assistant",
                description: "Ask anything about your business data. Meeting prep, deal briefs, follow-up drafts, account research.",
              },
              {
                title: "Reports & Dashboards",
                description: "Pipeline analytics, revenue metrics, activity tracking, and custom dashboards.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
              >
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-center border-t border-zinc-100 dark:border-zinc-800">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Ready to streamline your operations?
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Start free. No credit card required.
          </p>
          <a
            href="/signup"
            className="mt-8 inline-block bg-zinc-900 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Get started
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-sm text-zinc-500 dark:text-zinc-500">
          <span>Endall AI, Inc.</span>
          <span>jake@endall.ai</span>
        </div>
      </footer>
    </div>
  );
}
