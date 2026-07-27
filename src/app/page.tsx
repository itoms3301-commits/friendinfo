import Link from "next/link";
import { listFriends, type SortDir, type SortKey } from "@/lib/friends";
import SortableHeader from "@/components/SortableHeader";
import { birthdayBadge, formatBirthday, formatMoveOutMonth, moveOutBadge } from "@/lib/format";

const SORT_KEYS: SortKey[] = [
  "name",
  "birthday",
  "moveOutMonth",
  "bookStatus",
  "circleStatus",
  "currentStage",
  "updatedAt",
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const params = await searchParams;
  const sort: SortKey = SORT_KEYS.includes(params.sort as SortKey) ? (params.sort as SortKey) : "birthday";
  const dir: SortDir = params.dir === "desc" ? "desc" : "asc";

  const friends = listFriends(sort, dir);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">友達管理</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {friends.length}人登録中 ／ 列見出しをクリックすると並び替えできます
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/api/export"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            CSVエクスポート
          </a>
          <Link
            href="/friends/new"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            + 友達を登録
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-left">
                <SortableHeader label="名前" sortKey="name" currentSort={sort} currentDir={dir} />
              </th>
              <th className="px-4 py-3 text-left">関係</th>
              <th className="px-4 py-3 text-left">
                <SortableHeader label="誕生日" sortKey="birthday" currentSort={sort} currentDir={dir} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader label="退去月" sortKey="moveOutMonth" currentSort={sort} currentDir={dir} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader label="本" sortKey="bookStatus" currentSort={sort} currentDir={dir} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader label="サークル" sortKey="circleStatus" currentSort={sort} currentDir={dir} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader label="現在の状態" sortKey="currentStage" currentSort={sort} currentDir={dir} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader label="更新日" sortKey="updatedAt" currentSort={sort} currentDir={dir} />
              </th>
            </tr>
          </thead>
          <tbody>
            {friends.map((friend) => {
              const bBadge = birthdayBadge(friend.birthday);
              const mBadge = moveOutBadge(friend.moveOutMonth);
              return (
                <tr
                  key={friend.id}
                  className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/60"
                >
                  <td className="px-4 py-3">
                    <Link href={`/friends/${friend.id}`} className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
                      {friend.name || "(名前未登録)"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{friend.relationship || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{formatBirthday(friend.birthday)}</span>
                      {bBadge ? (
                        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
                          {bBadge}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{formatMoveOutMonth(friend.moveOutMonth)}</span>
                      {mBadge ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          {mBadge}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">{friend.bookStatus || "未"}</td>
                  <td className="px-4 py-3">{friend.circleStatus || "未"}</td>
                  <td className="px-4 py-3">{friend.currentStage || "-"}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {friend.updatedAt ? new Date(friend.updatedAt).toLocaleDateString("ja-JP") : "-"}
                  </td>
                </tr>
              );
            })}
            {friends.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  まだ友達が登録されていません。「+ 友達を登録」から追加しましょう。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
