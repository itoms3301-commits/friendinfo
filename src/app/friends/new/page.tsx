import Link from "next/link";
import FriendForm from "@/components/FriendForm";
import { createFriendAction } from "@/app/actions";

export default function NewFriendPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/" className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
          ← 一覧に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">友達を登録</h1>
      </div>
      <FriendForm action={createFriendAction} submitLabel="登録する" />
    </div>
  );
}
