import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { db, documents } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { documentId } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured." }, { status: 503 });
  }

  const [doc] = await db.select().from(documents).where(eq(documents.id, Number(documentId)));
  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const prompt = [
    `Document: ${doc.title}`,
    doc.description ? `Description: ${doc.description}` : null,
    doc.fileName ? `File: ${doc.fileName}` : null,
    doc.fileType ? `Type: ${doc.fileType}` : null,
    doc.tags ? `Tags: ${doc.tags}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const summary = await askClaude({
      maxTokens: 512,
      system: `You are the SoulT AI Council document analyst. Generate a concise, actionable summary of this document in 2-4 sentences. Focus on what the document covers, its relevance to SoulT projects, and any key takeaways or action items. Be specific and practical.`,
      messages: [{ role: "user", content: prompt }],
    });

    await db
      .update(documents)
      .set({ description: summary })
      .where(eq(documents.id, Number(documentId)));

    return NextResponse.json({ summary, documentId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Document summarization failed" },
      { status: 502 },
    );
  }
}
