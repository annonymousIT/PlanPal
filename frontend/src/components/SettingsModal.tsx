"use client";

import { motion, AnimatePresence } from "framer-motion";
import { UserSettings, Theme, AccentColor } from "@/types";

interface SettingsModalProps {
  isOpen: boolean;
  settings: UserSettings;
  onClose: () => void;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

export default function SettingsModal({ isOpen, settings, onClose, onUpdateSettings }: SettingsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">設定</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Theme */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">テーマ</h3>
                <div className="flex gap-3">
                  {(["light", "dark"] as Theme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => onUpdateSettings({ theme: t })}
                      className={`
                        flex-1 p-3 rounded-xl border-2 transition-all cursor-pointer
                        ${settings.theme === t
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }
                      `}
                    >
                      <div className={`w-full h-8 rounded-lg mb-2 ${t === "light" ? "bg-white border border-slate-200" : "bg-slate-800 border border-slate-700"}`} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t === "light" ? "ライト" : "ダーク"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent color */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">アクセントカラー</h3>
                <div className="flex gap-3 flex-wrap">
                  {([
                    { v: "indigo" as AccentColor, color: "#4f46e5", label: "インディゴ" },
                    { v: "rose" as AccentColor, color: "#e11d48", label: "ローズ" },
                    { v: "violet" as AccentColor, color: "#7c3aed", label: "バイオレット" },
                    { v: "emerald" as AccentColor, color: "#059669", label: "エメラルド" },
                    { v: "sky" as AccentColor, color: "#0284c7", label: "スカイ" },
                  ]).map(({ v, color, label }) => (
                    <button
                      key={v}
                      onClick={() => onUpdateSettings({ accentColor: v })}
                      className={`flex flex-col items-center gap-1.5 cursor-pointer group`}
                    >
                      <span
                        className={`w-9 h-9 rounded-full transition-all ${settings.accentColor === v ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110" : "hover:scale-105"}`}
                        style={{ backgroundColor: color }}
                      />
                      <span className={`text-[10px] font-medium ${settings.accentColor === v ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">言語</h3>
                <select
                  value={settings.locale}
                  onChange={(e) => onUpdateSettings({ locale: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Timezone */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">タイムゾーン</h3>
                <select
                  value={settings.timezone}
                  onChange={(e) => onUpdateSettings({ timezone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
                >
                  <option value="Asia/Tokyo">(GMT+09:00) 日本標準時</option>
                  <option value="America/New_York">(GMT-05:00) 東部時間</option>
                  <option value="Europe/London">(GMT+00:00) ロンドン</option>
                </select>
              </div>

              {/* Week start */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">週の開始曜日</h3>
                <div className="flex gap-3">
                  {([{ v: "monday" as const, l: "月曜日" }, { v: "sunday" as const, l: "日曜日" }]).map(({ v, l }) => (
                    <button
                      key={v}
                      onClick={() => onUpdateSettings({ weekStartsOn: v })}
                      className={`
                        flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all cursor-pointer
                        ${settings.weekStartsOn === v
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }
                      `}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">通知</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-slate-600 dark:text-slate-300">通知を有効にする</span>
                    <button
                      onClick={() => onUpdateSettings({ notificationsOn: !settings.notificationsOn })}
                      className={`w-11 h-6 rounded-full transition-colors relative ${settings.notificationsOn ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${settings.notificationsOn ? "translate-x-5" : ""}`}
                      />
                    </button>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-slate-600 dark:text-slate-300">評価リマインダー</span>
                    <button
                      onClick={() => onUpdateSettings({ ratingReminderOn: !settings.ratingReminderOn })}
                      className={`w-11 h-6 rounded-full transition-colors relative ${settings.ratingReminderOn ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${settings.ratingReminderOn ? "translate-x-5" : ""}`}
                      />
                    </button>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
