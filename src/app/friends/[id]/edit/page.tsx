import Link from "next/link";
import { notFound } from "next/navigation";
import { getFriend } from "@/lib/friends";
import FriendForm from "@/components/FriendForm";
import { updateFriendAction } from "@/app/actions";

export default async function EditFriendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const friend = getFriend(Number(id));
  if (!friend) notFound();

  const boundUpdate = updateFriendAction.bind(null, friend.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <Link href={`/friends/${friend.id}`} className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
          ← 詳細に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{friend.name || "(名前未登録)"} を編集</h1>
      </div>
      <FriendForm friend={friend} action={boundUpdate} submitLabel="更新する" />
    </div>
  );
}
