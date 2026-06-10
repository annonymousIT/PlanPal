"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ScheduleEvent } from "@/types";
import { formatTime } from "@/lib/calendar-utils";
import RatingBadge from "./RatingBadge";

interface DayEventsPopupProps {
  date: Date | null;
  events: ScheduleEvent[];
  onClose: () => void;
  onSelectEvent: (event: ScheduleEvent) => void;
  onCreateEvent?: (date: Date) => void;
}

const categoryColor: Record<string, string> = {
  food: "bg-orange-400",
  work: "bg-blue-400",
  sports: "bg-green-400",
  entertainment: "bg-purple-400",
  hobby: "bg-pink-400",
};

export default function DayEventsPopup({ date, events, onClose, onSelectEvent, onCreateEvent }: DayEventsPopupProps) {
  if (!date) return null;

  const label = date.toLocaleDateString("ja-JP", {
    month: "long", day: "numeric", weekday: "short",
  });

  return (
    <AnimatePresence>
      {date && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{label}</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">{events.length}件</span>
                {onCreateEvent && (
                  <button
                    onClick={() => { onCreateEvent(date!); onClose(); }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    追加
                  </button>
                )}
              </div>
            </div>

            {/* Event list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => { onSelectEvent(event); onClose(); }}
                  className="w-full text-left px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center gap-3"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${categoryColor[event.category ?? ""] ?? "bg-slate-300"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{event.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {event.isAllDay
                        ? "終日"
                        : `${formatTime(event.startAt)} 〜 ${formatTime(event.endAt)}`}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                  <RatingBadge rating={event.rating} size="sm" />
                </button>
              ))}
            </div>

            {/* Bottom safe area */}
            <div className="h-6" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
