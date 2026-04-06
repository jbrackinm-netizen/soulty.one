import { NextResponse } from "next/server";

// Type definitions
interface ProjectItem {
  id?: string;
  name: string;
  status?: string;
  progress?: number;
  description?: string;
}

interface TaskItem {
  id?: string;
  title: string;
  status?: "open" | "in_progress" | "blocked" | "done";
  priority?: "high" | "medium" | "low";
  assignee?: string;
  dueDate?: string;
  description?: string;
}

interface NoteItem {
  id?: string;
  title: string;
  content: string;
  createdAt?: string;
  tags?: string[];
}

interface MeetingItem {
  id?: string;
  title: string;
  date?: string;
  attendees?: string[];
  summary?: string;
  decisions?: string[];
  nextSteps?: string[];
}

interface NexusRequest {
  projects: ProjectItem[];
  tasks: TaskItem[];
  notes: NoteItem[];
  meetings: MeetingItem[];
  mode: "insight" | "chat" | "action";
  userQuery?: string;
  actionType?: "blockers" | "priorities" | "next_steps" | "summary";
}

interface NexusResponse {
  summary: string;
  priorities: string[];
  blockers: string[];
  recommendations: string[];
  nextActions: string[];
  timestamp: string;
  mode: string;
}

// Build context string from project data
function buildProjectContext(req: NexusRequest): string {
  const lines = [];

  if (req.projects.length > 0) {
    lines.push("=== PROJECTS ===");
    req.projects.forEach((p) => {
      lines.push(
        `- ${p.name} (${p.status || "unknown"}): ${p.description || "No description"}`
      );
      if (p.progress) lines.push(`  Progress: ${p.progress}%`);
    });
    lines.push("");
  }

  if (req.tasks.length > 0) {
    lines.push("=== TASKS ===");
    const byStatus = req.tasks.reduce(
      (acc, t) => {
        const status = t.status || "open";
        if (!acc[status]) acc[status] = [];
        acc[status].push(t);
        return acc;
      },
      {} as Record<string, TaskItem[]>
    );

    Object.entries(byStatus).forEach(([status, tasks]) => {
      lines.push(`${status.toUpperCase()} (${tasks.length}):`);
      tasks.forEach((t) => {
        const priority = t.priority ? `[${t.priority.toUpperCase()}]` : "";
        const due = t.dueDate ? ` (due: ${t.dueDate})` : "";
        lines.push(`  • ${t.title} ${priority}${due}`);
      });
    });
    lines.push("");
  }

  if (req.notes.length > 0) {
    lines.push("=== RECENT NOTES ===");
    req.notes.slice(0, 5).forEach((n) => {
      lines.push(`- ${n.title}: ${n.content.substring(0, 100)}...`);
    });
    lines.push("");
  }

  if (req.meetings.length > 0) {
    lines.push("=== RECENT MEETINGS ===");
    req.meetings.slice(0, 3).forEach((m) => {
      lines.push(`- ${m.title} (${m.date || "undated"})`);
      if (m.decisions && m.decisions.length > 0) {
        lines.push(`  Decisions: ${m.decisions.join(", ")}`);
      }
    });
    lines.push("");
  }

  return lines.join("\n");
}

// Mode-specific prompt builders
function getInsightPrompt(context: string): string {
  return `You are Nexus Brain, the SoulT AI Council's intelligent analyzer. Your role is to provide clear, actionable insight into project state.

Analyze this project data and provide a structured dashboard-ready summary:

${context}

Return a JSON response with:
{
  "summary": "One sentence describing overall project health",
  "priorities": ["most critical thing to focus on", "second priority", "third priority"],
  "blockers": ["what's stopping progress", "what needs attention"],
  "recommendations": ["specific action to take", "another improvement"],
  "nextActions": ["immediate action", "short-term action"]
}

Be concise. Priorities should be 2-3 items. Blockers should be 1-3. Recommendations should be 2-3.
Focus on what matters most for moving the project forward.`;
}

function getChatPrompt(context: string, userQuery: string): string {
  return `You are Nexus Brain, the SoulT AI Council's intelligent assistant. You answer questions about project state, decisions, and progress.

Project Context:
${context}

User Question: "${userQuery}"

Answer the user's question using the project context. Be helpful, specific, and actionable. Reference specific projects, tasks, or decisions when relevant.

After answering, provide a JSON response with:
{
  "summary": "Your answer to the user's question",
  "priorities": [],
  "blockers": [],
  "recommendations": ["suggested action based on context"],
  "nextActions": []
}`;
}

