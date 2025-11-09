import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const db = getDb();
  const schema = fs.readFileSync(path.join(process.cwd(), "database", "schema.sql"), "utf8");
  db.exec(schema);
  const seeds = fs.readFileSync(path.join(process.cwd(), "database", "seeds.sql"), "utf8");
  db.exec(seeds);
  return NextResponse.json({ ok: true });
}
