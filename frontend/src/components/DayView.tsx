"use client";

import { ScheduleEvent } from "@/types";
import { isSameDay, formatTime, formatDateFull } from "@/lib/calendar-utils";
import RatingBadge from "./RatingBadge";

interface DayViewProps {
  currentDate: Date;
  events: ScheduleEvent[];
  highlightDates: Date[];
  onSelectEvent: (event: ScheduleEvent) => void;
}

export default function DayView({ currentDate, events, highlightDates, onSelectEvent }: DayViewProps) {
  const hours = Array.from({ length: 18 }, (_, i) => i + 5); // 5:00 ~ 22:00
  const dayEvents = events.filter((e) => isSameDay(e.startAt, currentDate));
  const highlighted = highlightDates.some((h) => isSameDay(h, currentDate));

  function getEventTop(event: ScheduleEvent): number {
    const h = event.startAt.getHours();
    const m = event.startAt.getMinutes();
    return ((h - 5) * 60 + m) * (60 / 60); // 60px per hour
  }

  function getEventHeight(event: ScheduleEvent): number {
    const diff = (event.endAt.getTime() - event.startAt.getTime()) / 60000;
    return Math.max(diff * (60 / 60), 30);
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

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative" style={{ height: `${hours.length * 60}px` }}>
          {/* Hour lines */}
          {hours.map((h) => (
            <div key={h} className="absolute left-0 right-0 flex" style={{ top: `${(h - 5) * 60}px` }}>
              <span className="w-16 text-right pr-3 text-xs text-slate-400 dark:text-slate-500 -translate-y-2">{`${h}:00`}</span>
              <div className="flex-1 border-t border-slate-100 dark:border-slate-800" />
            </div>
          ))}

          {/* Highlight bg */}
          {highlighted && (
            <div className="absolute inset-0 left-16 bg-indigo-400/5 animate-pulse pointer-events-none" />
          )}

          {/* Events */}
          {dayEvents.map((event) => {
            const top = getEventTop(event);
            const height = getEventHeight(event);
            const catColors: Record<string, string> = {
              food: "bg-orange-100 border-orange-400 dark:bg-orange-900/30 dark:border-orange-600",
              work: "bg-blue-100 border-blue-400 dark:bg-blue-900/30 dark:border-blue-600",
              sports: "bg-green-100 border-green-400 dark:bg-green-900/30 dark:border-green-600",
              entertainment: "bg-purple-100 border-purple-400 dark:bg-purple-900/30 dark:border-purple-600",
              hobby: "bg-pink-100 border-pink-400 dark:bg-pink-900/30 dark:border-pink-600",
            };
            const color = catColors[event.category || ""] || "bg-slate-100 border-slate-400 dark:bg-slate-800 dark:border-slate-600";

            return (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={`absolute left-[72px] right-4 rounded-lg border-l-4 px-3 py-2 cursor-pointer text-left hover:shadow-md transition-shadow ${color}`}
                style={{ top: `${top}px`, height: `${height}px` }}
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
