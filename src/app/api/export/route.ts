import { listFriends } from "@/lib/friends";
import { ALL_FIELDS } from "@/lib/schema";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const friends = listFriends("name", "asc");
  const headers = ["ID", ...ALL_FIELDS.map((f) => f.label)];
  const rows = friends.map((friend) => [
    String(friend.id),
    ...ALL_FIELDS.map((f) => friend[f.key] ?? ""),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n");

  // Excel/スプレッドシートで文字化けしないようUTF-8 BOMを付与
  const bom = "﻿";

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="friends.csv"`,
    },
  });
}
