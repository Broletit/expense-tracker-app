import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

// Khai báo kiểu CỤC BỘ
export type SessionUser = { id: number; email: string; name?: string | null };
type SessionData = { user?: SessionUser };

const sessionOptions: SessionOptions = {
  password:
    process.env.IRON_SESSION_PASSWORD ||
    "dev_only_password_please_change_me_32chars_min!!!!",
  cookieName: process.env.IRON_SESSION_COOKIE_NAME || "session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  // Dùng generic với kiểu cục bộ đã khai báo
  return getIronSession<SessionData>(cookies(), sessionOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) {
    const err: any = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return session.user;
}

export async function setSessionUser(user: SessionUser) {
  const session = await getSession();
  session.user = user;
  await session.save();
}

export async function clearSession() {
  const session = await getSession();
  session.destroy();
}
