import { NextRequest, NextResponse } from "next/server";
import { db, tasks } from "@/db";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const [row] = await db
    .update(tasks)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, Number(params.id)))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.delete(tasks).where(eq(tasks.id, Number(params.id)));
  return NextResponse.json({ success: true });
}
