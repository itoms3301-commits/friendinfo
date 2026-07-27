import { getDb } from "./db";
import { ALL_FIELDS, TEXT_COLUMN_KEYS, BOOK_STATUS_OPTIONS, CIRCLE_STATUS_OPTIONS, CURRENT_STAGE_OPTIONS } from "./schema";
import { daysUntilNextBirthday, monthsFromNow, upcomingSortKey } from "./dates";

export type Friend = { id: number; createdAt: string; updatedAt: string } & Record<string, string>;

export type SortKey =
  | "name"
  | "birthday"
  | "moveOutMonth"
  | "bookStatus"
  | "circleStatus"
  | "currentStage"
  | "updatedAt";

export type SortDir = "asc" | "desc";

function rankOf(options: string[], value: string): number {
  const idx = options.indexOf(value);
  return idx === -1 ? options.length : idx;
}

export function listFriends(sort: SortKey = "birthday", dir: SortDir = "asc"): Friend[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM friends").all() as Friend[];

  const withKeys = rows.map((row) => {
    let key: number | string;
    switch (sort) {
      case "name":
        key = row.name ?? "";
        break;
      case "birthday":
        key = upcomingSortKey(daysUntilNextBirthday(row.birthday));
        break;
      case "moveOutMonth":
        key = upcomingSortKey(monthsFromNow(row.moveOutMonth));
        break;
      case "bookStatus":
        key = rankOf(BOOK_STATUS_OPTIONS, row.bookStatus ?? "");
        break;
      case "circleStatus":
        key = rankOf(CIRCLE_STATUS_OPTIONS, row.circleStatus ?? "");
        break;
      case "currentStage":
        key = rankOf(CURRENT_STAGE_OPTIONS, row.currentStage ?? "");
        break;
      case "updatedAt":
      default:
        key = row.updatedAt ?? "";
        break;
    }
    return { row, key };
  });

  withKeys.sort((a, b) => {
    if (a.key < b.key) return dir === "asc" ? -1 : 1;
    if (a.key > b.key) return dir === "asc" ? 1 : -1;
    return (a.row.name ?? "").localeCompare(b.row.name ?? "", "ja");
  });

  return withKeys.map((w) => w.row);
}

export function getFriend(id: number): Friend | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM friends WHERE id = ?").get(id) as Friend | undefined;
}

function sanitize(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of ALL_FIELDS) {
    const value = input[field.key];
    out[field.key] = typeof value === "string" ? value.trim() : "";
  }
  return out;
}

export function createFriend(input: Record<string, unknown>): number {
  const db = getDb();
  const data = sanitize(input);
  const now = new Date().toISOString();

  const columns = [...TEXT_COLUMN_KEYS, "createdAt", "updatedAt"];
  const placeholders = columns.map((c) => `@${c}`).join(", ");
  const stmt = db.prepare(
    `INSERT INTO friends (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})`
  );
  const result = stmt.run({ ...data, createdAt: now, updatedAt: now });
  return Number(result.lastInsertRowid);
}

export function updateFriend(id: number, input: Record<string, unknown>): void {
  const db = getDb();
  const data = sanitize(input);
  const now = new Date().toISOString();

  const setClause = TEXT_COLUMN_KEYS.map((c) => `"${c}" = @${c}`).join(", ");
  const stmt = db.prepare(`UPDATE friends SET ${setClause}, updatedAt = @updatedAt WHERE id = @id`);
  stmt.run({ ...data, updatedAt: now, id });
}

export function deleteFriend(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM friends WHERE id = ?").run(id);
}
