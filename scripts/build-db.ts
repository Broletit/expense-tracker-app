// scripts/build-db.ts
import sqlite3 from 'sqlite3';
import fs from 'node:fs';
import path from 'node:path';

sqlite3.verbose();

const DB_DIR = path.join(process.cwd(), 'database');
const DB_PATH = path.join(DB_DIR, 'app.db');            // dùng app.db như bạn muốn
const SCHEMA_PATH = path.join(DB_DIR, 'schema.sql');
const SEED_PATH = path.join(DB_DIR, 'seed.sql');

function ensureFiles() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(SCHEMA_PATH)) {
    throw new Error(`Missing ${SCHEMA_PATH}. Hãy tạo database/schema.sql trước.`);
  }
}

async function build() {
  ensureFiles();
  // xoá DB cũ (nếu có)
  if (fs.existsSync(DB_PATH)) fs.rmSync(DB_PATH);

  const db = new sqlite3.Database(DB_PATH);

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const seed = fs.existsSync(SEED_PATH) ? fs.readFileSync(SEED_PATH, 'utf8') : '';

  await exec(db, 'PRAGMA foreign_keys = ON;');
  await exec(db, 'BEGIN;');

  try {
    await exec(db, schema);
    if (seed.trim().length) await exec(db, seed);
    await exec(db, 'COMMIT;');
    console.log('✅ Database app.db created successfully!');
  } catch (e: any) {
    await exec(db, 'ROLLBACK;');
    console.error('❌ Error building DB:', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

function exec(db: sqlite3.Database, sql: string) {
  return new Promise<void>((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}

build().catch((e) => {
  console.error('❌ Fatal:', e);
  process.exitCode = 1;
});
