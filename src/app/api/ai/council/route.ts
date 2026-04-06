import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, questions, documents } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function askAgent(
  client: Anthropic,
  system: string,
  userMessage: string,
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 400,
    system,
    messages: [{ role: "user", content: userMessage }],
  });
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");
}

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
    .select({ title: documents.title, description: documents.description })
    .from(documents);

  const docContext =
    docs.length > 0
      ? docs.map((d) => `• ${d.title}: ${d.description ?? "(no description)"}`).join("\n")
      : "No documents in the vault yet.";

  const userMessage = `Council Question: ${question.question}\n\nDocument Vault Context:\n${docContext}`;

  // Three specialized agents run in parallel
  const [technical, strategic, risk] = await Promise.all([
    askAgent(
      new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
      `You are the SoulT Technical Advisor on the AI Council. Evaluate questions from a technical feasibility and implementation standpoint. Be direct and specific. 3-5 sentences. Focus on HOW and what technical factors matter most.`,
      userMessage,
    ),
    askAgent(
      new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
      `You are the SoulT Strategic Advisor on the AI Council. Evaluate questions from a business strategy, market positioning, and organizational impact perspective. Be direct and specific. 3-5 sentences. Focus on WHY this matters and strategic implications.`,
      userMessage,
    ),
    askAgent(
      new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
      `You are the SoulT Risk Analyst on the AI Council. Identify the top risks, unknowns, and mitigation strategies for this question. Be direct and specific. 3-5 sentences. Focus on WHAT could go wrong and how to address it.`,
      userMessage,
    ),
  ]);

  // Council Chair synthesizes
  const synthesis = await askAgent(
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
    `You are the SoulT Council Chair. Synthesize input from the Technical Advisor, Strategic Advisor, and Risk Analyst into a clear, actionable recommendation. 3-5 sentences. Close with a concrete next step.`,
    `Question: ${question.question}\n\nTechnical Advisor:\n${technical}\n\nStrategic Advisor:\n${strategic}\n\nRisk Analyst:\n${risk}\n\nSynthesize into a clear recommendation.`,
  );

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
}
