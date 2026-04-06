import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, meetings } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { meetingId } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured." }, { status: 503 });
  }

  const [meeting] = await db.select().from(meetings).where(eq(meetings.id, Number(meetingId)));
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  }

  const decisions: string[] = meeting.decisions ? JSON.parse(meeting.decisions) : [];
  const actions: string[] = meeting.actionItems ? JSON.parse(meeting.actionItems) : [];

  const prompt = [
    `Meeting: ${meeting.title}`,
    `Date: ${meeting.date}`,
    meeting.summary ? `Raw notes / summary: ${meeting.summary}` : null,
    decisions.length > 0 ? `Decisions:\n${decisions.map(d => `- ${d}`).join("\n")}` : null,
    actions.length > 0 ? `Action items:\n${actions.map(a => `- ${a}`).join("\n")}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 512,
    system: `You are the SoulT AI Council scribe. Write a tight, professional 2-4 sentence executive summary of the meeting. Cover what was decided and what happens next. No fluff.`,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  // Save the AI-generated summary back to the meeting
  await db
    .update(meetings)
    .set({ summary })
    .where(eq(meetings.id, Number(meetingId)));

  return NextResponse.json({ summary });
}
