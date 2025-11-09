import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "app.sqlite");
console.log("[DB] Using:", dbPath);

// Tạo thư mục nếu chưa có
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// Mở kết nối DB
const db = new Database(dbPath, { fileMustExist: false });
db.pragma("journal_mode = WAL");

// Helper tiện dụng
export function rows<T = any>(sql: string, params: any[] = []): T[] {
  return db.prepare(sql).all(...params) as T[];
}

export function row<T = any>(sql: string, params: any[] = []): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, params: any[] = []): void {
  db.prepare(sql).run(...params);
}

export default db;
