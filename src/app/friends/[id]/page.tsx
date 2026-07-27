import Link from "next/link";
import { notFound } from "next/navigation";
import { getFriend } from "@/lib/friends";
import { SECTIONS } from "@/lib/schema";
import { birthdayBadge, formatBirthday, formatMoveOutMonth, moveOutBadge } from "@/lib/format";
import { deleteFriendAction } from "@/app/actions";
import DeleteFriendButton from "@/components/DeleteFriendButton";

export default async function FriendDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const friend = getFriend(Number(id));
  if (!friend) notFound();

  const boundDelete = deleteFriendAction.bind(null, friend.id);
  const bBadge = birthdayBadge(friend.birthday);
  const mBadge = moveOutBadge(friend.moveOutMonth);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
            ← 一覧に戻る
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {friend.name || "(名前未登録)"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{friend.relationship || "関係未設定"}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/friends/${friend.id}/edit`}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            編集
          </Link>
          <DeleteFriendButton action={boundDelete} />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 p-4 sm:grid-cols-4 dark:border-zinc-800">
        <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">誕生日</div>
          <div className="font-medium">{formatBirthday(friend.birthday)}</div>
          {bBadge ? <div className="text-xs text-pink-600 dark:text-pink-400">{bBadge}</div> : null}
        </div>
        <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">家の退去月</div>
          <div className="font-medium">{formatMoveOutMonth(friend.moveOutMonth)}</div>
          {mBadge ? <div className="text-xs text-amber-600 dark:text-amber-400">{mBadge}</div> : null}
        </div>
        <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">本</div>
          <div className="font-medium">{friend.bookStatus || "未"}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">サークル</div>
          <div className="font-medium">{friend.circleStatus || "未"}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">紹介</div>
          <div className="font-medium">{friend.introStatus || "未"}</div>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">現在の状態</div>
          <div className="font-medium">{friend.currentStage || "-"}</div>
        </div>
      </section>

      {/* 本・サークル・紹介・現在の状態は上のサマリーに表示済みのため、詳細セクションでは残りの項目のみ表示 */}
      {SECTIONS.map((section) => {
        const summarizedKeys = new Set(["bookStatus", "circleStatus", "introStatus", "currentStage"]);
        const fields = section.fields.filter((f) => !summarizedKeys.has(f.key));
        const hasContent = fields.some((f) => friend[f.key]);
        if (!hasContent) return null;
        return (
          <section key={section.key} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{section.title}</h2>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map((field) => {
                const val = friend[field.key];
                if (!val) return null;
                return (
                  <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">{field.label}</dt>
                    <dd className="whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100">{val}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
        );
      })}

    </div>
  );
}
