"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

type MeOk = {
  ok: true;
  user: {
    id: number;
    email: string;
    name?: string | null;
    avatar?: string | null;
  };
};
type MeNg = { ok: false; user: null };
type MeResp = MeOk | MeNg;

const LANGS = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
];

function initials(s: string) {
  const t = s.trim();
  const parts = t.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : "";
}

export default function HeaderUser() {
  const router = useRouter();
  const [me, setMe] = React.useState<MeResp | null>(null);
  const [open, setOpen] = React.useState(false);
  const [lang, setLang] = React.useState("vi");
  const ref = React.useRef<HTMLDivElement>(null);
  const { theme, systemTheme, setTheme } = useTheme();

  const fetchMe = React.useCallback(async () => {
    try {
      const r = await fetch(`/api/auth/me?t=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const j = (await r.json()) as MeResp;
      setMe(j);
    } catch {
      setMe({ ok: false, user: null });
    }
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      await fetchMe();
      try {
        if (sessionStorage.getItem("auth:just-logged-in") === "1") {
          sessionStorage.removeItem("auth:just-logged-in");
          if (alive) await fetchMe();
        }
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [fetchMe]);

  React.useEffect(() => {
    setLang(readCookie("app_lang") || "vi");
  }, []);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      window.addEventListener("click", onClick);
      window.addEventListener("keydown", onKey);
    }
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  React.useEffect(() => {
    const revalidate = () => fetchMe();

    function onAuthChanged() {
      revalidate();
    }
    window.addEventListener("auth:changed", onAuthChanged as EventListener);

    function onStorage(ev: StorageEvent) {
      if (ev.key === "auth:changed") revalidate();
    }
    window.addEventListener("storage", onStorage);

    function onFocus() {
      revalidate();
    }
    function onVisibility() {
      if (document.visibilityState === "visible") revalidate();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("auth:changed", onAuthChanged as EventListener);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchMe]);

  async function onLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      try {
        window.dispatchEvent(new Event("auth:changed"));
        localStorage.setItem("auth:changed", String(Date.now()));
      } catch {}
      router.replace("/auth/login");
      router.refresh();
    }
  }

  function changeLang(code: string) {
    if (typeof document !== "undefined") {
      document.cookie = `app_lang=${encodeURIComponent(
        code
      )}; Path=/; Max-Age=${60 * 60 * 24 * 180}`;
    }
    setLang(code);
    router.refresh();
  }

  if (!me) {
    return (
      <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 animate-pulse" />
    );
  }

  if (!me.ok) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Đăng nhập
        </Link>
        <Link
          href="/auth/register"
          className="rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-3 py-1.5 text-sm hover:opacity-90"
        >
          Đăng ký
        </Link>
      </div>
    );
  }

  const display = me.user.name || me.user.email;
  const avatar = me.user.avatar || null;

  const effective = theme === "system" ? systemTheme || "light" : theme;
  const themeLabel =
    theme === "system"
      ? `Hệ thống (${effective === "dark" ? "Tối" : "Sáng"})`
      : theme === "dark"
      ? "Tối"
      : "Sáng";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 focus:outline-none"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={display}
            className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 grid place-items-center text-xs font-semibold">
            {initials(display)}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium">{display}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800 shadow-xl z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b dark:border-gray-800 flex items-center gap-3">
            {avatar ? (
              <img
                src={avatar}
                alt={display}
                className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 grid place-items-center text-xs font-semibold">
                {initials(display)}
              </div>
            )}
            <div>
              <div className="text-sm font-medium">
                {me.user.name || "Người dùng"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {me.user.email}
              </div>
            </div>
          </div>

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Hồ sơ cá nhân
          </Link>

          <div className="px-4 py-3 border-y dark:border-gray-800 space-y-3">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Cài đặt
            </div>

            <div>
              <div className="text-xs mb-1 text-gray-600 dark:text-gray-300">
                Chế độ giao diện
              </div>
              <div className="flex items-center gap-2">
                <Choice
                  label="Sáng"
                  active={theme === "light"}
                  onClick={() => setTheme("light")}
                />
                <Choice
                  label="Tối"
                  active={theme === "dark"}
                  onClick={() => setTheme("dark")}
                />
                              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Đang dùng: <span className="font-medium">{themeLabel}</span>
              </div>
            </div>

            <div>
              <div className="text-xs mb-1 text-gray-600 dark:text-gray-300">
                Ngôn ngữ
              </div>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <Choice
                    key={l.code}
                    label={l.label}
                    active={lang === l.code}
                    onClick={() => changeLang(l.code)}
                  />
                ))}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Đang dùng:{" "}
                <span className="font-medium">
                  {LANGS.find((x) => x.code === lang)?.label || "Tiếng Việt"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

function Choice({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-lg text-sm border",
        active
          ? "bg-gray-900 text-white border-gray-900 dark:bg.white dark:text-gray-900 dark:border-white"
          : "hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200",
      ].join(" ")}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
