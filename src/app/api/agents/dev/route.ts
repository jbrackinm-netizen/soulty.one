import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { db, questions, documents } from "@/db";
import { eq } from "drizzle-orm";

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

  const docs = await db
    .select({ title: documents.title, description: documents.description })
    .from(documents);

  const docContext =
    docs.length > 0
      ? docs
          .map((d) => `• ${d.title}: ${d.description ?? "(no description)"}`)
          .join("\n")
      : "No documents in the vault yet.";

  const userMessage = `Council Question: ${question.question}\n\nDocument Vault Context:\n${docContext}`;

  try {
    const analysis = await askClaude({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    return NextResponse.json({ agent: "dev", analysis, questionId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Dev agent failed" },
      { status: 502 },
    );
  }
}
