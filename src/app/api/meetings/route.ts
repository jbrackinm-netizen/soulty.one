import { NextRequest, NextResponse } from "next/server";
import { db, meetings, NewMeeting } from "@/db";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const rows = projectId
    ? await db.select().from(meetings).where(eq(meetings.projectId, Number(projectId))).orderBy(desc(meetings.date))
    : await db.select().from(meetings).orderBy(desc(meetings.date));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body: NewMeeting = await req.json();
  const [row] = await db.insert(meetings).values(body).returning();
  return NextResponse.json(row, { status: 201 });
}
