import { NextRequest, NextResponse } from "next/server";
import { db, projects, NewProject } from "@/db";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body: NewProject = await req.json();
  const [row] = await db.insert(projects).values(body).returning();
  return NextResponse.json(row, { status: 201 });
}
