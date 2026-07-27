import { BASIC_FIELDS, SECTIONS, type FieldDef } from "@/lib/schema";
import type { Friend } from "@/lib/friends";

function FieldInput({ field, value }: { field: FieldDef; value: string }) {
  const baseClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  if (field.type === "textarea") {
    return (
      <textarea
        name={field.key}
        defaultValue={value}
        placeholder={field.placeholder}
        rows={3}
        className={baseClass}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select name={field.key} defaultValue={value} className={baseClass}>
        <option value="">未選択</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={field.type}
      name={field.key}
      defaultValue={value}
      placeholder={field.placeholder}
      className={baseClass}
    />
  );
}

function Field({ field, value }: { field: FieldDef; value: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{field.label}</span>
      <FieldInput field={field} value={value} />
      {field.helpText ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{field.helpText}</span>
      ) : null}
    </label>
  );
}

export default function FriendForm({
  friend,
  action,
  submitLabel,
}: {
  friend?: Partial<Friend>;
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  const value = (key: string) => (friend?.[key] as string | undefined) ?? "";

  return (
    <form action={action} className="flex flex-col gap-10">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {BASIC_FIELDS.map((field) => (
          <Field key={field.key} field={field} value={value(field.key)} />
        ))}
      </section>

      {SECTIONS.map((section) => (
        <section key={section.key} className="flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{section.title}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
                <Field field={field} value={value(field.key)} />
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="flex justify-end gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
