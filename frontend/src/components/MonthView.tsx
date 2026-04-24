"use client";

import { ScheduleEvent } from "@/types";
import { getDaysInMonth, getFirstDayOfMonth, isToday, isSameDay, WEEKDAYS, formatTime } from "@/lib/calendar-utils";
import RatingBadge from "./RatingBadge";

interface MonthViewProps {
  year: number;
  month: number;
  events: ScheduleEvent[];
  selectedDate: Date | null;
  highlightDates: Date[];
  onSelectDate: (date: Date) => void;
  onSelectEvent: (event: ScheduleEvent) => void;
}

export default function MonthView({ year, month, events, selectedDate, highlightDates, onSelectDate, onSelectEvent }: MonthViewProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function getEventsForDay(day: number): ScheduleEvent[] {
    const date = new Date(year, month, day);
    return events.filter((e) => isSameDay(e.startAt, date));
  }

  function isHighlighted(day: number): boolean {
    const date = new Date(year, month, day);
    return highlightDates.some((h) => isSameDay(h, date));
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200/60 dark:border-slate-700/60">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-2.5 text-center text-xs font-semibold tracking-widest uppercase
              ${i >= 5 ? "text-rose-400 dark:text-rose-500" : "text-slate-400 dark:text-slate-500"}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="border-b border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30" />;
          }

          const date = new Date(year, month, day);
          const dayEvents = getEventsForDay(day);
          const today = isToday(date);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isWeekend = i % 7 >= 5;
          const highlighted = isHighlighted(day);

          return (
            <div
              key={day}
              onClick={() => onSelectDate(date)}
              className={`
                border-b border-r border-slate-100 dark:border-slate-800 p-1 cursor-pointer
                transition-all duration-300 relative
                ${isSelected ? "bg-indigo-50/70 dark:bg-indigo-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}
                ${highlighted ? "bg-indigo-50 dark:bg-indigo-900/30" : ""}
              `}
            >
              {/* Highlight pulse */}
              {highlighted && (
                <div className="absolute inset-0 bg-indigo-400/10 dark:bg-indigo-400/5 animate-pulse rounded-sm pointer-events-none" />
              )}

              <div className="flex items-center justify-between px-1 relative z-10">
                <span
                  className={`
                    inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full
                    ${today ? "bg-indigo-600 text-white" : ""}
                    ${isWeekend && !today ? "text-rose-400 dark:text-rose-500" : ""}
                    ${!today && !isWeekend ? "text-slate-700 dark:text-slate-300" : ""}
                  `}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{dayEvents.length}</span>
                )}
              </div>

              <div className="mt-0.5 space-y-0.5 overflow-hidden relative z-10">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); onSelectEvent(event); }}
                    className={`
                      w-full text-left px-1.5 py-0.5 rounded text-[11px] leading-tight truncate
                      transition-colors duration-150 cursor-pointer
                      ${event.category === "food" ? "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50" : ""}
                      ${event.category === "work" ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50" : ""}
                      ${event.category === "sports" ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50" : ""}
                      ${event.category === "entertainment" ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50" : ""}
                      ${event.category === "hobby" ? "bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:hover:bg-pink-900/50" : ""}
                      ${!event.category ? "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400" : ""}
                    `}
                  >
                    <span className="flex items-center gap-1">
                      <RatingBadge rating={event.rating} size="sm" />
                      <span className="truncate">{formatTime(event.startAt)} {event.title}</span>
                    </span>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 px-1.5">+{dayEvents.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
