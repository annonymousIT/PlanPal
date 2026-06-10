"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScheduleEvent } from "@/types";
import { createEvent } from "@/lib/api";

const EVENT_COLORS = [
  { hex: "", label: "デフォルト" },
  { hex: "#6366f1", label: "インディゴ" },
  { hex: "#e11d48", label: "ローズ" },
  { hex: "#f97316", label: "オレンジ" },
  { hex: "#22c55e", label: "グリーン" },
  { hex: "#06b6d4", label: "シアン" },
  { hex: "#3b82f6", label: "ブルー" },
  { hex: "#a855f7", label: "パープル" },
];

const CATEGORIES = [
  { value: "", label: "カテゴリなし" },
  { value: "food", label: "グルメ" },
  { value: "work", label: "仕事" },
  { value: "sports", label: "スポーツ" },
  { value: "entertainment", label: "エンタメ" },
  { value: "hobby", label: "趣味" },
];

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface QuickCreatePanelProps {
  defaultStart: Date | null;
  defaultEnd: Date | null;
  onClose: () => void;
  onCreate: (event: ScheduleEvent) => void;
  onError: (msg: string) => void;
}

export default function QuickCreatePanel({ defaultStart, defaultEnd, onClose, onCreate, onError }: QuickCreatePanelProps) {
  const open = !!defaultStart;
  const [title, setTitle] = useState("");
  const [startVal, setStartVal] = useState("");
  const [endVal, setEndVal] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form whenever the panel opens with new defaults
  useEffect(() => {
    if (!defaultStart) return;
    setTitle("");
    setStartVal(toDatetimeLocal(defaultStart));
    setEndVal(defaultEnd ? toDatetimeLocal(defaultEnd) : "");
    setLocation("");
    setCategory("");
    setColor("");
    setSaving(false);
  }, [defaultStart, defaultEnd]);

  async function handleSave() {
    if (!title.trim() || !startVal || !endVal) return;
    const startISO = new Date(startVal).toISOString();
    const endISO = new Date(endVal).toISOString();
    if (endISO <= startISO) {
      onError("終了時刻は開始時刻より後にしてください");
      return;
    }
    setSaving(true);
    try {
      const event = await createEvent({
        title: title.trim(),
        start_at: startISO,
        end_at: endISO,
        location: location || undefined,
        category: category || undefined,
        color: color || undefined,
      });
      onCreate(event);
      onClose();
    } catch {
      onError("予定の作成に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">予定を追加</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                  placeholder="タイトルを入力..."
                  className="w-full text-xl font-bold bg-transparent border-b-2 border-indigo-400 focus:outline-none text-slate-800 dark:text-slate-100 pb-1 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">開始</label>
                <input
                  type="datetime-local"
                  value={startVal}
                  onChange={(e) => setStartVal(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">終了</label>
                <input
                  type="datetime-local"
                  value={endVal}
                  onChange={(e) => setEndVal(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">場所</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="場所（省略可）"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">カテゴリ</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                      onClick={() => setColor(c.hex)}
                      title={c.label}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${color === c.hex ? "border-slate-800 dark:border-white scale-110" : "border-transparent hover:scale-105"}`}
                      style={{ backgroundColor: c.hex || "#e2e8f0" }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                onClick={handleSave}
                disabled={!title.trim() || saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {saving ? "保存中..." : "追加"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
