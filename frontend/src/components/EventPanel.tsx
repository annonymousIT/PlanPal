"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScheduleEvent, Rating } from "@/types";
import { formatTime, formatDate } from "@/lib/calendar-utils";
import RatingButtons from "./RatingButtons";
import RatingBadge from "./RatingBadge";

interface EventPanelProps {
  event: ScheduleEvent | null;
  onClose: () => void;
  onRate: (eventId: string, rating: Rating) => void;
  onComment: (eventId: string, comment: string) => void;
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  food: { label: "グルメ", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  work: { label: "仕事", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  sports: { label: "スポーツ", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  entertainment: { label: "エンタメ", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  hobby: { label: "趣味", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
};

export default function EventPanel({ event, onClose, onRate, onComment }: EventPanelProps) {
  const [commentDraft, setCommentDraft] = useState("");
  const isPast = event ? event.endAt < new Date() : false;

  const cat = event?.category ? categoryLabels[event.category] : null;

  return (
    <AnimatePresence>
      {event && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  {cat && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cat.color}`}>{cat.label}</span>
                  )}
                  <RatingBadge rating={event.rating} size="md" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">{event.title}</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium">{formatDate(event.startAt)}</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">{formatTime(event.startAt)} 〜 {formatTime(event.endAt)}</p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm">{event.location}</p>
                  </div>
                )}

                {event.participants.length > 0 && (
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {event.participants.map((p) => (
                        <span key={p.id} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-600 dark:text-slate-300">
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isPast && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="space-y-3"
                >
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    評価
                  </h3>
                  <RatingButtons currentRating={event.rating} onRate={(r) => onRate(event.id, r)} />
                </motion.div>
              )}

              {isPast && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="space-y-3"
                >
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    コメント
                  </h3>
                  {event.comment ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">{event.comment}</p>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        placeholder="一言メモを残す..."
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-400 transition-all text-slate-800 dark:text-slate-200"
                      />
                      <button
                        onClick={() => { if (commentDraft.trim()) { onComment(event.id, commentDraft.trim()); setCommentDraft(""); } }}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                      >
                        保存
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {!isPast && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">予定は終了後に評価できます</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  過去の類似予定
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 dark:text-slate-500">学習データが溜まると、ここに類似予定が表示されます</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
