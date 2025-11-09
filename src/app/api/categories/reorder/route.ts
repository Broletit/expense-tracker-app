import { NextResponse } from "next/server";
import { run } from "@/lib/db/client";

const USER_ID = 1;

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ ok:false, message:"ids required" }, { status:400 });
    }
    // transaction nhỏ
    run("BEGIN");
    ids.forEach((id: number, idx: number) => {
      run(`UPDATE categories SET sort_order=? WHERE id=? AND user_id=?`, [idx+1, id, USER_ID]);
    });
    run("COMMIT");
    return NextResponse.json({ ok:true });
  } catch (e:any) {
    run("ROLLBACK");
    return NextResponse.json({ ok:false, message:e.message }, { status:500 });
  }
}
