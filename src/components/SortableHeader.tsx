import Link from "next/link";
import type { SortDir, SortKey } from "@/lib/friends";

export default function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
}) {
  const isActive = currentSort === sortKey;
  const nextDir: SortDir = isActive && currentDir === "asc" ? "desc" : "asc";
  const arrow = isActive ? (currentDir === "asc" ? "▲" : "▼") : "";

  return (
    <Link
      href={`/?sort=${sortKey}&dir=${nextDir}`}
      className={`inline-flex items-center gap-1 whitespace-nowrap hover:underline ${
        isActive ? "font-semibold text-zinc-900 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-400"
      }`}
    >
      {label}
      {arrow ? <span className="text-xs">{arrow}</span> : null}
    </Link>
  );
}
