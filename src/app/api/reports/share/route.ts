import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/client';
import { randomUUID } from 'crypto';
import { requireUser } from '@/lib/auth/session';

function getOrigin(req: Request): string {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (envBase) return envBase;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    const { id: USER_ID } = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { title = 'Báo cáo chia sẻ', payload = {}, expires_at = null } = body ?? {};

    const id = randomUUID().replace(/-/g, '').slice(0, 24);

    const snap = (payload && typeof payload === 'object') ? payload : {};
    const payloadText = JSON.stringify(snap);

    const filtersVal = (snap as any) && typeof (snap as any) === 'object' && (snap as any).filters !== undefined
      ? JSON.stringify((snap as any).filters)
      : null;

    const exp = expires_at ? new Date(expires_at).toISOString() : null;

    db.prepare(
      `INSERT INTO shared_reports (id, user_id, title, payload, filters, created_at${exp ? ', expires_at' : ''})
       VALUES (?, ?, ?, ?, ?, datetime('now')${exp ? ', ?' : ''})`
    ).run(
      ...(exp
        ? [id, USER_ID, title, payloadText, filtersVal, exp]
        : [id, USER_ID, title, payloadText, filtersVal])
    );

    const url = `${getOrigin(req)}/share/${id}`;
    return NextResponse.json({ ok: true, data: { id, url } }, { status: 201 });
  } catch (e: any) {
    console.error('[POST /api/reports/share]', e);
    return NextResponse.json({ ok: false, message: e?.message || 'Share failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { id: USER_ID } = await requireUser();

    db.prepare(`DELETE FROM shared_reports WHERE expires_at IS NOT NULL AND expires_at < datetime('now')`).run();

    const rows = db
      .prepare(
        `SELECT id, title, created_at, expires_at, payload
         FROM shared_reports
         WHERE user_id = ?
         ORDER BY created_at DESC`
      )
      .all(USER_ID) as { id: string; title: string; created_at: string; expires_at: string | null; payload: string }[];

    const origin = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
    const data = rows.map((r) => ({
      id: r.id,
      title: r.title ?? 'Báo cáo chia sẻ',
      created_at: r.created_at,
      expires_at: r.expires_at ?? null,
      url: `${origin}/share/${r.id}`,
      payload: (() => { try { return JSON.parse(r.payload || '{}'); } catch { return {}; } })(),
    }));

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error('[GET /api/reports/share]', e);
    return NextResponse.json({ ok: false, message: e?.message || 'Failed to fetch shared reports' }, { status: 500 });
  }
}
