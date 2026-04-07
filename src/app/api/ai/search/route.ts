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

// Simple keyword matching for pre-filtering before AI ranking
function keywordScore(text: string, queryTokens: string[]): number {
  const lower = text.toLowerCase();
  return queryTokens.reduce((score, token) => score + (lower.includes(token) ? 1 : 0), 0);
}

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
    db.select({ id: documents.id, title: documents.title, description: documents.description, tags: documents.tags }).from(documents),
    db.select({ id: questions.id, question: questions.question, answer: questions.answer, status: questions.status }).from(questions),
    db.select({ id: meetings.id, title: meetings.title, summary: meetings.summary, decisions: meetings.decisions }).from(meetings),
  ]);

  // Build search index with text for keyword pre-filtering
  const index: (SearchResult & { searchText: string })[] = [
    ...projs.map((p) => ({
      type: "project" as const,
      id: p.id,
      label: p.name,
      summary: p.description ?? "",
      href: `/projects/${p.id}`,
      searchText: `${p.name} ${p.description ?? ""}`,
    })),
    ...docs.map((d) => ({
      type: "document" as const,
      id: d.id,
      label: d.title,
      summary: d.description ?? "",
      href: `/documents`,
      searchText: `${d.title} ${d.description ?? ""} ${d.tags ?? ""}`,
    })),
    ...qs.map((q) => ({
      type: "question" as const,
      id: q.id,
      label: q.question,
      summary: q.answer ? q.answer.substring(0, 200) + "..." : `(${q.status})`,
      href: `/questions`,
      searchText: `${q.question} ${q.answer ?? ""}`,
    })),
    ...mtgs.map((m) => ({
      type: "meeting" as const,
      id: m.id,
      label: m.title,
      summary: m.summary ?? "",
      href: `/meetings`,
      searchText: `${m.title} ${m.summary ?? ""} ${m.decisions ?? ""}`,
    })),
  ];

  if (index.length === 0) {
    return NextResponse.json({ results: [] });
  }

  // Pre-filter: keyword matching to get top candidates (max 30)
  const queryTokens = query.toLowerCase().split(/\s+/).filter((t: string) => t.length > 1);
  const scored = index
    .map((item) => ({ ...item, score: keywordScore(item.searchText, queryTokens) }))
    .sort((a, b) => b.score - a.score);

  // Take top 30 keyword matches (or all if fewer), but always include items with score > 0
  const candidates = scored.filter((s) => s.score > 0).slice(0, 30);

  // If no keyword matches, send all items (up to 30) for semantic matching
  const toRank = candidates.length > 0 ? candidates : scored.slice(0, 30);

  const contentList = toRank
    .map((item, i) => `[${i}] (${item.type}) ${item.label}: ${item.summary.substring(0, 150)}`)
    .join("\n");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: `You are a search assistant for the SoulT AI Council platform. Given a query and a numbered list of content, return the indices of the top 5 most relevant items ranked by semantic relevance. Consider meaning, not just keyword overlap. Respond ONLY with a JSON array of numbers, e.g. [2, 7, 0, 14, 3]. No other text.`,
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

  const results: SearchResult[] = indices
    .filter((i) => Number.isInteger(i) && i >= 0 && i < toRank.length)
    .map((i) => {
      const { searchText: _unused, score: _score, ...result } = toRank[i];
      return result;
    });

  return NextResponse.json({ results });
}
