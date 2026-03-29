/**
 * Pre-built sequence templates that users can clone with one click.
 */

export type SequenceTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: {
    step_type: string;
    delay_days: number;
    subject: string;
    body: string;
  }[];
};

export const SEQUENCE_TEMPLATES: SequenceTemplate[] = [
  {
    id: "cold-outreach",
    name: "Cold Outreach",
    description: "4-step cold email sequence with escalating urgency",
    category: "Prospecting",
    steps: [
      {
        step_type: "email",
        delay_days: 0,
        subject: "Quick question about {{contact.company.name}}",
        body: "Hey {{contact.first_name}},\n\nI came across {{contact.company.name}} and was impressed by what you're building. I'm reaching out because we help companies like yours streamline their sales operations with AI-powered automation.\n\nWould it make sense to do a quick 15-minute call to see if there's a fit?\n\nBest,\nJake",
      },
      { step_type: "delay", delay_days: 3, subject: "", body: "" },
      {
        step_type: "email",
        delay_days: 0,
        subject: "Re: Quick question about {{contact.company.name}}",
        body: "Hey {{contact.first_name}},\n\nJust bumping this — I know you're busy. One thing I forgot to mention: our AI assistant can draft follow-ups, prep meeting briefs, and summarize your pipeline — all from one screen.\n\nMost operators tell us it saves 5-10 hours a week. Worth a quick look?\n\nBest,\nJake",
      },
      { step_type: "delay", delay_days: 5, subject: "", body: "" },
      {
        step_type: "email",
        delay_days: 0,
        subject: "Re: Quick question about {{contact.company.name}}",
        body: "{{contact.first_name}},\n\nLast follow-up from me. If now isn't the right time, no worries at all.\n\nIf you'd like to see a quick demo, here's my calendar: [link]\n\nBest,\nJake",
      },
    ],
  },
  {
    id: "re-engagement",
    name: "Re-engagement",
    description: "Win back cold leads who went silent",
    category: "Nurture",
    steps: [
      {
        step_type: "email",
        delay_days: 0,
        subject: "It's been a while, {{contact.first_name}}",
        body: "Hey {{contact.first_name}},\n\nIt's been a while since we last connected. I wanted to reach out because we've made some significant updates to our platform that I think would be relevant for {{contact.company.name}}.\n\nWould you be open to a quick catch-up?\n\nBest,\nJake",
      },
      { step_type: "delay", delay_days: 5, subject: "", body: "" },
      {
        step_type: "email",
        delay_days: 0,
        subject: "New features you might like",
        body: "Hey {{contact.first_name}},\n\nSince we last spoke, we've added AI-powered scheduling, automated email sequences, and a revenue dashboard. Companies your size are seeing 30-40% reduction in admin time.\n\nHappy to show you in 10 minutes if you're curious.\n\nBest,\nJake",
      },
    ],
  },
  {
    id: "onboarding",
    name: "New Customer Onboarding",
    description: "Welcome sequence for new customers",
    category: "Customer Success",
    steps: [
      {
        step_type: "email",
        delay_days: 0,
        subject: "Welcome to endall, {{contact.first_name}}!",
        body: "Hey {{contact.first_name}},\n\nWelcome aboard! I'm excited to have {{contact.company.name}} on the platform.\n\nHere are your first three steps:\n1. Import your contacts (CSV upload or manual entry)\n2. Set up your pipeline stages\n3. Create your first email sequence\n\nI'm here if you need anything. Reply to this email or use the AI assistant (Cmd+K) inside the app.\n\nBest,\nJake",
      },
      { step_type: "delay", delay_days: 2, subject: "", body: "" },
      {
        step_type: "task",
        delay_days: 0,
        subject: "Check in with {{contact.first_name}} on onboarding progress",
        body: "Call to see if they've imported contacts and set up their pipeline.",
      },
      { step_type: "delay", delay_days: 5, subject: "", body: "" },
      {
        step_type: "email",
        delay_days: 0,
        subject: "How's everything going?",
        body: "Hey {{contact.first_name}},\n\nJust checking in — how's the setup going? Most teams are fully operational within the first week.\n\nIf you haven't already, I'd recommend trying the AI assistant (Cmd+K) — it can summarize your pipeline, draft follow-up emails, and prep meeting briefs.\n\nAnything I can help with?\n\nBest,\nJake",
      },
    ],
  },
  {
    id: "meeting-followup",
    name: "Post-Meeting Follow-up",
    description: "Structured follow-up after a demo or discovery call",
    category: "Sales",
    steps: [
      {
        step_type: "email",
        delay_days: 0,
        subject: "Great connecting today, {{contact.first_name}}",
        body: "Hey {{contact.first_name}},\n\nGreat connecting today — I appreciated the time and the candid conversation about {{contact.company.name}}'s goals.\n\nAs discussed, I'll send over [proposal / next steps / materials] by [day]. In the meantime, feel free to explore the platform at endall.ai.\n\nLooking forward to the next conversation.\n\nBest,\nJake",
      },
      { step_type: "delay", delay_days: 3, subject: "", body: "" },
      {
        step_type: "task",
        delay_days: 0,
        subject: "Send proposal to {{contact.first_name}} at {{contact.company.name}}",
        body: "Prepare and send the proposal based on the demo discussion.",
      },
      { step_type: "delay", delay_days: 4, subject: "", body: "" },
      {
        step_type: "email",
        delay_days: 0,
        subject: "Following up on the proposal",
        body: "Hey {{contact.first_name}},\n\nWanted to check in on the proposal I sent over. Any questions or feedback from the team?\n\nHappy to hop on a quick call to walk through anything.\n\nBest,\nJake",
      },
    ],
  },
];
