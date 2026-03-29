/**
 * Reusable email templates for compose dialog and sequence builder.
 */

export type EmailTemplate = {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "intro",
    name: "Introduction",
    category: "Outreach",
    subject: "Quick intro — {{owner.full_name}} from endall",
    body: "Hey {{contact.first_name}},\n\nI'm {{owner.full_name}} from endall. I came across {{contact.company.name}} and wanted to reach out because we help service companies like yours streamline their sales and scheduling operations.\n\nWould you be open to a quick 15-minute call this week?\n\nBest,\n{{owner.full_name}}",
  },
  {
    id: "follow-up",
    name: "Follow-up",
    category: "Outreach",
    subject: "Following up, {{contact.first_name}}",
    body: "Hey {{contact.first_name}},\n\nJust bumping my previous email to the top of your inbox. I know you're busy — happy to work around your schedule.\n\nWould a quick 10-minute call work this week?\n\nBest,\n{{owner.full_name}}",
  },
  {
    id: "post-demo",
    name: "Post-Demo Thank You",
    category: "Sales",
    subject: "Great connecting today, {{contact.first_name}}",
    body: "Hey {{contact.first_name}},\n\nGreat connecting today — I really appreciated the time and the conversation about {{contact.company.name}}'s goals.\n\nAs discussed, here are the next steps:\n- [Next step 1]\n- [Next step 2]\n\nI'll follow up [when] with [what]. In the meantime, feel free to explore the platform.\n\nBest,\n{{owner.full_name}}",
  },
  {
    id: "proposal",
    name: "Proposal Follow-up",
    category: "Sales",
    subject: "Proposal for {{contact.company.name}}",
    body: "Hey {{contact.first_name}},\n\nAttached is the proposal we discussed for {{contact.company.name}}. The key highlights:\n\n- [Benefit 1]\n- [Benefit 2]\n- [Pricing summary]\n\nHappy to walk through any of this on a quick call. What works for you?\n\nBest,\n{{owner.full_name}}",
  },
  {
    id: "check-in",
    name: "Customer Check-in",
    category: "Customer Success",
    subject: "How's everything going, {{contact.first_name}}?",
    body: "Hey {{contact.first_name}},\n\nJust checking in to see how things are going with endall. Any questions or feedback from the team?\n\nWe recently launched [new feature] that I think would be useful for {{contact.company.name}}. Happy to give you a quick walkthrough.\n\nBest,\n{{owner.full_name}}",
  },
  {
    id: "referral-ask",
    name: "Referral Request",
    category: "Growth",
    subject: "Quick ask, {{contact.first_name}}",
    body: "Hey {{contact.first_name}},\n\nGlad to hear things are going well with endall at {{contact.company.name}}. I have a quick ask:\n\nDo you know any other operators who might benefit from what we're doing? A quick introduction would mean a lot.\n\nNo pressure at all — just thought I'd ask since you've seen the platform in action.\n\nBest,\n{{owner.full_name}}",
  },
];
