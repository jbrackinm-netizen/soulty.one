import { NextRequest, NextResponse } from "next/server";
import { db, questions, NewQuestion } from "@/db";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const rows = projectId
    ? await db.select().from(questions).where(eq(questions.projectId, Number(projectId))).orderBy(desc(questions.createdAt))
    : await db.select().from(questions).orderBy(desc(questions.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body: NewQuestion = await req.json();
  const [row] = await db.insert(questions).values(body).returning();
  return NextResponse.json(row, { status: 201 });
}
