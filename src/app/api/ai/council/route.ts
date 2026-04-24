import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { db, questions, documents } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { questionId } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured." }, { status: 503 });
  }

  const [question] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, Number(questionId)));
  if (!question) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  const docs = await db
    .select({ title: documents.title, content: documents.content })
    .from(documents);

  const docContext =
    docs.length > 0
      ? docs.map((d) => `• ${d.title}: ${d.content ?? "(no content)"}`).join("\n")
      : "No documents in the vault yet.";

  const userMessage = `Council Question: ${question.title}\n\nDocument Vault Context:\n${docContext}`;

  try {
    // Three specialized agents run in parallel
    const [technical, strategic, risk] = await Promise.all([
      askClaude({
        maxTokens: 400,
        system: `You are the SoulT Technical Advisor on the AI Council. Evaluate questions from a technical feasibility and implementation standpoint. Be direct and specific. 3-5 sentences. Focus on HOW and what technical factors matter most.`,
        messages: [{ role: "user", content: userMessage }],
      }),
      askClaude({
        maxTokens: 400,
        system: `You are the SoulT Strategic Advisor on the AI Council. Evaluate questions from a business strategy, market positioning, and organizational impact perspective. Be direct and specific. 3-5 sentences. Focus on WHY this matters and strategic implications.`,
        messages: [{ role: "user", content: userMessage }],
      }),
      askClaude({
        maxTokens: 400,
        system: `You are the SoulT Risk Analyst on the AI Council. Identify the top risks, unknowns, and mitigation strategies for this question. Be direct and specific. 3-5 sentences. Focus on WHAT could go wrong and how to address it.`,
        messages: [{ role: "user", content: userMessage }],
      }),
    ]);

    // Council Chair synthesizes
    const synthesis = await askClaude({
      maxTokens: 400,
      system: `You are the SoulT Council Chair. Synthesize input from the Technical Advisor, Strategic Advisor, and Risk Analyst into a clear, actionable recommendation. 3-5 sentences. Close with a concrete next step.`,
      messages: [
        {
          role: "user",
          content: `Question: ${question.title}\n\nTechnical Advisor:\n${technical}\n\nStrategic Advisor:\n${strategic}\n\nRisk Analyst:\n${risk}\n\nSynthesize into a clear recommendation.`,
        },
      ],
    });

    // Save full council deliberation as the question's answer
    const fullAnswer = [
      `**Technical Advisor**\n${technical}`,
      `**Strategic Advisor**\n${strategic}`,
      `**Risk Analyst**\n${risk}`,
      `**Council Synthesis**\n${synthesis}`,
    ].join("\n\n---\n\n");

    await db
      .update(questions)
      .set({ answer: fullAnswer, status: "resolved", updatedAt: new Date().toISOString() })
      .where(eq(questions.id, Number(questionId)));

    return NextResponse.json({ technical, strategic, risk, synthesis });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Council deliberation failed" },
      { status: 502 },
    );
  }
}
