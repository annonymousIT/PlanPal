"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIProposal, ScheduleEvent } from "@/types";
import { fetchMagicBarProposals, createEvent } from "@/lib/api";

interface MagicBarProps {
  onHighlightDates: (dates: Date[]) => void;
  onAddEvent: (event: ScheduleEvent) => void;
}

export default function MagicBar({ onHighlightDates, onAddEvent }: MagicBarProps) {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [proposals, setProposals] = useState<AIProposal[]>([]);
  const [isDirect, setIsDirect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setIsOpen(true);
    try {
      const result = await fetchMagicBarProposals(input.trim());
      setProposals(result.proposals);
      setIsDirect(result.direct);
      onHighlightDates(result.proposals.map((p: AIProposal) => p.startAt));
      setErrorMsg(null);
    } catch (e) {
      setProposals([]);
      setIsDirect(false);
      setErrorMsg(e instanceof Error ? e.message : "AI提案の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setProposals([]);
    setIsDirect(false);
    setInput("");
    setAddedId(null);
    setErrorMsg(null);
    onHighlightDates([]);
  };

  const handleAddProposal = async (p: AIProposal) => {
    setAddedId(p.id);
    try {
      const saved = await createEvent({
        title: p.title,
        start_at: p.startAt.toISOString(),
        end_at: p.endAt.toISOString(),
        location: p.location,
      });
      setTimeout(() => {
        onAddEvent(saved);
        setTimeout(handleClose, 800);
      }, 400);
    } catch {
      // フォールバック: ローカルのみ追加
      const newEvent: ScheduleEvent = {
        id: `added-${p.id}`,
        title: p.title,
        startAt: p.startAt,
        endAt: p.endAt,
        location: p.location,
        participants: [],
        rating: null,
        calendarId: "local",
      };
      setTimeout(() => {
        onAddEvent(newEvent);
        setTimeout(handleClose, 800);
      }, 400);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-16 z-30 px-4 pb-2"
          >
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-sm font-medium text-white">
                    {isLoading ? "考え中..." : errorMsg ? "エラーが発生しました" : isDirect ? "日時を確認" : `${proposals.length}件の候補`}
                  </span>
                </div>
                <button onClick={handleClose} className="text-white/80 hover:text-white text-sm cursor-pointer">
                  閉じる
                </button>
              </div>

              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">AIが候補を探しています...</span>
                  </div>
                </div>
              ) : errorMsg ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-red-500 dark:text-red-400">{errorMsg}</p>
                  <button onClick={handleClose} className="mt-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                    閉じる
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                  {proposals.map((p, i) => {
                    const isAdded = addedId === p.id;
                    return (
                      <motion.button
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => !addedId && handleAddProposal(p)}
                        disabled={!!addedId}
                        className={`
                          w-full text-left px-4 py-3.5 transition-all cursor-pointer group relative
                          ${isAdded ? "bg-emerald-50 dark:bg-emerald-900/20" : "hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20"}
                          ${addedId && !isAdded ? "opacity-40" : ""}
                        `}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{p.title}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              {p.startAt.toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}
                              {" "}
                              {p.startAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                              〜
                              {p.endAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                              {p.location && ` · ${p.location}`}
                            </p>
                          </div>
                          {isAdded ? (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              追加しました
                            </motion.span>
                          ) : (
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mt-0.5">
                              追加 →
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-start gap-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg px-3 py-2">
                          <svg className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-xs text-indigo-600/80 dark:text-indigo-300/80 leading-relaxed">{p.reasoning}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="「今週末ディナー」「来週友達と映画」..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            提案
          </button>
        </div>
      </div>
    </>
  );
}
