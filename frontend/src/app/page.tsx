"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ScheduleEvent, CalendarView, CalendarSource, Rating, UserSettings, AccentColor } from "@/types";
import { defaultCalendarSources, defaultSettings } from "@/lib/dummy-data";
import { isLoggedIn, loginWithGoogle, fetchEvents, submitFeedback, updateEvent, deleteEvent, logout } from "@/lib/api";
import CalendarHeader from "@/components/CalendarHeader";
import Sidebar from "@/components/Sidebar";
import MonthView from "@/components/MonthView";
import WeekView from "@/components/WeekView";
import DayView from "@/components/DayView";
import EventPanel from "@/components/EventPanel";
import MagicBar from "@/components/MagicBar";
import SettingsModal from "@/components/SettingsModal";
import DayEventsPopup from "@/components/DayEventsPopup";
import QuickCreatePanel from "@/components/QuickCreatePanel";

export default function Home() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [calendars, setCalendars] = useState<CalendarSource[]>(defaultCalendarSources);
  const [settings, setSettings] = useState<UserSettings>(() => {
    if (typeof window === "undefined") return defaultSettings;
    try {
      const saved = localStorage.getItem("planpal_settings");
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [highlightDates, setHighlightDates] = useState<Date[]>([]);
  const [dayPopup, setDayPopup] = useState<{ date: Date; events: ScheduleEvent[] } | null>(null);
  const [createSlot, setCreateSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Feedback debounce: track pending state per event to avoid rating/comment race
  const pendingFeedback = useRef<Map<string, { rating: Rating; comment: string }>>(new Map());
  const feedbackTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function showError(msg: string) {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  }

  function scheduleFeedback(eventId: string) {
    clearTimeout(feedbackTimers.current.get(eventId));
    feedbackTimers.current.set(eventId, setTimeout(() => {
      const fb = pendingFeedback.current.get(eventId);
      if (fb) submitFeedback(eventId, fb.rating, fb.comment).catch(console.error);
    }, 500));
  }

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("planpal_settings", JSON.stringify(settings));
  }, [settings]);

  // Apply theme
  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.theme]);

  // Apply accent color by overriding CSS custom properties directly on <html>
  useEffect(() => {
    const palettes: Record<string, string[]> = {
      indigo: ["oklch(96.2% 0.018 272.314)","oklch(93% 0.034 272.788)","oklch(87% 0.065 274.039)","oklch(78.5% 0.115 274.713)","oklch(67.3% 0.182 276.935)","oklch(58.5% 0.233 277.117)","oklch(51.1% 0.262 276.966)","oklch(45.7% 0.24 277.023)","oklch(39.8% 0.195 277.366)","oklch(35.9% 0.144 278.697)","oklch(25.7% 0.09 281.288)"],
      rose:   ["oklch(96.9% 0.015 12.422)","oklch(94.1% 0.03 12.58)","oklch(89.2% 0.058 10.001)","oklch(81% 0.117 11.638)","oklch(71.2% 0.194 13.428)","oklch(64.5% 0.246 16.439)","oklch(58.6% 0.253 17.585)","oklch(51.4% 0.222 16.935)","oklch(45.5% 0.188 13.697)","oklch(41% 0.159 10.272)","oklch(27.1% 0.105 12.094)"],
      violet: ["oklch(96.9% 0.016 293.756)","oklch(94.3% 0.029 294.588)","oklch(89.4% 0.057 293.283)","oklch(81.1% 0.111 293.571)","oklch(70.2% 0.183 293.541)","oklch(60.6% 0.25 292.717)","oklch(54.1% 0.281 293.009)","oklch(49.1% 0.27 292.581)","oklch(43.2% 0.232 292.759)","oklch(38% 0.189 293.745)","oklch(28.3% 0.141 291.089)"],
      emerald:["oklch(97.9% 0.021 166.113)","oklch(95% 0.052 163.051)","oklch(90.5% 0.093 164.15)","oklch(84.5% 0.143 164.978)","oklch(76.5% 0.177 163.223)","oklch(69.6% 0.17 162.48)","oklch(59.6% 0.145 163.225)","oklch(50.8% 0.118 165.612)","oklch(43.2% 0.095 166.913)","oklch(37.8% 0.077 168.94)","oklch(26.2% 0.051 172.552)"],
      sky:    ["oklch(97.7% 0.013 236.62)","oklch(95.1% 0.026 236.824)","oklch(90.1% 0.058 230.902)","oklch(82.8% 0.111 230.318)","oklch(74.6% 0.16 232.661)","oklch(68.5% 0.169 237.323)","oklch(58.8% 0.158 241.966)","oklch(50% 0.134 242.749)","oklch(44.3% 0.11 240.79)","oklch(39.1% 0.09 240.876)","oklch(29.3% 0.066 243.157)"],
    };
    const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    const values = palettes[settings.accentColor] ?? palettes.indigo;
    const el = document.documentElement;
    shades.forEach((shade, i) => {
      el.style.setProperty(`--color-indigo-${shade}`, values[i]);
    });
  }, [settings.accentColor]);

  // Handle session expiry from API layer (refresh token expired)
  useEffect(() => {
    const handler = () => { setLoggedIn(false); setEvents([]); setCalendars(defaultCalendarSources); };
    window.addEventListener("planpal:session-expired", handler);
    return () => window.removeEventListener("planpal:session-expired", handler);
  }, []);

  // Auth check and initial event load
  useEffect(() => {
    const authed = isLoggedIn();
    setLoggedIn(authed);
    if (authed) {
      fetchEvents().then((evts) => {
        setEvents(evts);
        setCalendars([{ id: "google-primary", name: "Googleカレンダー", color: "#4285F4", visible: true }]);
      });
    }
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setLoggedIn(false);
    setEvents([]);
    setCalendars(defaultCalendarSources);
  }, []);

  // Filter events by visible calendars
  const visibleCalendarIds = calendars.filter((c) => c.visible).map((c) => c.id);
  const visibleEvents = events.filter((e) => visibleCalendarIds.includes(e.calendarId));

  const currentDate = selectedDate || new Date(year, month, now.getDate());

  const handlePrev = useCallback(() => {
    if (view === "month") {
      if (month === 0) { setMonth(11); setYear((y) => y - 1); }
      else setMonth((m) => m - 1);
    } else if (view === "week") {
      setSelectedDate((d) => {
        const prev = new Date(d || now);
        prev.setDate(prev.getDate() - 7);
        setMonth(prev.getMonth());
        setYear(prev.getFullYear());
        return prev;
      });
    } else {
      setSelectedDate((d) => {
        const prev = new Date(d || now);
        prev.setDate(prev.getDate() - 1);
        setMonth(prev.getMonth());
        setYear(prev.getFullYear());
        return prev;
      });
    }
  }, [month, view]);

  const handleNext = useCallback(() => {
    if (view === "month") {
      if (month === 11) { setMonth(0); setYear((y) => y + 1); }
      else setMonth((m) => m + 1);
    } else if (view === "week") {
      setSelectedDate((d) => {
        const next = new Date(d || now);
        next.setDate(next.getDate() + 7);
        setMonth(next.getMonth());
        setYear(next.getFullYear());
        return next;
      });
    } else {
      setSelectedDate((d) => {
        const next = new Date(d || now);
        next.setDate(next.getDate() + 1);
        setMonth(next.getMonth());
        setYear(next.getFullYear());
        return next;
      });
    }
  }, [month, view]);

  const handleToday = useCallback(() => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(now);
  }, []);

  const handleRate = useCallback((eventId: string, rating: Rating) => {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, rating } : e)));
    setSelectedEvent((prev) => prev?.id === eventId ? { ...prev, rating } : prev);
    const existing = pendingFeedback.current.get(eventId);
    const event = events.find((e) => e.id === eventId);
    pendingFeedback.current.set(eventId, { rating, comment: existing?.comment ?? event?.comment ?? "" });
    scheduleFeedback(eventId);
  }, [events]);

  const handleComment = useCallback((eventId: string, comment: string) => {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, comment } : e)));
    setSelectedEvent((prev) => prev?.id === eventId ? { ...prev, comment } : prev);
    const existing = pendingFeedback.current.get(eventId);
    const event = events.find((e) => e.id === eventId);
    pendingFeedback.current.set(eventId, { rating: existing?.rating ?? event?.rating ?? null, comment });
    scheduleFeedback(eventId);
  }, [events]);

  const handleUpdateEvent = useCallback((eventId: string, updates: { title: string; start_at: string; end_at: string; location: string; category: string; color: string }) => {
    updateEvent(eventId, updates).then((updated) => {
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
      setSelectedEvent(updated);
    }).catch(() => showError("予定の更新に失敗しました"));
  }, []);

  const handleDeleteEvent = useCallback((eventId: string) => {
    deleteEvent(eventId).then(() => {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setSelectedEvent(null);
    }).catch(() => showError("予定の削除に失敗しました"));
  }, []);

  const handleToggleCalendar = useCallback((id: string) => {
    setCalendars((prev) => prev.map((c) => c.id === id ? { ...c, visible: !c.visible } : c));
  }, []);

  const handleAddEvent = useCallback((event: ScheduleEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const handleUpdateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleDayClick = useCallback((date: Date, dayEvents: ScheduleEvent[]) => {
    setDayPopup({ date, events: dayEvents });
  }, []);

  const handleTimeSlotClick = useCallback((start: Date, end: Date) => {
    setCreateSlot({ start, end });
  }, []);

  if (!loggedIn) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">PlanPal</h1>
          <p className="text-sm text-slate-400 mt-1">あなたを学ぶAIカレンダー</p>
        </div>
        <button
          onClick={loginWithGoogle}
          className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-700 dark:text-slate-200 font-medium text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Googleでログイン
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300 pb-16">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-lg font-black tracking-tight text-indigo-600 dark:text-indigo-400">PlanPal</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">beta</span>
      </div>

      {/* Calendar header */}
      <CalendarHeader
        year={year} month={month} view={view}
        onPrev={handlePrev} onNext={handleNext} onToday={handleToday} onViewChange={setView}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          calendars={calendars}
          onToggleCalendar={handleToggleCalendar}
          year={year} month={month}
          selectedDate={selectedDate}
          weekStartsOn={settings.weekStartsOn}
          onSelectDate={(d) => { setSelectedDate(d); setMonth(d.getMonth()); setYear(d.getFullYear()); }}
          onOpenSettings={() => setSettingsOpen(true)}
          onLogout={handleLogout}
        />

        {view === "month" && (
          <MonthView
            year={year} month={month} events={visibleEvents}
            selectedDate={selectedDate} highlightDates={highlightDates}
            showWeekNumbers={settings.weekStartsOn === "monday"}
            weekStartsOn={settings.weekStartsOn}
            onSelectDate={setSelectedDate}
            onSelectEvent={setSelectedEvent}
            onDayClick={handleDayClick}
            onCreateEvent={handleTimeSlotClick}
          />
        )}

        {view === "week" && (
          <WeekView
            currentDate={currentDate} events={visibleEvents}
            highlightDates={highlightDates} weekStartsOn={settings.weekStartsOn}
            onSelectEvent={setSelectedEvent}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )}

        {view === "day" && (
          <DayView
            currentDate={currentDate} events={visibleEvents}
            highlightDates={highlightDates} onSelectEvent={setSelectedEvent}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )}
      </div>

      <EventPanel
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onRate={handleRate}
        onComment={handleComment}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
      />

      <DayEventsPopup
        date={dayPopup?.date ?? null}
        events={dayPopup?.events ?? []}
        onClose={() => setDayPopup(null)}
        onSelectEvent={(e) => { setSelectedEvent(e); setDayPopup(null); }}
        onCreateEvent={(date) => {
          const start = new Date(date);
          start.setHours(12, 0, 0, 0);
          const end = new Date(date);
          end.setHours(13, 0, 0, 0);
          setCreateSlot({ start, end });
          setDayPopup(null);
        }}
      />

      <SettingsModal
        isOpen={settingsOpen} settings={settings}
        onClose={() => setSettingsOpen(false)} onUpdateSettings={handleUpdateSettings}
      />

      <QuickCreatePanel
        defaultStart={createSlot?.start ?? null}
        defaultEnd={createSlot?.end ?? null}
        onClose={() => setCreateSlot(null)}
        onCreate={handleAddEvent}
        onError={showError}
      />

      <MagicBar onHighlightDates={setHighlightDates} onAddEvent={handleAddEvent} />

      {/* Error toast */}
      {errorMsg && (
        <div className="fixed bottom-24 left-1/2 z-50 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl shadow-lg animate-slide-in whitespace-nowrap">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
