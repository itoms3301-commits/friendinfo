import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { TEXT_COLUMN_KEYS } from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "friends.db");

declare global {
  var __friendDb: Database.Database | undefined;
}

function createDb(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const columns = TEXT_COLUMN_KEYS.map((key) => `"${key}" TEXT NOT NULL DEFAULT ''`).join(",\n    ");

  db.exec(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ${columns},
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // 既存DBに新しい項目が追加された場合に備えてカラムを補完する
  const existingColumns = new Set(
    (db.prepare("PRAGMA table_info(friends)").all() as { name: string }[]).map((c) => c.name)
  );
  for (const key of TEXT_COLUMN_KEYS) {
    if (!existingColumns.has(key)) {
      db.exec(`ALTER TABLE friends ADD COLUMN "${key}" TEXT NOT NULL DEFAULT ''`);
    }
  }

  return db;
}

export function getDb(): Database.Database {
  if (!global.__friendDb) {
    global.__friendDb = createDb();
  }
  return global.__friendDb;
}
