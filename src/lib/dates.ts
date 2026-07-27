// 誕生日・退去月の「直近順」ソート用ユーティリティ

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * 誕生日（YYYY-MM-DD、年は無視）から、今日を起点にした次の誕生日までの日数を返す。
 * 未設定の場合は null。
 */
export function daysUntilNextBirthday(birthday: string | null | undefined): number | null {
  if (!birthday) return null;
  const parts = birthday.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [, month, day] = parts;

  const today = startOfToday();
  let next = new Date(today.getFullYear(), month - 1, day);
  if (next < today) {
    next = new Date(today.getFullYear() + 1, month - 1, day);
  }
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

/**
 * 退去月（YYYY-MM）から、今月を起点にした差分月数を返す（未来なら正、過去なら負）。
 * 未設定の場合は null。
 */
export function monthsFromNow(yearMonth: string | null | undefined): number | null {
  if (!yearMonth) return null;
  const parts = yearMonth.split("-").map(Number);
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  const [year, month] = parts;

  const today = startOfToday();
  const diff = (year - today.getFullYear()) * 12 + (month - 1 - today.getMonth());
  return diff;
}

/**
 * 「直近優先」のソートキーを作る。未来（0以上）は小さいほど優先、
 * 過去はすべて未来より後ろに回し、直近の過去ほど先に来るようにする。
 */
export function upcomingSortKey(value: number | null): number {
  if (value === null) return Number.POSITIVE_INFINITY;
  if (value >= 0) return value;
  return 1_000_000 - value;
}
