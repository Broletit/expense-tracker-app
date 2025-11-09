import bcrypt from "bcryptjs";

/** Băm mật khẩu mới để lưu vào DB */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/** So khớp mật khẩu người dùng nhập với hash trong DB */
export async function verifyPassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  if (!plain || !hashed) return false;
  try {
    return await bcrypt.compare(plain, hashed);
  } catch {
    return false;
  }
}
