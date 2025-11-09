import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/client';
import { requireUser } from '@/lib/auth/session';

type Row = {
  id: string;
  user_id: number;
  title: string | null;
  payload: string;
  filters: string | null;
  created_at: string;
  expires_at: string | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const row = db
      .prepare(
        `SELECT id, user_id, title, payload, filters, created_at, expires_at
         FROM shared_reports
         WHERE id = ?`
      )
      .get(id) as Row | undefined;

    if (!row) {
      return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });
    }

    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      db.prepare(`DELETE FROM shared_reports WHERE id = ?`).run(id);
      return NextResponse.json({ ok: false, message: 'Link expired' }, { status: 404 });
    }

    let payload: any = {};
    try { payload = row.payload ? JSON.parse(row.payload) : {}; } catch { payload = {}; }

    return NextResponse.json({
      ok: true,
      data: {
        id: row.id,
        title: row.title ?? 'Báo cáo chia sẻ',
        created_at: row.created_at,
        expires_at: row.expires_at,
        payload,
      },
    });
  } catch (e: any) {
    console.error('[GET /api/share/[id]]', e);
    return NextResponse.json({ ok: false, message: e?.message || 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: USER_ID } = await requireUser();
    const id = params.id;

    const info = db
      .prepare(`DELETE FROM shared_reports WHERE id = ? AND user_id = ?`)
      .run(id, USER_ID);

    if (!info || (info as any).changes === 0) {
      return NextResponse.json(
        { ok: false, message: 'Not found or no permission' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[DELETE /api/share/[id]]', e);
    return NextResponse.json({ ok: false, message: e?.message || 'Internal error' }, { status: 500 });
  }
}
