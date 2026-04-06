import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, documents, questions, meetings, projects } from "@/db";

export const dynamic = "force-dynamic";

export type SearchResult = {
  type: "project" | "document" | "question" | "meeting";
  id: number;
  label: string;
  summary: string;
  href: string;
};

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ results: [] });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured." }, { status: 503 });
  }

  const [projs, docs, qs, mtgs] = await Promise.all([
    db.select({ id: projects.id, name: projects.name, description: projects.description }).from(projects),
    db.select({ id: documents.id, title: documents.title, description: documents.description }).from(documents),
    db.select({ id: questions.id, question: questions.question, answer: questions.answer, status: questions.status }).from(questions),
    db.select({ id: meetings.id, title: meetings.title, summary: meetings.summary }).from(meetings),
  ]);

  const index: SearchResult[] = [
    ...projs.map((p) => ({
      type: "project" as const,
      id: p.id,
      label: p.name,
      summary: p.description ?? "",
      href: `/projects/${p.id}`,
    })),
    ...docs.map((d) => ({
      type: "document" as const,
      id: d.id,
      label: d.title,
      summary: d.description ?? "",
      href: `/documents`,
    })),
    ...qs.map((q) => ({
      type: "question" as const,
      id: q.id,
      label: q.question,
      summary: q.answer ? q.answer.substring(0, 120) + "…" : `(${q.status})`,
      href: `/questions`,
    })),
    ...mtgs.map((m) => ({
      type: "meeting" as const,
      id: m.id,
      label: m.title,
      summary: m.summary ?? "",
      href: `/meetings`,
    })),
  ];

  if (index.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const contentList = index
    .map((item, i) => `[${i}] (${item.type}) ${item.label}: ${item.summary}`)
    .join("\n");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 256,
    system: `You are a search assistant for the SoulT AI Council platform. Given a query and a numbered list of content, return the indices of the top 5 most relevant items. Respond ONLY with a JSON array of numbers, e.g. [2, 7, 0, 14, 3]. No other text.`,
    messages: [
      {
        role: "user",
        content: `Query: ${query}\n\nContent:\n${contentList}\n\nReturn top 5 indices as a JSON array.`,
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  let indices: number[] = [];
  try {
    const match = text.match(/\[[\d\s,]+\]/);
    if (match) indices = JSON.parse(match[0]);
  } catch {
    indices = [];
  }

  const results = indices
    .filter((i) => Number.isInteger(i) && i >= 0 && i < index.length)
    .map((i) => index[i]);

  return NextResponse.json({ results });
}
