import { NextRequest } from "next/server";
import { askClaude } from "@/lib/claude";
import { db, questions, documents } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { questionId } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not configured." }, { status: 503 });
  }

  const [question] = await db.select().from(questions).where(eq(questions.id, Number(questionId)));
  if (!question) {
    return Response.json({ error: "Question not found." }, { status: 404 });
  }

  const docs = await db.select({
    title: documents.title,
    description: documents.description,
  }).from(documents);

  const docContext = docs.length > 0
    ? docs.map(d => `**${d.title}**\n${d.description ?? "(no description)"}`).join("\n\n---\n\n")
    : "No documents have been added to the vault yet.";

  try {
    const fullAnswer = await askClaude({
      maxTokens: 2048,
      system: `You are the SoulT AI Council — a sharp, concise advisor for the SoulT organization. SoulT works across construction innovation, patents, AI systems, and platform development. Answer the council question clearly and practically, drawing from the document context when relevant. If documents don't address the question, reason from first principles.`,
      messages: [
        {
          role: "user",
          content: `Council Question:\n${question.question}\n\n---\nDocument Vault Context:\n\n${docContext}`,
        },
      ],
    });

    // Save answer
    try {
      await db
        .update(questions)
        .set({ answer: fullAnswer, status: "resolved", updatedAt: new Date().toISOString() })
        .where(eq(questions.id, Number(questionId)));
    } catch {
      // DB save failed — answer was still returned to client
    }

    return Response.json({ answer: fullAnswer });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "AI answer failed" },
      { status: 502 },
    );
  }
}
