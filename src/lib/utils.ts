import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gộp class tailwind an toàn */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

/** Ép kiểu sang int, dùng cho query params */
export function toInt(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
}

/** Lấy thông tin phân trang từ URLSearchParams */
export function getPageParams(searchParams: URLSearchParams) {
  const page = Math.max(1, toInt(searchParams.get("page"), 1));
  const limit = Math.min(100, Math.max(1, toInt(searchParams.get("limit"), 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/** Response JSON ok */
export function ok(data: any, init?: number) {
  return Response.json({ ok: true, data }, { status: init ?? 200 });
}

/** Response JSON lỗi */
export function bad(message: string, code = 400) {
  return Response.json({ ok: false, message }, { status: code });
}
