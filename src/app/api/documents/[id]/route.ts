import { NextRequest, NextResponse } from "next/server";
import { db, documents } from "@/db";
import { eq } from "drizzle-orm";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.delete(documents).where(eq(documents.id, Number(params.id)));
  return NextResponse.json({ success: true });
}
