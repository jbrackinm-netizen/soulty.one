import { NextRequest, NextResponse } from "next/server";
import { db, documents, NewDocument } from "@/db";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const rows = projectId
    ? await db.select().from(documents).where(eq(documents.projectId, Number(projectId))).orderBy(desc(documents.createdAt))
    : await db.select().from(documents).orderBy(desc(documents.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body: NewDocument = await req.json();
  const [row] = await db.insert(documents).values(body).returning();
  return NextResponse.json(row, { status: 201 });
}
