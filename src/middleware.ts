import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = process.env.IRON_SESSION_COOKIE_NAME || "session";

// Các path không cần auth
const PUBLIC_PATHS = new Set<string>([
  "/auth/login",
  "/auth/register",
  "/_not-found",
]);

// Bỏ qua các prefix này (API/static/build...)
const IGNORE_PREFIXES = [
  "/api",
  "/_next",
  "/static",
  "/favicon.ico",
  "/assets",
  "/fonts",
  "/images",
];

function isIgnoredPath(pathname: string) {
  return IGNORE_PREFIXES.some((p) => pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  // Bỏ qua preflight
  if (req.method === "OPTIONS") return NextResponse.next();

  const { pathname, search } = req.nextUrl;

  // Bỏ qua path tĩnh & API
  if (isIgnoredPath(pathname)) return NextResponse.next();

  // Gắn header ngôn ngữ từ cookie (phục vụ i18n phía client/server)
  const lang = req.cookies.get("app_lang")?.value || "vi";

  // Cho phép public paths
  if (PUBLIC_PATHS.has(pathname)) {
    const res = NextResponse.next();
    res.headers.set("x-app-lang", lang);
    return res;
  }

  // Kiểm tra cookie phiên
  const hasSession = Boolean(req.cookies.get(COOKIE_NAME)?.value);

  // Các trang cần bảo vệ (dashboard, expenses, categories, budgets, reports, …)
  const needsAuth =
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/budgets") ||
    pathname.startsWith("/reports");

  // Chưa đăng nhập mà vào trang cần auth -> chuyển tới login
  if (needsAuth && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;
    return NextResponse.redirect(url);
  }

  // Đã đăng nhập mà vào trang auth -> chuyển về dashboard
  if (hasSession && (pathname === "/auth/login" || pathname === "/auth/register")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("x-app-lang", lang);
  return res;
}

export const config = {
  matcher: "/:path*",
};
