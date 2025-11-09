import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/client';
import { requireUser } from '@/lib/auth/session';

// GET /api/share - liệt kê các link share của user 
export async function GET(_req: NextRequest) {
  try {
    const { id: USER_ID } = await requireUser();

    db.prepare(
      `DELETE FROM shared_reports WHERE expires_at IS NOT NULL AND expires_at < datetime('now')`
    ).run();

    const rows = db
      .prepare(
        `SELECT id, title, created_at, expires_at, payload
         FROM shared_reports
         WHERE user_id = ?
         ORDER BY created_at DESC`
      )
      .all(USER_ID) as { id: string; title: string | null; created_at: string; expires_at: string | null; payload: string }[];

    const origin =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';

    const data = rows.map((r) => ([
      r.id,
      r.title ?? 'Báo cáo chia sẻ',
      r.created_at,
      r.expires_at,
      `${origin}/share/${r.id}`,
      (() => { try { return r.payload ? JSON.parse(r.payload) : {}; } catch { return {}; } })(),
    ])).map(([id, title, created_at, expires_at, url, payload]) => ({
      id, title, created_at, expires_at, url, payload
    }));

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error('[GET /api/share]', e);
    return NextResponse.json({ ok: false, message: e?.message || 'Internal error' }, { status: 500 });
  }
}
