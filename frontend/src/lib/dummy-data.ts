import { ScheduleEvent, CalendarSource, UserSettings } from "@/types";

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();

function d(day: number, sH: number, sM: number, eH: number, eM: number) {
  return { startAt: new Date(y, m, day, sH, sM), endAt: new Date(y, m, day, eH, eM) };
}

export const defaultCalendarSources: CalendarSource[] = [
  { id: "cal-1", name: "しょすけ", color: "#4F46E5", visible: true },
  { id: "cal-2", name: "Family", color: "#059669", visible: true },
  { id: "cal-3", name: "Sho Personal", color: "#D97706", visible: true },
  { id: "cal-4", name: "Sho Rits", color: "#2563EB", visible: true },
  { id: "cal-5", name: "誕生日", color: "#10B981", visible: false },
];

export const defaultSettings: UserSettings = {
  theme: "light",
  accentColor: "indigo",
  locale: "ja",
  timezone: "Asia/Tokyo",
  notificationsOn: true,
  ratingReminderOn: true,
  weekStartsOn: "monday",
};

export const dummyEvents: ScheduleEvent[] = [
  {
    id: "1", title: "チームミーティング", ...d(3, 10, 0, 11, 0),
    location: "Zoom", category: "work",
    participants: [{ id: "p1", name: "田中" }],
    rating: "circle", comment: "効率的に終わった", calendarId: "cal-4",
  },
  {
    id: "2", title: "ランチ @ イタリアン", ...d(5, 12, 0, 13, 30),
    location: "トラットリア", category: "food",
    participants: [{ id: "p2", name: "あや" }],
    rating: "circle", comment: "パスタが美味しかった", calendarId: "cal-3",
  },
  {
    id: "3", title: "ジム", ...d(7, 18, 0, 19, 30),
    location: "エニタイムフィットネス", category: "sports",
    participants: [], rating: "triangle", comment: "混んでた", calendarId: "cal-1",
  },
  {
    id: "4", title: "映画 デート", ...d(10, 14, 0, 16, 30),
    location: "TOHOシネマズ", category: "entertainment",
    participants: [{ id: "p2", name: "あや" }],
    rating: null, calendarId: "cal-3",
  },
  {
    id: "5", title: "ES 書く", ...d(12, 9, 0, 12, 0),
    category: "work", participants: [],
    rating: "cross", comment: "集中できなかった", calendarId: "cal-1",
  },
  {
    id: "6", title: "ダンス練習", ...d(14, 19, 0, 21, 0),
    location: "スタジオA", category: "sports",
    participants: [{ id: "p3", name: "サークルメンバー" }],
    rating: "circle", calendarId: "cal-4",
  },
  {
    id: "7", title: "焼肉 @ 牛角", ...d(16, 19, 0, 21, 0),
    location: "牛角 草津店", category: "food",
    participants: [{ id: "p4", name: "友達グループ" }],
    rating: null, calendarId: "cal-3",
  },
  {
    id: "8", title: "面接対策", ...d(18, 13, 0, 15, 0),
    category: "work", participants: [], rating: null, calendarId: "cal-1",
  },
  {
    id: "9", title: "あやと カフェ", ...d(20, 15, 0, 17, 0),
    location: "スターバックス", category: "food",
    participants: [{ id: "p2", name: "あや" }],
    rating: "circle", comment: "新作フラペチーノ良かった", calendarId: "cal-3",
  },
  {
    id: "10", title: "ゴルフ練習", ...d(22, 8, 0, 10, 0),
    location: "打ちっぱなし", category: "sports",
    participants: [], rating: null, calendarId: "cal-3",
  },
  {
    id: "11", title: "家族ディナー", ...d(25, 18, 0, 20, 0),
    location: "実家", category: "food",
    participants: [{ id: "p5", name: "家族" }],
    rating: null, calendarId: "cal-2",
  },
  {
    id: "12", title: "ピアノ練習", ...d(27, 20, 0, 21, 0),
    category: "hobby", participants: [], rating: null, calendarId: "cal-1",
  },
  {
    id: "13", title: "OB訪問", ...d(8, 14, 0, 15, 30),
    location: "梅田カフェ", category: "work",
    participants: [{ id: "p6", name: "先輩" }],
    rating: null, calendarId: "cal-1",
  },
  {
    id: "14", title: "編み物タイム", ...d(6, 20, 0, 22, 0),
    category: "hobby", participants: [], rating: "circle", calendarId: "cal-1",
  },
  {
    id: "15", title: "バイト", ...d(9, 17, 0, 22, 0),
    location: "キッチン", category: "work",
    participants: [], rating: null, calendarId: "cal-1",
  },
];
