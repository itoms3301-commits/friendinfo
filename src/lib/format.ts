import { daysUntilNextBirthday, monthsFromNow } from "./dates";

export function formatBirthday(birthday: string | null | undefined): string {
  if (!birthday) return "-";
  const [, month, day] = birthday.split("-");
  if (!month || !day) return birthday;
  return `${Number(month)}月${Number(day)}日`;
}

export function birthdayBadge(birthday: string | null | undefined): string | null {
  const days = daysUntilNextBirthday(birthday);
  if (days === null) return null;
  if (days === 0) return "🎉 今日";
  if (days <= 30) return `あと${days}日`;
  return null;
}

export function formatMoveOutMonth(value: string | null | undefined): string {
  if (!value) return "-";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return `${year}年${Number(month)}月`;
}

export function moveOutBadge(value: string | null | undefined): string | null {
  const months = monthsFromNow(value);
  if (months === null) return null;
  if (months < 0) return "退去済";
  if (months === 0) return "今月";
  if (months <= 3) return `あと${months}ヶ月`;
  return null;
}
