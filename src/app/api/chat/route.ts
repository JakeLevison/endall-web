import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  assembleContext,
  assembleRecordContext,
  assemblePipelineContext,
} from "@/lib/context-assembler";

const TENANT_ID = "109d88ca-983a-4bfd-9e79-c64061fd0727"; // Endall tenant

function getSystemPrompt(): string {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `You are the AI assistant built into endall, an AI-powered business operating system. Today is ${today}.

You are a capable, general-purpose AI assistant — similar to ChatGPT or Claude. You can answer any question, have conversations, brainstorm ideas, write content, explain concepts, and help with anything the user asks.

You also have special access to the user's CRM data (contacts, companies, deals, pipeline, activities). When CRM data is provided in the context, use it to give specific, data-driven answers. When no CRM data is relevant, just be a helpful assistant.

Rules:
- Be concise and actionable. Lead with the answer, not the preamble.
- Use plain text only. Do NOT use markdown headers (##), bold (**), or any markdown formatting. Use simple dashes (-) for lists and plain text for emphasis.
- When drafting emails, write in a professional but warm tone.
- When analyzing deals or pipeline, highlight risks and suggest next steps.
- When CRM data is provided, reference it specifically. When it's not, answer from general knowledge.
- Format currency as $X,XXX. Format dates as readable (e.g., "March 15").`;
}

export async function POST(request: NextRequest) {
  try {
    const { message, action, recordType, recordId, history } =
      await request.json();

    if (!message && !action) {
      return NextResponse.json(
        { error: "Message or action required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Assemble CRM context based on the query type
    let crmContext = "";

    if (action && recordType && recordId) {
      // Pre-built action on a specific record
      const ctx = await assembleRecordContext(
        supabase,
        TENANT_ID,
        recordType,
        recordId
      );
      crmContext = ctx.summary;
    } else if (message) {
      // Check if it's a general pipeline question
      const pipelineKeywords = [
        "pipeline",
        "revenue",
        "deals",
        "forecast",
        "summary",
        "overview",
        "how many",
        "total",
        "this week",
        "this month",
      ];
      const isGeneral = pipelineKeywords.some((k) =>
        message.toLowerCase().includes(k)
      );

      if (isGeneral) {
        crmContext = await assemblePipelineContext(supabase, TENANT_ID);
      }

      // Also search for specific entities mentioned
      const entityCtx = await assembleContext(supabase, TENANT_ID, message);
      if (entityCtx.summary) {
        crmContext += (crmContext ? "\n\n" : "") + entityCtx.summary;
      }
    }

    // Build the prompt for the pre-built action
    let userPrompt = message || "";
    if (action) {
      userPrompt = getActionPrompt(action, message);
    }

    // Build messages array
    const messages: { role: string; content: string }[] = [
      { role: "system", content: getSystemPrompt() },
    ];

    // Add CRM context as a system message
    if (crmContext) {
      messages.push({
        role: "system",
        content: `Here is the relevant CRM data for this query:\n\n${crmContext}`,
      });
    }

    // Add conversation history (last 10 messages)
    if (history?.length) {
      for (const h of history.slice(-10)) {
        messages.push({ role: h.role, content: h.content });
      }
    }

    messages.push({ role: "user", content: userPrompt });

    // Call Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: messages
          .filter((m) => m.role === "system")
          .map((m) => m.content)
          .join("\n\n"),
        messages: messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Claude API error:", errText);
      return NextResponse.json(
        { error: "AI service error" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply =
      data.content?.[0]?.text || "I couldn't generate a response.";

    return NextResponse.json({ reply, context: crmContext ? true : false });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getActionPrompt(action: string, extra?: string): string {
  switch (action) {
    case "meeting_prep":
      return `Prepare a meeting briefing based on the CRM data provided. Include: company background, recent interactions, open deals, key contacts, and suggested talking points.${extra ? " Additional context: " + extra : ""}`;
    case "deal_brief":
      return `Create a comprehensive deal briefing. Include: deal stage, amount, stakeholders involved, full history of interactions, risks, and recommended next steps.${extra ? " Additional context: " + extra : ""}`;
    case "follow_up_email":
      return `Draft a follow-up email based on the recent interaction history. Keep it professional, reference specific details from past conversations, and include a clear next step or ask.${extra ? " Additional context: " + extra : ""}`;
    case "account_research":
      return `Provide a detailed account research brief. Summarize what we know from the CRM: all contacts, deals, activities, and interactions. Identify gaps in our knowledge and suggest research priorities.${extra ? " Additional context: " + extra : ""}`;
    case "objection_handling":
      return `Based on the deal context, anticipate likely objections from the prospect and prepare responses for each. Consider the deal stage, company size, and interaction history.${extra ? " Additional context: " + extra : ""}`;
    case "next_steps":
      return `Analyze the recent activity and suggest concrete next steps. Prioritize by urgency and impact. Format as a numbered action list with owners and deadlines.${extra ? " Additional context: " + extra : ""}`;
    default:
      return extra || "Help me with this CRM task.";
  }
}
