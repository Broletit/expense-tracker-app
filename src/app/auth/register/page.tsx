"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type ApiResp =
  | { ok: true; user: { id: number; email: string; name?: string } }
  | { ok: false; message?: string };

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side checks nhỏ cho UX
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          email: trimmedEmail,
          name: name.trim(),
          password,
        }),
      });

      const data = (await res.json()) as ApiResp;

      if (!res.ok) {
        if ("message" in data && data.message) {
          setError(data.message);
        } else if (res.status === 409) {
          setError("Email đã tồn tại.");
        } else if (res.status === 400) {
          setError("Thiếu thông tin hoặc không hợp lệ.");
        } else {
          setError("Đăng ký thất bại, vui lòng thử lại.");
        }
        return;
      }

      // Đăng ký thành công -> API đã lưu session -> chuyển trang
      router.replace(next);
      // optional: refresh để đồng bộ client components đọc /api/auth/me
      router.refresh();
    } catch (err) {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow p-6">
        <h1 className="text-2xl font-semibold mb-1">Tạo tài khoản</h1>
        <p className="text-sm text-gray-500 mb-6">
          Đã có tài khoản?{" "}
          <Link
            className="text-blue-600 hover:underline"
            href={`/auth/login?next=${encodeURIComponent(next)}`}
          >
            Đăng nhập
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
            <label className="block text-sm font-medium mb-1">
              Họ tên (tuỳ chọn)
            </label>
            <input
              type="text"
              autoComplete="name"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                className="w-full rounded-lg border px-3 py-2 pr-24 outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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
            className="w-full rounded-lg bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-4">
          Bằng việc đăng ký, bạn đồng ý với Điều khoản & Chính sách bảo mật.
        </p>
      </div>
    </main>
  );
}
