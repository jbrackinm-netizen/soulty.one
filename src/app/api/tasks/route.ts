import { NextRequest, NextResponse } from "next/server";
import { db, tasks, NewTask } from "@/db";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const rows = projectId
    ? await db.select().from(tasks).where(eq(tasks.projectId, Number(projectId))).orderBy(desc(tasks.createdAt))
    : await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body: NewTask = await req.json();
  const [row] = await db.insert(tasks).values(body).returning();
  return NextResponse.json(row, { status: 201 });
}