function getActionPrompt(context: string, actionType: string): string {
  const actionGuides = {
    blockers: `List all blockers preventing progress. For each blocker:
      - State the problem clearly
      - Explain why it's blocking
      - Suggest one solution`,
    priorities:
      "Rank the top 3 priorities. For each, explain why it matters and what would unblock it.",
    next_steps:
      "Generate the top 5 next steps to move projects forward. Prioritize by impact.",
    summary:
      "Create a concise 1-2 sentence summary of project state and health.",
  };

  const guide = actionGuides[actionType as keyof typeof actionGuides] || actionGuides.summary;

  return `You are Nexus Brain. Analyze this project data and focus on: ${guide}

Project Context:
${context}

Return a JSON response with:
{
  "summary": "High-level summary of findings",
  "priorities": ["action 1", "action 2", "action 3"],
  "blockers": ["blocker 1", "blocker 2"],
  "recommendations": ["specific recommendation"],
  "nextActions": ["concrete action 1", "concrete action 2"]
}

Be direct and actionable.`;
}

// Parse Claude's response
function parseClaudeResponse(text: string): Partial<NexusResponse> {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.warn("Failed to parse Claude response as JSON:", text);
    return {
      summary: text,
      priorities: [],
      blockers: [],
      recommendations: [],
      nextActions: [],
    };
  }
}

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // 1. Validate request
    const body: NexusRequest = await req.json();

    if (!body.mode || !["insight", "chat", "action"].includes(body.mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'insight', 'chat', or 'action'" },
        { status: 400 }
      );
    }

    if (body.mode === "chat" && !body.userQuery) {
      return NextResponse.json(
        { error: "Chat mode requires userQuery field" },
        { status: 400 }
      );
    }

    if (body.mode === "action" && !body.actionType) {
      return NextResponse.json(
        { error: "Action mode requires actionType field" },
        { status: 400 }
      );
    }

    // 2. Check API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("Missing ANTHROPIC_API_KEY environment variable");
      return NextResponse.json(
        { error: "Server configuration error: missing API key" },
        { status: 500 }
      );
    }

    // 3. Build context and prompt
    const context = buildProjectContext(body);

    let prompt: string;
    switch (body.mode) {
      case "insight":
        prompt = getInsightPrompt(context);
        break;
      case "chat":
        prompt = getChatPrompt(context, body.userQuery!);
        break;
      case "action":
        prompt = getActionPrompt(context, body.actionType || "summary");
        break;
    }

    // 4. Call Claude API
    console.log(`[Nexus Brain] ${body.mode} mode`, {
      projects: body.projects.length,
      tasks: body.tasks.length,
      notes: body.notes.length,
      meetings: body.meetings.length,
    });

    const claudeResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    // 5. Validate response
    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", {
        status: claudeResponse.status,
        error: errorText,
      });

      if (claudeResponse.status === 401) {
        return NextResponse.json(
          { error: "Authentication error: invalid API key" },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: "Claude API error: " + claudeResponse.statusText },
        { status: claudeResponse.status }
      );
    }

    const claudeData = await claudeResponse.json();

    // 6. Extract and parse response
    const responseText = claudeData?.content?.[0]?.text;
    if (!responseText) {
      console.error("No text in Claude response:", claudeData);
      return NextResponse.json(
        { error: "No response from Claude" },
        { status: 500 }
      );
    }

    // 7. Parse the response into our structure
    const parsed = parseClaudeResponse(responseText);

    // 8. Build final response
    const finalResponse: NexusResponse = {
      summary: parsed.summary || "Analysis complete",
      priorities: parsed.priorities || [],
      blockers: parsed.blockers || [],
      recommendations: parsed.recommendations || [],
      nextActions: parsed.nextActions || [],
      timestamp: new Date().toISOString(),
      mode: body.mode,
    };

    const duration = Date.now() - startTime;
    console.log(`[Nexus Brain] completed in ${duration}ms`, {
      mode: body.mode,
      responseSummaryLength: finalResponse.summary.length,
    });

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error("[Nexus Brain] Fatal error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
