import { NextRequest, NextResponse } from "next/server";
import { db, projects } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const [row] = await db.select().from(projects).where(eq(projects.id, Number(params.id)));
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const [row] = await db.update(projects).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(projects.id, Number(params.id))).returning();
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.delete(projects).where(eq(projects.id, Number(params.id)));
  return NextResponse.json({ success: true });
}
