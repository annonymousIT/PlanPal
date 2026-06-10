"use client";

import { ScheduleEvent } from "@/types";
import { getDaysInMonth, getFirstDayOfMonth, isToday, isSameDay, formatTime } from "@/lib/calendar-utils";
import RatingBadge from "./RatingBadge";

interface MonthViewProps {
  year: number;
  month: number;
  events: ScheduleEvent[];
  selectedDate: Date | null;
  highlightDates: Date[];
  showWeekNumbers?: boolean;
  weekStartsOn?: "monday" | "sunday";
  onSelectDate: (date: Date) => void;
  onSelectEvent: (event: ScheduleEvent) => void;
  onDayClick: (date: Date, events: ScheduleEvent[]) => void;
  onCreateEvent?: (start: Date, end: Date) => void;
}

const WEEKDAYS_MON = ["月", "火", "水", "木", "金", "土", "日"];
const WEEKDAYS_SUN = ["日", "月", "火", "水", "木", "金", "土"];

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default function MonthView({
  year, month, events, selectedDate, highlightDates,
  showWeekNumbers = false,
  weekStartsOn = "monday",
  onSelectDate, onSelectEvent, onDayClick, onCreateEvent,
}: MonthViewProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOffset = getFirstDayOfMonth(year, month, weekStartsOn);
  const weekdays = weekStartsOn === "sunday" ? WEEKDAYS_SUN : WEEKDAYS_MON;

  const dayCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOffset; i++) dayCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) dayCells.push(d);
  while (dayCells.length % 7 !== 0) dayCells.push(null);

  const rows = dayCells.length / 7;
  const colTemplate = showWeekNumbers ? "2rem repeat(7, 1fr)" : "repeat(7, 1fr)";

  function getEventsForDay(day: number): ScheduleEvent[] {
    return events.filter((e) => isSameDay(e.startAt, new Date(year, month, day)));
  }

  // Build a flat array of all grid cells (header + body)
  const cells: React.ReactNode[] = [];

  // Header row
  if (showWeekNumbers) {
    cells.push(
      <div key="wn-hdr" className="py-2.5 border-b border-slate-200/60 dark:border-slate-700/60" />
    );
  }
  weekdays.forEach((label, i) => {
    const isSatCol = weekStartsOn === "monday" ? i === 5 : i === 6;
    const isSunCol = weekStartsOn === "monday" ? i === 6 : i === 0;
    cells.push(
      <div
        key={`hdr-${i}`}
        className={`py-2.5 text-center text-xs font-semibold tracking-widest uppercase border-b border-slate-200/60 dark:border-slate-700/60
          ${isSatCol ? "text-blue-500 dark:text-blue-400" : isSunCol ? "text-rose-400 dark:text-rose-500" : "text-slate-400 dark:text-slate-500"}`}
      >
        {label}
      </div>
    );
  });

  // Day rows
  for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
    const rowCells = dayCells.slice(rowIdx * 7, rowIdx * 7 + 7);

    if (showWeekNumbers) {
      const firstDay = rowCells.find((d) => d !== null);
      const weekNum = firstDay ? getISOWeek(new Date(year, month, firstDay)) : null;
      cells.push(
        <div key={`wn-${rowIdx}`} className="flex items-start justify-center pt-1.5 text-[10px] text-slate-300 dark:text-slate-600 border-b border-r border-slate-100 dark:border-slate-800">
          {weekNum}
        </div>
      );
    }

    rowCells.forEach((day, colIdx) => {
      if (day === null) {
        cells.push(
          <div key={`empty-${rowIdx}-${colIdx}`} className="border-b border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30" />
        );
        return;
      }

      const date = new Date(year, month, day);
      const dow = date.getDay(); // 0=Sun, 6=Sat
      const isSat = dow === 6;
      const isSun = dow === 0;
      const dayEvents = getEventsForDay(day);
      const today = isToday(date);
      const isSelected = selectedDate && isSameDay(date, selectedDate);
      const highlighted = highlightDates.some((h) => isSameDay(h, date));

      cells.push(
        <div
          key={`day-${day}`}
          onClick={() => onSelectDate(date)}
          className={`
            border-b border-r border-slate-100 dark:border-slate-800 p-1 cursor-pointer
            transition-colors relative overflow-hidden
            ${isSelected ? "bg-indigo-50/70 dark:bg-indigo-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}
            ${highlighted ? "bg-indigo-50 dark:bg-indigo-900/30" : ""}
          `}
        >
          {highlighted && (
            <div className="absolute inset-0 bg-indigo-400/10 dark:bg-indigo-400/5 animate-pulse rounded-sm pointer-events-none" />
          )}

          <div className="flex items-center justify-between px-1 relative z-10 group/cell">
            <button
              onClick={(e) => {
                e.stopPropagation();
                dayEvents.length > 0 ? onDayClick(date, dayEvents) : onSelectDate(date);
              }}
              className={`
                inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full transition-colors cursor-pointer
                ${today ? "bg-indigo-600 text-white" : "hover:bg-slate-200 dark:hover:bg-slate-700"}
                ${isSat && !today ? "text-blue-500 dark:text-blue-400" : ""}
                ${isSun && !today ? "text-rose-400 dark:text-rose-500" : ""}
                ${!today && !isSat && !isSun ? "text-slate-700 dark:text-slate-300" : ""}
              `}
            >
              {day}
            </button>
            <div className="flex items-center gap-1">
              {dayEvents.length > 0 && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{dayEvents.length}</span>
              )}
              {onCreateEvent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const start = new Date(year, month, day, 12, 0);
                    const end = new Date(year, month, day, 13, 0);
                    onCreateEvent(start, end);
                  }}
                  className="opacity-0 group-hover/cell:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all cursor-pointer"
                  title="予定を追加"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="mt-0.5 space-y-0.5 overflow-hidden relative z-10">
            {dayEvents.slice(0, 3).map((event) => (
              <button
                key={event.id}
                onClick={(e) => { e.stopPropagation(); onSelectEvent(event); }}
                className={`
                  w-full text-left px-1.5 py-0.5 rounded text-[11px] leading-tight truncate
                  transition-colors duration-150 cursor-pointer
                  ${!event.color && event.category === "food" ? "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300" : ""}
                  ${!event.color && event.category === "work" ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300" : ""}
                  ${!event.color && event.category === "sports" ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300" : ""}
                  ${!event.color && event.category === "entertainment" ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300" : ""}
                  ${!event.color && event.category === "hobby" ? "bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300" : ""}
                  ${!event.color && !event.category ? "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400" : ""}
                `}
                style={event.color ? { backgroundColor: `${event.color}20`, color: event.color } : undefined}
              >
                <span className="flex items-center gap-1">
                  <RatingBadge rating={event.rating} size="sm" />
                  <span className="truncate">{event.isAllDay ? event.title : `${formatTime(event.startAt)} ${event.title}`}</span>
                </span>
              </button>
            ))}
            {dayEvents.length > 3 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDayClick(date, dayEvents); }}
                className="block text-[10px] text-indigo-500 dark:text-indigo-400 px-1.5 hover:underline cursor-pointer"
              >
                +{dayEvents.length - 3} 件
              </button>
            )}
          </div>
        </div>
      );
    });
  }

  return (
    <div
      className="flex-1 overflow-hidden"
      style={{
        display: "grid",
        gridTemplateColumns: colTemplate,
        gridTemplateRows: `auto repeat(${rows}, 1fr)`,
      }}
    >
      {cells}
    </div>
  );
}
