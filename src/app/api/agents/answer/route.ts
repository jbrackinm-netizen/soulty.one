import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  const { questionId } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 503 },
    );
  }

  // Verify the question exists before fanning out
  const { data: question, error: qErr } = await supabase
    .from("questions")
    .select("*")
    .eq("id", questionId)
    .single();

  if (qErr || !question) {
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

  // Synthesize the three perspectives with Claude
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const synthesisResponse = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    system: `You are the SoulT Council Chair. Synthesize input from the Architect, Dev, and Auditor agents into a clear, actionable recommendation. Highlight points of agreement and tension between the three perspectives. Close with a concrete next step. 4-6 sentences.`,
    messages: [
      {
        role: "user",
        content: `Question: ${question.question}

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

  const synthesis = synthesisResponse.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  // Save the full deliberation to Supabase
  const fullAnswer = [
    `**Architect Agent**\n${architectRes.analysis}`,
    `**Dev Agent**\n${devRes.analysis}`,
    `**Auditor Agent**\n${auditorRes.analysis}`,
    `**Council Synthesis**\n${synthesis}`,
  ].join("\n\n---\n\n");

  await supabase
    .from("questions")
    .update({
      answer: fullAnswer,
      status: "resolved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", questionId);

  return NextResponse.json({
    architect: architectRes.analysis,
    dev: devRes.analysis,
    auditor: auditorRes.analysis,
    synthesis,
    questionId,
  });
}
