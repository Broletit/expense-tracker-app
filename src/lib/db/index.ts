import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "database", "dev.db");

let db: Database.Database;

export function getDb() {
  if (!db) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
  }
  return db;
}
