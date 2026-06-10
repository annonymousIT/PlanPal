export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number, weekStart: 'monday' | 'sunday' = 'monday'): number {
  const day = new Date(year, month, 1).getDay(); // 0=Sun..6=Sat
  if (weekStart === 'sunday') return day;
  return day === 0 ? 6 : day - 1; // Mon=0..Sun=6
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("ja-JP", { month: "long", day: "numeric" });
}

export function formatDateFull(date: Date): string {
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function getWeekDates(date: Date, weekStart: 'monday' | 'sunday' = 'monday'): Date[] {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const offset = weekStart === 'sunday' ? -day : (day === 0 ? -6 : 1 - day);
  const start = new Date(d);
  start.setDate(d.getDate() + offset);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(start);
    dd.setDate(start.getDate() + i);
    dates.push(dd);
  }
  return dates;
}

export function getHourSlots(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

export const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

export const MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];
