"use client";

import { ScheduleEvent } from "@/types";
import { getWeekDates, isToday, isSameDay, formatTime } from "@/lib/calendar-utils";
import RatingBadge from "./RatingBadge";

interface WeekViewProps {
  currentDate: Date;
  events: ScheduleEvent[];
  highlightDates: Date[];
  weekStartsOn?: "monday" | "sunday";
  onSelectEvent: (event: ScheduleEvent) => void;
  onTimeSlotClick?: (start: Date, end: Date) => void;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function WeekView({ currentDate, events, highlightDates, weekStartsOn = "monday", onSelectEvent, onTimeSlotClick }: WeekViewProps) {
  const weekDates = getWeekDates(currentDate, weekStartsOn);
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 ~ 21:00

  function getTimedEvents(date: Date): ScheduleEvent[] {
    return events.filter((e) => !e.isAllDay && isSameDay(e.startAt, date) && e.startAt.getHours() >= 6);
  }

  function getEarlyEvents(date: Date): ScheduleEvent[] {
    return events.filter((e) => !e.isAllDay && isSameDay(e.startAt, date) && e.startAt.getHours() < 6);
  }

  function getAllDayEvents(date: Date): ScheduleEvent[] {
    return events.filter((e) => e.isAllDay && isSameDay(e.startAt, date));
  }

  function getEventTop(event: ScheduleEvent): number {
    const h = event.startAt.getHours();
    const m = event.startAt.getMinutes();
    return Math.max(0, (h - 6) * 60 + m) * (48 / 60); // 48px per hour
  }

  function getEventHeight(event: ScheduleEvent): number {
    const diff = (event.endAt.getTime() - event.startAt.getTime()) / 60000;
    return Math.max(diff * (48 / 60), 24);
  }

  function isHighlighted(date: Date): boolean {
    return highlightDates.some((h) => isSameDay(h, date));
  }

  const catColors: Record<string, string> = {
    food: "bg-orange-200/80 border-orange-300 text-orange-800 dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-300",
    work: "bg-blue-200/80 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300",
    sports: "bg-green-200/80 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300",
    entertainment: "bg-purple-200/80 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-300",
    hobby: "bg-pink-200/80 border-pink-300 text-pink-800 dark:bg-pink-900/40 dark:border-pink-700 dark:text-pink-300",
  };

  const hasAllDay = weekDates.some((d) => getAllDayEvents(d).length > 0);
  const hasEarly = weekDates.some((d) => getEarlyEvents(d).length > 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="py-2" />
        {weekDates.map((date, i) => {
          const today = isToday(date);
          const highlighted = isHighlighted(date);
          const dow = date.getDay(); // 0=Sun, 6=Sat
          const isWeekend = dow === 0 || dow === 6;
          return (
            <div
              key={i}
              className={`py-2 text-center border-l border-slate-200/60 dark:border-slate-700/60 transition-colors
                ${highlighted ? "bg-indigo-50/70 dark:bg-indigo-900/20" : ""}
              `}
            >
              <span className={`text-xs font-medium ${isWeekend ? "text-rose-400" : "text-slate-400 dark:text-slate-500"}`}>
                {WEEKDAY_LABELS[dow]}
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

      {/* All-day strip */}
      {hasAllDay && (
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
          <div className="py-1.5 text-right pr-2 text-[10px] text-slate-400 dark:text-slate-500 self-center">終日</div>
          {weekDates.map((date, i) => (
            <div key={i} className="border-l border-slate-100 dark:border-slate-800 px-0.5 py-1 flex flex-col gap-0.5">
              {getAllDayEvents(date).map((event) => (
                <button
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  className="w-full px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer hover:opacity-80 text-white text-left"
                  style={{ backgroundColor: event.color || "#6366f1" }}
                >
                  {event.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Early events strip (before 6AM) */}
      {hasEarly && (
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
          <div className="py-1.5 text-right pr-2 text-[10px] text-slate-400 dark:text-slate-500 self-center">早朝</div>
          {weekDates.map((date, i) => (
            <div key={i} className="border-l border-slate-100 dark:border-slate-800 px-0.5 py-1 flex flex-col gap-0.5">
              {getEarlyEvents(date).map((event) => (
                <button
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  className="w-full px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer hover:opacity-80 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-left"
                >
                  {formatTime(event.startAt)} {event.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

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
            const dayEvents = getTimedEvents(date);
            const highlighted = isHighlighted(date);

            function handleColumnClick(e: React.MouseEvent<HTMLDivElement>) {
              if (!onTimeSlotClick) return;
              // Ignore clicks that originated from an event button
              if ((e.target as Element).closest("button")) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const offsetY = e.clientY - rect.top;
              const totalMinutes = Math.floor(offsetY / 48 * 60); // 48px per hour
              const hour = 6 + Math.floor(totalMinutes / 60);
              const minute = Math.floor(totalMinutes % 60 / 15) * 15;
              const start = new Date(date);
              start.setHours(hour, minute, 0, 0);
              const end = new Date(start);
              end.setHours(start.getHours() + 1, start.getMinutes(), 0, 0);
              onTimeSlotClick(start, end);
            }

            return (
              <div
                key={dayIdx}
                onClick={handleColumnClick}
                className={`relative border-l border-slate-100 dark:border-slate-800 ${highlighted ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""} ${onTimeSlotClick ? "cursor-cell" : ""}`}
                style={{ gridColumn: dayIdx + 2, gridRow: "1 / -1", height: "100%" }}
              >
                {highlighted && (
                  <div className="absolute inset-0 bg-indigo-400/5 animate-pulse pointer-events-none" />
                )}
                {dayEvents.map((event) => {
                  const top = getEventTop(event);
                  const height = getEventHeight(event);
                  const hasCustomColor = !!event.color;
                  const color = catColors[event.category || ""] || "bg-slate-200/80 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300";

                  return (
                    <button
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className={`absolute left-0.5 right-0.5 rounded-md border-l-[3px] px-1.5 py-0.5 overflow-hidden cursor-pointer text-left transition-opacity hover:opacity-80 ${!hasCustomColor ? color : ""}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        ...(hasCustomColor ? {
                          backgroundColor: `${event.color}30`,
                          borderLeftColor: event.color,
                          color: event.color,
                        } : {}),
                      }}
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
