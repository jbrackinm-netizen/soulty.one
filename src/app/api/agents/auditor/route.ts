import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are the SoulT Auditor Agent on the AI Council. You specialize in risk assessment, security validation, and quality assurance.

When given a question with document context, provide a risk/validation-focused analysis:
- Identify the top risks and unknowns
- Evaluate security, compliance, and data integrity concerns
- Recommend validation steps and testing strategies
- Suggest mitigation plans for each identified risk

Be direct and specific. Respond in 4-6 sentences. Focus on WHAT could go wrong and how to prevent it.`;

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
    agent: "auditor",
    analysis,
    questionId,
  });
}
