"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScheduleEvent, Rating } from "@/types";
import { formatTime, formatDate } from "@/lib/calendar-utils";
import RatingButtons from "./RatingButtons";
import RatingBadge from "./RatingBadge";

const EVENT_COLORS = [
  { hex: "", label: "デフォルト" },
  { hex: "#6366f1", label: "インディゴ" },
  { hex: "#e11d48", label: "ローズ" },
  { hex: "#f97316", label: "オレンジ" },
  { hex: "#eab308", label: "イエロー" },
  { hex: "#22c55e", label: "グリーン" },
  { hex: "#06b6d4", label: "シアン" },
  { hex: "#3b82f6", label: "ブルー" },
  { hex: "#a855f7", label: "パープル" },
  { hex: "#ec4899", label: "ピンク" },
];

interface EventPanelProps {
  event: ScheduleEvent | null;
  onClose: () => void;
  onRate: (eventId: string, rating: Rating) => void;
  onComment: (eventId: string, comment: string) => void;
  onUpdate: (eventId: string, updates: { title: string; start_at: string; end_at: string; location: string; category: string; color: string }) => void;
  onDelete: (eventId: string) => void;
}

const CATEGORIES = [
  { value: "", label: "カテゴリなし" },
  { value: "food", label: "グルメ" },
  { value: "work", label: "仕事" },
  { value: "sports", label: "スポーツ" },
  { value: "entertainment", label: "エンタメ" },
  { value: "hobby", label: "趣味" },
];

const categoryLabels: Record<string, { label: string; color: string }> = {
  food: { label: "グルメ", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  work: { label: "仕事", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  sports: { label: "スポーツ", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  entertainment: { label: "エンタメ", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  hobby: { label: "趣味", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
};

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Parses a datetime-local string ("YYYY-MM-DDTHH:mm") explicitly as local time
// to avoid browser inconsistencies, then converts to ISO (UTC).
function localToISO(datetimeLocal: string): string {
  const [datePart, timePart] = datetimeLocal.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  return new Date(y, mo - 1, d, h, mi).toISOString();
}

export default function EventPanel({ event, onClose, onRate, onComment, onUpdate, onDelete }: EventPanelProps) {
  const [commentDraft, setCommentDraft] = useState("");
  const [editingComment, setEditingComment] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editColor, setEditColor] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Rating available once the event has started (not just ended)
  const canRate = event ? event.startAt <= new Date() : false;
  const cat = event?.category ? categoryLabels[event.category] : null;

  function startEdit() {
    if (!event) return;
    setEditTitle(event.title);
    setEditStart(toDatetimeLocal(event.startAt));
    setEditEnd(toDatetimeLocal(event.endAt));
    setEditLocation(event.location ?? "");
    setEditCategory(event.category ?? "");
    setEditColor(event.color ?? "");
    setIsEditing(true);
  }

  function saveEdit() {
    if (!event || !editTitle.trim()) return;
    if (editStart && editEnd && localToISO(editEnd) <= localToISO(editStart)) {
      alert("終了時刻は開始時刻より後にしてください");
      return;
    }
    onUpdate(event.id, {
      title: editTitle.trim(),
      start_at: localToISO(editStart),
      end_at: localToISO(editEnd),
      location: editLocation,
      category: editCategory,
      color: editColor,
    });
    setIsEditing(false);
  }

  function handleClose() {
    setIsEditing(false);
    setConfirmDelete(false);
    setEditingComment(false);
    setCommentDraft("");
    onClose();
  }

  return (
    <AnimatePresence>
      {event && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40"
            onClick={handleClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex-1 min-w-0 pr-4">
                {!isEditing && (
                  <div className="flex items-center gap-2 mb-2">
                    {event.color && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: event.color }} />}
                    {cat && <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cat.color}`}>{cat.label}</span>}
                    <RatingBadge rating={event.rating} size="md" />
                  </div>
                )}
                {isEditing ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-xl font-bold bg-transparent border-b-2 border-indigo-400 focus:outline-none text-slate-800 dark:text-slate-100 pb-1"
                    autoFocus
                  />
                ) : (
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">{event.title}</h2>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isEditing && (
                  <button
                    onClick={startEdit}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="編集"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Edit form */}
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">開始</label>
                    <input
                      type="datetime-local"
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">終了</label>
                    <input
                      type="datetime-local"
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">場所</label>
                    <input
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="場所（省略可）"
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">カテゴリ</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 text-slate-800 dark:text-slate-200"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">カラー</label>
                    <div className="flex flex-wrap gap-2">
                      {EVENT_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          onClick={() => setEditColor(c.hex)}
                          title={c.label}
                          className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${editColor === c.hex ? "border-slate-800 dark:border-white scale-110" : "border-transparent hover:scale-105"}`}
                          style={{ backgroundColor: c.hex || "#e2e8f0" }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={saveEdit}
                      disabled={!editTitle.trim()}
                      className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Event details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium">{formatDate(event.startAt)}</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500">
                          {event.isAllDay ? "終日" : `${formatTime(event.startAt)} 〜 ${formatTime(event.endAt)}`}
                        </p>
                      </div>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm">{event.location}</p>
                      </div>
                    )}

                    {event.participants.length > 0 && (
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                  {/* Rating */}
                  {canRate ? (
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
                  ) : (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">開始後に評価できます</span>
                      </div>
                    </div>
                  )}

                  {/* Comment */}
                  {canRate && (
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
                      {event.comment && !editingComment ? (
                        <div className="flex items-start gap-2">
                          <p className="flex-1 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">{event.comment}</p>
                          <button
                            onClick={() => { setCommentDraft(event.comment ?? ""); setEditingComment(true); }}
                            className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentDraft}
                            onChange={(e) => setCommentDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && commentDraft.trim()) {
                                onComment(event.id, commentDraft.trim());
                                setCommentDraft("");
                                setEditingComment(false);
                              }
                              if (e.key === "Escape") {
                                setCommentDraft("");
                                setEditingComment(false);
                              }
                            }}
                            placeholder="一言メモを残す..."
                            autoFocus={editingComment}
                            className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 text-slate-800 dark:text-slate-200"
                          />
                          <button
                            onClick={() => {
                              if (commentDraft.trim()) {
                                onComment(event.id, commentDraft.trim());
                                setCommentDraft("");
                                setEditingComment(false);
                              }
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                          >
                            保存
                          </button>
                          {editingComment && (
                            <button
                              onClick={() => { setCommentDraft(""); setEditingComment(false); }}
                              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </div>

            {/* Footer: delete */}
            {!isEditing && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                {confirmDelete ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onDelete(event.id); handleClose(); }}
                      className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      削除する
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full py-2.5 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors cursor-pointer"
                  >
                    この予定を削除
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
