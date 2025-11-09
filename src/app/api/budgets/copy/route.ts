import { NextResponse } from "next/server";
import db from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";

type SrcRow = {
  category_id: number;
  limit_amount: number;
  note: string | null;
};

export async function POST(req: Request) {
  try {
    const { id: USER_ID } = await requireUser();

    const body = (await req.json().catch(() => ({}))) as {
      fromPeriod?: string;
      toPeriod?: string;
      overwrite?: boolean;
    };

    const fromPeriod = body.fromPeriod;
    const toPeriod = body.toPeriod;
    const overwrite = body.overwrite ?? false;

    if (!fromPeriod || !toPeriod) {
      return NextResponse.json(
        { error: "Missing fromPeriod/toPeriod" },
        { status: 400 },
      );
    }

    if (fromPeriod === toPeriod) {
      return NextResponse.json(
        { error: "fromPeriod must differ from toPeriod" },
        { status: 400 },
      );
    }

    const src = db
      .prepare(
        `
        SELECT category_id, limit_amount, note
        FROM budgets
        WHERE user_id = ? AND period = ?
      `,
      )
      .all(USER_ID, fromPeriod) as SrcRow[];

    if (!src.length) {
      return NextResponse.json({ copied: 0 });
    }

    const trx = db.transaction(() => {
      let copied = 0;

      for (const row of src) {
        const exists = db
          .prepare(
            `
            SELECT id FROM budgets
            WHERE user_id = ? AND period = ? AND category_id = ?
          `,
          )
          .get(
            USER_ID,
            toPeriod,
            row.category_id,
          ) as { id: number } | undefined;

        if (exists) {
          if (overwrite) {
            db.prepare(
              `
              UPDATE budgets
              SET limit_amount = ?, note = ?
              WHERE id = ? AND user_id = ?
            `,
            ).run(
              row.limit_amount,
              row.note,
              exists.id,
              USER_ID,
            );
            copied++;
          } else {
          }
        } else {
          db.prepare(
            `
            INSERT INTO budgets (user_id, category_id, period, limit_amount, note)
            VALUES (?, ?, ?, ?, ?)
          `,
          ).run(
            USER_ID,
            row.category_id,
            toPeriod,
            row.limit_amount,
            row.note,
          );
          copied++;
        }
      }

      return copied;
    });

    const copied = trx();
    return NextResponse.json({ copied });
  } catch (e: any) {
    console.error("[POST /api/budgets/copy]", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 },
    );
  }
}
