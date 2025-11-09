import { NextResponse } from "next/server";
import { run } from "@/lib/db/client";

export async function POST(req: Request) {
  const ids: number[] = await req.json();
  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ ok: true });

  const placeholders = ids.map(() => "?").join(",");
  run(`DELETE FROM expenses WHERE id IN (${placeholders})`, ids);
  return NextResponse.json({ ok: true });
}
