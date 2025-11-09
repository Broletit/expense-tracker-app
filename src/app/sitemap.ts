import type { MetadataRoute } from 'next';
import db from '@/lib/db/client';

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';

  // Các route chính (static)
  const staticUrls: MetadataRoute.Sitemap = [
    '',
    '/dashboard',
    '/expenses',
    '/categories',
    '/reports',
    '/budgets',
    '/profile',
  ].map((path) => ({
    url: `${base}${path || '/'}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: path === '' || path === '/dashboard' ? 1 : 0.8,
  }));

  // Các báo cáo share public (chưa hết hạn)
  const rows =
    (db
      .prepare(
        `SELECT id, created_at, expires_at
         FROM shared_reports
         WHERE expires_at IS NULL OR expires_at > datetime('now')`
      )
      .all() as { id: string; created_at: string; expires_at: string | null }[]) ?? [];

  const sharedUrls: MetadataRoute.Sitemap = rows.map((r) => ({
    url: `${base}/share/${r.id}`,
    lastModified: new Date(r.created_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticUrls, ...sharedUrls];
}
