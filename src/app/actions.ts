"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createFriend, deleteFriend, updateFriend } from "@/lib/friends";
import { ALL_FIELDS } from "@/lib/schema";

function formToRecord(formData: FormData): Record<string, string> {
  const record: Record<string, string> = {};
  for (const field of ALL_FIELDS) {
    record[field.key] = String(formData.get(field.key) ?? "");
  }
  return record;
}

export async function createFriendAction(formData: FormData) {
  const data = formToRecord(formData);
  const id = createFriend(data);
  revalidatePath("/");
  redirect(`/friends/${id}`);
}

export async function updateFriendAction(id: number, formData: FormData) {
  const data = formToRecord(formData);
  updateFriend(id, data);
  revalidatePath("/");
  revalidatePath(`/friends/${id}`);
  redirect(`/friends/${id}`);
}

export async function deleteFriendAction(id: number) {
  deleteFriend(id);
  revalidatePath("/");
  redirect("/");
}
