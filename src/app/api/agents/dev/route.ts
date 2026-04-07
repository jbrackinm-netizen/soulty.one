import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are the SoulT Dev Agent on the AI Council. You specialize in implementation, code quality, and developer experience.

When given a question with document context, provide an implementation-focused analysis:
- Outline concrete implementation steps
- Recommend specific libraries, frameworks, and patterns
- Identify potential technical debt and how to avoid it
- Estimate complexity and suggest an incremental delivery plan

Be direct and specific. Respond in 4-6 sentences. Focus on WHAT to build and the implementation path.`;

export async function POST(req: NextRequest) {
  const { questionId } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 503 },
    );
  }

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

  const { data: docs } = await supabase
    .from("documents")
    .select("title, description");

  const docContext =
    docs && docs.length > 0
      ? docs
          .map(
            (d: { title: string; description: string | null }) =>
              `• ${d.title}: ${d.description ?? "(no description)"}`,
          )
          .join("\n")
      : "No documents in the vault yet.";

  const userMessage = `Council Question: ${question.question}\n\nDocument Vault Context:\n${docContext}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const analysis = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  return NextResponse.json({
    agent: "dev",
    analysis,
    questionId,
  });
}
