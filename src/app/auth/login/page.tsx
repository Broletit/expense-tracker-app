"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type ApiResp =
  | { ok: true; user: { id: number; email: string; name?: string | null } }
  | { ok: false; message?: string };

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "include", // đảm bảo cookie phiên được set
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = (await res.json()) as ApiResp;

      if (!res.ok || !("ok" in data) || !data.ok) {
        setError("message" in data && data.message ? data.message : "Đăng nhập thất bại.");
        return;
      }

      try {
      localStorage.setItem("auth:changed", Date.now().toString());
      window.dispatchEvent(new Event("auth:changed"));
      sessionStorage.setItem("auth:just-logged-in", "1");
    } catch {}

      // Điều hướng về trang mong muốn + refresh để header/me cập nhật ngay
      router.replace(next);
      router.refresh();
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow p-6">
        <h1 className="text-2xl font-semibold mb-1">Đăng nhập</h1>
        <p className="text-sm text-gray-500 mb-6">
          Chưa có tài khoản?{" "}
          <Link
            className="text-blue-600 hover:underline"
            href={`/auth/register?next=${encodeURIComponent(next)}`}
          >
            Đăng ký
          </Link>
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                className="w-full rounded-lg border px-3 py-2 pr-24 outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
              >
                {showPw ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-black text-white py-2.5 font-medium hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </main>
  );
}
