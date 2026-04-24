"use client";

import { CalendarSource } from "@/types";
import { getDaysInMonth, getFirstDayOfMonth, isToday } from "@/lib/calendar-utils";

interface SidebarProps {
  isOpen: boolean;
  calendars: CalendarSource[];
  onToggleCalendar: (id: string) => void;
  year: number;
  month: number;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  isOpen, calendars, onToggleCalendar, year, month, selectedDate, onSelectDate, onOpenSettings,
}: SidebarProps) {
  if (!isOpen) return null;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const miniDays = ["日", "月", "火", "水", "木", "金", "土"];
  const cells: (number | null)[] = [];
  const sundayFirst = firstDay === 6 ? 0 : firstDay + 1;
  for (let i = 0; i < sundayFirst; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <aside className="w-60 border-r border-slate-200/60 dark:border-slate-700/60 flex flex-col bg-white dark:bg-slate-900 overflow-y-auto shrink-0">
      {/* Mini calendar */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {miniDays.map((d) => (
            <span key={d} className="text-[10px] font-medium text-slate-400 dark:text-slate-500 py-1">{d}</span>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <span key={`e-${i}`} />;
            const date = new Date(year, month, day);
            const today = isToday(date);
            const selected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month;
            return (
              <button
                key={day}
                onClick={() => onSelectDate(date)}
                className={`
                  w-7 h-7 text-xs rounded-full flex items-center justify-center cursor-pointer transition-colors
                  ${today ? "bg-indigo-600 text-white font-bold" : ""}
                  ${selected && !today ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-semibold" : ""}
                  ${!today && !selected ? "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" : ""}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar sources */}
      <div className="px-4 pb-2">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          マイカレンダー
        </h3>
        <div className="space-y-1">
          {calendars.map((cal) => (
            <label key={cal.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={cal.visible}
                onChange={() => onToggleCalendar(cal.id)}
                className="sr-only"
              />
              <span
                className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-colors ${
                  cal.visible
                    ? "border-transparent"
                    : "border-slate-300 dark:border-slate-600"
                }`}
                style={{ backgroundColor: cal.visible ? cal.color : "transparent" }}
              >
                {cal.visible && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-slate-700 dark:text-slate-300">{cal.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings button */}
      <div className="p-4 border-t border-slate-200/60 dark:border-slate-700/60">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          設定
        </button>
      </div>
    </aside>
  );
}
