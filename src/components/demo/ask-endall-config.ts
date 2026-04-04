import type { DemoConfig } from "./types";

export const askEndallDemo: DemoConfig = {
  id: "ask-endall",
  title: "Ask Endall",
  description: "See how Endall generates financial documents in minutes",
  steps: [
    {
      id: "open-chat",
      target: "[data-demo='chat-input']",
      title: "Meet Ask Endall",
      description: "This is where you talk to Endall. You can ask it to build financial models, budgets, proposals, estimates, and more.",
      placement: "top",
      action: "observe",
      waitMs: 3000,
    },
    {
      id: "pick-action",
      target: "[data-demo='action-npv']",
      title: "Pick an action",
      description: "Click \"Analyze project returns\" to run an NPV analysis on a project bid.",
      placement: "right",
      action: "click",
    },
    {
      id: "enter-data",
      target: "[data-demo='chat-input']",
      title: "Provide project details",
      description: "Type your project details. We'll use a sample: a $2.4M data center mechanical subcontract.",
      placement: "top",
      action: "type",
      typedText: "Analyze a $2.4M data center mechanical subcontract. 18 months, 30% labor, 25% materials, 20% subs. Discount rate 10%.",
    },
    {
      id: "watch-generation",
      target: "[data-demo='progress-bar']",
      title: "Endall is working",
      description: "Watch as Endall builds your NPV analysis with live Excel formulas, sensitivity tables, and a go/no-go recommendation.",
      placement: "bottom",
      action: "wait",
      waitMs: 5000,
    },
    {
      id: "download-file",
      target: "[data-demo='file-download']",
      title: "Your file is ready",
      description: "Click to download your NPV analysis. It's a real Excel file with 268+ live formulas — not a screenshot.",
      placement: "top",
      action: "click",
    },
  ],
};
