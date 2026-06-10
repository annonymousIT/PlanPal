"use client";

import { ScheduleEvent } from "@/types";
import { isSameDay, formatTime, formatDateFull } from "@/lib/calendar-utils";
import RatingBadge from "./RatingBadge";

interface DayViewProps {
  currentDate: Date;
  events: ScheduleEvent[];
  highlightDates: Date[];
  onSelectEvent: (event: ScheduleEvent) => void;
  onTimeSlotClick?: (start: Date, end: Date) => void;
}

const CAT_COLORS: Record<string, string> = {
  food: "bg-orange-100 border-orange-400 dark:bg-orange-900/30 dark:border-orange-600",
  work: "bg-blue-100 border-blue-400 dark:bg-blue-900/30 dark:border-blue-600",
  sports: "bg-green-100 border-green-400 dark:bg-green-900/30 dark:border-green-600",
  entertainment: "bg-purple-100 border-purple-400 dark:bg-purple-900/30 dark:border-purple-600",
  hobby: "bg-pink-100 border-pink-400 dark:bg-pink-900/30 dark:border-pink-600",
};

export default function DayView({ currentDate, events, highlightDates, onSelectEvent, onTimeSlotClick }: DayViewProps) {
  const hours = Array.from({ length: 18 }, (_, i) => i + 5); // 5:00 ~ 22:00
  const dayEvents = events.filter((e) => isSameDay(e.startAt, currentDate));
  const allDayEvents = dayEvents.filter((e) => e.isAllDay);
  const earlyEvents = dayEvents.filter((e) => !e.isAllDay && e.startAt.getHours() < 5);
  const timedEvents = dayEvents.filter((e) => !e.isAllDay && e.startAt.getHours() >= 5);
  const highlighted = highlightDates.some((h) => isSameDay(h, currentDate));

  function getEventTop(event: ScheduleEvent): number {
    const h = event.startAt.getHours();
    const m = event.startAt.getMinutes();
    return Math.max(0, (h - 5) * 60 + m);
  }

  function getEventHeight(event: ScheduleEvent): number {
    const diff = (event.endAt.getTime() - event.startAt.getTime()) / 60000;
    return Math.max(diff, 30); // min 30px
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Date header */}
      <div className={`px-6 py-3 border-b border-slate-200/60 dark:border-slate-700/60 ${highlighted ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}`}>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatDateFull(currentDate)}</h2>
        {highlighted && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">AIが候補として提案中</span>
          </div>
        )}
        {dayEvents.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">予定はありません</p>
        )}
      </div>

      {/* Early events strip (before 5 AM) */}
      {earlyEvents.length > 0 && (
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5 bg-slate-50/60 dark:bg-slate-800/30">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 self-center mr-1 shrink-0">早朝</span>
          {earlyEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => onSelectEvent(event)}
              className="px-2 py-1 rounded text-xs font-medium cursor-pointer hover:opacity-80 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              {formatTime(event.startAt)} {event.title}
            </button>
          ))}
        </div>
      )}

      {/* All-day events strip */}
      {allDayEvents.length > 0 && (
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5 bg-slate-50/60 dark:bg-slate-800/30">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 self-center mr-1 shrink-0">終日</span>
          {allDayEvents.map((event) => {
            const color = event.color;
            return (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 text-white"
                style={{ backgroundColor: color || "#6366f1" }}
              >
                <span className="flex items-center gap-1">
                  <RatingBadge rating={event.rating} size="sm" />
                  {event.title}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div
          className={`relative ${onTimeSlotClick ? "cursor-cell" : ""}`}
          style={{ height: `${hours.length * 60}px` }}
          onClick={(e) => {
            if (!onTimeSlotClick) return;
            if ((e.target as Element).closest("button")) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const offsetY = e.clientY - rect.top;
            const hour = 5 + Math.floor(offsetY / 60);
            const minute = Math.floor((offsetY % 60) / 15) * 15;
            const start = new Date(currentDate);
            start.setHours(hour, minute, 0, 0);
            const end = new Date(start);
            end.setHours(start.getHours() + 1, start.getMinutes(), 0, 0);
            onTimeSlotClick(start, end);
          }}
        >
          {/* Hour lines */}
          {hours.map((h) => (
            <div key={h} className="absolute left-0 right-0 flex" style={{ top: `${(h - 5) * 60}px` }}>
              <span className="w-16 text-right pr-3 text-xs text-slate-400 dark:text-slate-500 -translate-y-2">{`${h}:00`}</span>
              <div className="flex-1 border-t border-slate-100 dark:border-slate-800" />
            </div>
          ))}

          {highlighted && (
            <div className="absolute inset-0 left-16 bg-indigo-400/5 animate-pulse pointer-events-none" />
          )}

          {/* Timed events */}
          {timedEvents.map((event) => {
            const top = getEventTop(event);
            const height = getEventHeight(event);
            const catClass = CAT_COLORS[event.category || ""] || "bg-slate-100 border-slate-400 dark:bg-slate-800 dark:border-slate-600";
            const hasCustomColor = !!event.color;

            return (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={`absolute left-[72px] right-4 rounded-lg border-l-4 px-3 py-2 cursor-pointer text-left hover:shadow-md transition-shadow ${!hasCustomColor ? catClass : ""}`}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  ...(hasCustomColor ? {
                    backgroundColor: `${event.color}18`,
                    borderLeftColor: event.color,
                  } : {}),
                }}
              >
                <div className="flex items-center gap-2">
                  <RatingBadge rating={event.rating} size="md" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{event.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatTime(event.startAt)} 〜 {formatTime(event.endAt)}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                </div>
                {event.participants.length > 0 && height > 50 && (
                  <div className="flex items-center gap-1 mt-1">
                    {event.participants.map((p) => (
                      <span key={p.id} className="text-[10px] px-1.5 py-0.5 bg-white/60 dark:bg-slate-700/60 rounded-full text-slate-600 dark:text-slate-300">
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
