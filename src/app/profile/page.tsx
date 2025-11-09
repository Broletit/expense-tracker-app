'use client';

import { useEffect, useState } from 'react';

type Profile = {
  id: number;
  email: string;
  name: string | null;
  avatar?: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadTimer, setReloadTimer] = useState<NodeJS.Timeout | null>(null);

  // fetch profile
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) throw new Error('Không lấy được thông tin hồ sơ');
        const data = (await res.json()) as Profile;
        if (cancelled) return;
        setProfile(data);
        setName(data.name ?? '');
        setEmail(data.email);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Lỗi tải hồ sơ');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // khi có success → 3s sau reload
  useEffect(() => {
    if (!success) return;
    if (reloadTimer) clearTimeout(reloadTimer);

    const t = setTimeout(() => {
      try {
        window.dispatchEvent(new Event('auth:changed'));
        localStorage.setItem('auth:changed', String(Date.now()));
      } catch {}
      window.location.reload();
    }, 3000);

    setReloadTimer(t);
    return () => {
      clearTimeout(t);
    };
  }, [success]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSavingProfile(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.message || 'Cập nhật hồ sơ thất bại');
      }

      setProfile((p) =>
        p
          ? {
              ...p,
              name: name.trim(),
              email: email.trim(),
            }
          : p
      );
      setSuccess('Cập nhật hồ sơ thành công.');
    } catch (e: any) {
      setError(e?.message || 'Cập nhật hồ sơ thất bại');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword || newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.message || 'Đổi mật khẩu thất bại');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Đổi mật khẩu thành công.');
    } catch (e: any) {
      setError(e?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn một file ảnh hợp lệ');
      return;
    }

    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.message || 'Tải ảnh đại diện thất bại');
      }

      const newAvatar = j.avatar as string | undefined;

      setProfile((p) =>
        p
          ? {
              ...p,
              avatar: newAvatar ?? p.avatar ?? null,
            }
          : p
      );
      setSuccess('Cập nhật ảnh đại diện thành công.');
    } catch (e: any) {
      setError(e?.message || 'Tải ảnh đại diện thất bại');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Title skeleton */}
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />

        {/* Avatar + upload skeleton */}
        <section className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="space-y-2 flex-1 max-w-xs">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </section>

        {/* Card: Thông tin cơ bản skeleton */}
        <section className="border rounded-xl p-4 bg-white dark:bg-neutral-900 dark:border-neutral-800 space-y-4">
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-9 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-9 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-9 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-2" />
        </section>

        {/* Card: Đổi mật khẩu skeleton */}
        <section className="border rounded-xl p-4 bg-white dark:bg-neutral-900 dark:border-neutral-800 space-y-4">
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-9 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          ))}
          <div className="h-9 w-36 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-2" />
        </section>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-6 text-sm text-red-600">Không tải được thông tin người dùng.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold mb-2">Hồ sơ cá nhân</h1>

      {success && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Avatar + upload */}
      <section className="flex items-center gap-4">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.name ?? profile.email}
            className="w-16 h-16 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-900 text-white grid place-items-center text-lg font-semibold">
            {(profile.name || profile.email)
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((s) => s[0])
              .join('')
              .toUpperCase()}
          </div>
        )}

        <div className="space-y-1">
          <label className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm cursor-pointer hover:bg-gray-50">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={uploadingAvatar}
            />
            {uploadingAvatar ? 'Đang tải lên…' : 'Đổi ảnh đại diện'}
          </label>
          <div className="text-xs text-gray-500">
            Hỗ trợ file ảnh (JPG, PNG…). Ảnh sẽ được tự động resize về 256×256.
          </div>
        </div>
      </section>

      {/* Thông tin cơ bản */}
      <section className="border rounded-xl p-4 space-y-3 bg-white dark:bg-neutral-900">
        <h2 className="text-sm font-semibold mb-1">Thông tin cơ bản</h2>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tên hiển thị</label>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-neutral-950"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên của bạn"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-neutral-950"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
            >
              {savingProfile ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </section>

      {/* Đổi mật khẩu */}
      <section className="border rounded-xl p-4 space-y-3 bg-white dark:bg-neutral-900">
        <h2 className="text-sm font-semibold mb-1">Đổi mật khẩu</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mật khẩu hiện tại</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-neutral-950"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mật khẩu mới</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-neutral-950"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nhập lại mật khẩu mới</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-neutral-950"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
            >
              {savingPassword ? 'Đang đổi…' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
