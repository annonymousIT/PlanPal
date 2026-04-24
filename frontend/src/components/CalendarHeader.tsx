"use client";

import { CalendarView } from "@/types";
import { MONTH_NAMES } from "@/lib/calendar-utils";

interface CalendarHeaderProps {
  year: number;
  month: number;
  view: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
}

export default function CalendarHeader({
  year, month, view, onPrev, onNext, onToday, onViewChange,
}: CalendarHeaderProps) {
  const views: { value: CalendarView; label: string }[] = [
    { value: "month", label: "月" },
    { value: "week", label: "週" },
    { value: "day", label: "日" },
  ];

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60">
      <div className="flex items-center gap-3">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
        >
          今日
        </button>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          {year}年 {MONTH_NAMES[month]}
        </h1>
      </div>

      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {views.map((v) => (
          <button
            key={v.value}
            onClick={() => onViewChange(v.value)}
            className={`
              px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer
              ${view === v.value
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }
            `}
          >
            {v.label}
          </button>
        ))}
      </div>
    </header>
  );
}
