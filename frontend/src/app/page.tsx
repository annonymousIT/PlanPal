"use client";

import { useState, useCallback, useEffect } from "react";
import { ScheduleEvent, CalendarView, CalendarSource, Rating, UserSettings } from "@/types";
import { dummyEvents, defaultCalendarSources, defaultSettings } from "@/lib/dummy-data";
import CalendarHeader from "@/components/CalendarHeader";
import Sidebar from "@/components/Sidebar";
import MonthView from "@/components/MonthView";
import WeekView from "@/components/WeekView";
import DayView from "@/components/DayView";
import EventPanel from "@/components/EventPanel";
import MagicBar from "@/components/MagicBar";
import SettingsModal from "@/components/SettingsModal";

export default function Home() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>(dummyEvents);
  const [calendars, setCalendars] = useState<CalendarSource[]>(defaultCalendarSources);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [highlightDates, setHighlightDates] = useState<Date[]>([]);

  // Apply theme
  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.theme]);

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
  }, []);

  const handleComment = useCallback((eventId: string, comment: string) => {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, comment } : e)));
    setSelectedEvent((prev) => prev?.id === eventId ? { ...prev, comment } : prev);
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
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          calendars={calendars}
          onToggleCalendar={handleToggleCalendar}
          year={year} month={month}
          selectedDate={selectedDate}
          onSelectDate={(d) => { setSelectedDate(d); setMonth(d.getMonth()); setYear(d.getFullYear()); }}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Calendar views */}
        {view === "month" && (
          <MonthView
            year={year} month={month} events={visibleEvents}
            selectedDate={selectedDate} highlightDates={highlightDates}
            onSelectDate={setSelectedDate} onSelectEvent={setSelectedEvent}
          />
        )}

        {view === "week" && (
          <WeekView
            currentDate={currentDate} events={visibleEvents}
            highlightDates={highlightDates} onSelectEvent={setSelectedEvent}
          />
        )}

        {view === "day" && (
          <DayView
            currentDate={currentDate} events={visibleEvents}
            highlightDates={highlightDates} onSelectEvent={setSelectedEvent}
          />
        )}
      </div>

      {/* Event panel */}
      <EventPanel
        event={selectedEvent} onClose={() => setSelectedEvent(null)}
        onRate={handleRate} onComment={handleComment}
      />

      {/* Settings modal */}
      <SettingsModal
        isOpen={settingsOpen} settings={settings}
        onClose={() => setSettingsOpen(false)} onUpdateSettings={handleUpdateSettings}
      />

      {/* Magic Bar */}
      <MagicBar onHighlightDates={setHighlightDates} onAddEvent={handleAddEvent} />
    </div>
  );
}
