"use client";

import { ScheduleEvent } from "@/types";
import { getWeekDates, isToday, isSameDay, formatTime, WEEKDAYS } from "@/lib/calendar-utils";
import RatingBadge from "./RatingBadge";

interface WeekViewProps {
  currentDate: Date;
  events: ScheduleEvent[];
  highlightDates: Date[];
  onSelectEvent: (event: ScheduleEvent) => void;
}

export default function WeekView({ currentDate, events, highlightDates, onSelectEvent }: WeekViewProps) {
  const weekDates = getWeekDates(currentDate);
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 ~ 21:00

  function getEventsForDay(date: Date): ScheduleEvent[] {
    return events.filter((e) => isSameDay(e.startAt, date));
  }

  function getEventTop(event: ScheduleEvent): number {
    const h = event.startAt.getHours();
    const m = event.startAt.getMinutes();
    return ((h - 6) * 60 + m) * (48 / 60); // 48px per hour
  }

  function getEventHeight(event: ScheduleEvent): number {
    const diff = (event.endAt.getTime() - event.startAt.getTime()) / 60000;
    return Math.max(diff * (48 / 60), 24);
  }

  function isHighlighted(date: Date): boolean {
    return highlightDates.some((h) => isSameDay(h, date));
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="py-2" />
        {weekDates.map((date, i) => {
          const today = isToday(date);
          const highlighted = isHighlighted(date);
          return (
            <div
              key={i}
              className={`py-2 text-center border-l border-slate-200/60 dark:border-slate-700/60 transition-colors
                ${highlighted ? "bg-indigo-50/70 dark:bg-indigo-900/20" : ""}
              `}
            >
              <span className={`text-xs font-medium ${i >= 5 ? "text-rose-400" : "text-slate-400 dark:text-slate-500"}`}>
                {WEEKDAYS[i]}
              </span>
              <span className={`
                block text-lg font-bold mt-0.5
                ${today ? "w-8 h-8 mx-auto rounded-full bg-indigo-600 text-white flex items-center justify-center" : "text-slate-800 dark:text-slate-200"}
              `}>
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative" style={{ height: `${hours.length * 48}px` }}>
          {/* Time labels */}
          {hours.map((h) => (
            <div
              key={h}
              className="col-start-1 text-right pr-2 text-[11px] text-slate-400 dark:text-slate-500"
              style={{ gridRow: `${h - 5}`, height: "48px" }}
            >
              <span className="-translate-y-2 block">{`${h}:00`}</span>
            </div>
          ))}

          {/* Hour lines */}
          {hours.map((h) => (
            <div
              key={`line-${h}`}
              className="col-start-2 col-span-7 border-t border-slate-100 dark:border-slate-800"
              style={{ position: "absolute", top: `${(h - 6) * 48}px`, left: "60px", right: 0 }}
            />
          ))}

          {/* Day columns with events */}
          {weekDates.map((date, dayIdx) => {
            const dayEvents = getEventsForDay(date);
            const highlighted = isHighlighted(date);

            return (
              <div
                key={dayIdx}
                className={`relative border-l border-slate-100 dark:border-slate-800 ${highlighted ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""}`}
                style={{ gridColumn: dayIdx + 2, gridRow: "1 / -1", height: "100%" }}
              >
                {highlighted && (
                  <div className="absolute inset-0 bg-indigo-400/5 animate-pulse pointer-events-none" />
                )}
                {dayEvents.map((event) => {
                  const top = getEventTop(event);
                  const height = getEventHeight(event);
                  const catColors: Record<string, string> = {
                    food: "bg-orange-200/80 border-orange-300 text-orange-800 dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-300",
                    work: "bg-blue-200/80 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300",
                    sports: "bg-green-200/80 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300",
                    entertainment: "bg-purple-200/80 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-300",
                    hobby: "bg-pink-200/80 border-pink-300 text-pink-800 dark:bg-pink-900/40 dark:border-pink-700 dark:text-pink-300",
                  };
                  const color = catColors[event.category || ""] || "bg-slate-200/80 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300";

                  return (
                    <button
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className={`absolute left-0.5 right-0.5 rounded-md border-l-[3px] px-1.5 py-0.5 overflow-hidden cursor-pointer text-left transition-opacity hover:opacity-80 ${color}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className="flex items-center gap-1">
                        <RatingBadge rating={event.rating} size="sm" />
                        <span className="text-[11px] font-medium truncate">{event.title}</span>
                      </div>
                      <span className="text-[10px] opacity-70">{formatTime(event.startAt)}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
