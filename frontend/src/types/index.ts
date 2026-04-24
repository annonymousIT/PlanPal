export type Rating = "circle" | "cross" | "triangle" | null;

export interface Participant {
  id: string;
  name: string;
}

export interface CalendarSource {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  description?: string;
  category?: string;
  participants: Participant[];
  rating: Rating;
  comment?: string;
  calendarId: string;
}

export interface AIProposal {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  reasoning: string;
}

export type CalendarView = "month" | "week" | "day";
export type Theme = "light" | "dark";

export interface UserSettings {
  theme: Theme;
  locale: string;
  timezone: string;
  notificationsOn: boolean;
  ratingReminderOn: boolean;
  weekStartsOn: "monday" | "sunday";
}
