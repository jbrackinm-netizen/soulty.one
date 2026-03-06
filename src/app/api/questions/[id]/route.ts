import { NextRequest, NextResponse } from "next/server";
import { db, questions } from "@/db";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const [row] = await db
    .update(questions)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(questions.id, Number(params.id)))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.delete(questions).where(eq(questions.id, Number(params.id)));
  return NextResponse.json({ success: true });
}
