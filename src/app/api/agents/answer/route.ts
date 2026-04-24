import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { db, questions } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const appUrl = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:5000";

export async function POST(req: NextRequest) {
  const { questionId } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 503 },
    );
  }

  // Verify the question exists before fanning out
  const [question] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, Number(questionId)));

  if (!question) {
    return NextResponse.json(
      { error: "Question not found." },
      { status: 404 },
    );
  }

  // Fan out to three agent endpoints in parallel
  const agentEndpoints = ["architect", "dev", "auditor"] as const;
  const body = JSON.stringify({ questionId });
  const headers = { "Content-Type": "application/json" };

  const [architectRes, devRes, auditorRes] = await Promise.all(
    agentEndpoints.map((agent) =>
      fetch(`${appUrl}/api/agents/${agent}`, {
        method: "POST",
        headers,
        body,
      }).then((r) => r.json()),
    ),
  );

  // Check for agent errors
  for (const res of [architectRes, devRes, auditorRes]) {
    if (res.error) {
      return NextResponse.json(
        { error: `Agent error: ${res.error}` },
        { status: 502 },
      );
    }
  }

  // Synthesize the three perspectives
  try {
    const synthesis = await askClaude({
      maxTokens: 600,
      system: `You are the SoulT Council Chair. Synthesize input from the Architect, Dev, and Auditor agents into a clear, actionable recommendation. Highlight points of agreement and tension between the three perspectives. Close with a concrete next step. 4-6 sentences.`,
      messages: [
        {
          role: "user",
          content: `Question: ${question.title}

Architect Agent (Design):
${architectRes.analysis}

Dev Agent (Implementation):
${devRes.analysis}

Auditor Agent (Risk/Validation):
${auditorRes.analysis}

Synthesize into a clear council recommendation.`,
        },
      ],
    });

    // Save the full deliberation to the database
    const fullAnswer = [
      `**Architect Agent**\n${architectRes.analysis}`,
      `**Dev Agent**\n${devRes.analysis}`,
      `**Auditor Agent**\n${auditorRes.analysis}`,
      `**Council Synthesis**\n${synthesis}`,
    ].join("\n\n---\n\n");

    await db
      .update(questions)
      .set({ answer: fullAnswer, status: "resolved", updatedAt: new Date().toISOString() })
      .where(eq(questions.id, Number(questionId)));

    return NextResponse.json({
      architect: architectRes.analysis,
      dev: devRes.analysis,
      auditor: auditorRes.analysis,
      synthesis,
      questionId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Synthesis failed" },
      { status: 502 },
    );
  }
}
