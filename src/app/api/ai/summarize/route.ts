import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
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

  try {
    const summary = await askClaude({
      maxTokens: 512,
      system: `You are the SoulT AI Council scribe. Write a tight, professional 2-4 sentence executive summary of the meeting. Cover what was decided and what happens next. No fluff.`,
      messages: [{ role: "user", content: prompt }],
    });

    await db
      .update(meetings)
      .set({ summary })
      .where(eq(meetings.id, Number(meetingId)));

    return NextResponse.json({ summary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Summarization failed" },
      { status: 502 },
    );
  }
}
