import { ScheduleEvent, Rating, AIProposal } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ---------- Token management ----------

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function loginWithGoogle() {
  window.location.href = `${API_URL}/auth/google`;
}

// ---------- Fetch wrapper ----------

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let resp = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (resp.status === 401) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const r = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (r.ok) {
        const { access_token } = await r.json();
        localStorage.setItem("access_token", access_token);
        headers["Authorization"] = `Bearer ${access_token}`;
        resp = await fetch(`${API_URL}${path}`, { ...options, headers });
      } else {
        logout();
        window.dispatchEvent(new Event("planpal:session-expired"));
      }
    }
  }

  return resp;
}

// ---------- Data mapping ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvent(raw: any): ScheduleEvent {
  let participants = [];
  if (raw.participants) {
    try {
      participants = typeof raw.participants === "string"
        ? JSON.parse(raw.participants)
        : raw.participants;
    } catch {
      participants = [];
    }
  }
  return {
    id: raw.id,
    title: raw.title || "(タイトルなし)",
    startAt: new Date(raw.start_at),
    endAt: new Date(raw.end_at),
    isAllDay: !!raw.is_all_day,
    location: raw.location || undefined,
    description: raw.description || undefined,
    category: raw.category || undefined,
    participants: (participants || []).map((p: { name?: string; email?: string }, i: number) => ({
      id: p.email || String(i),
      name: p.name || p.email || "参加者",
    })),
    rating: (raw.rating as Rating) ?? null,
    comment: raw.comment || undefined,
    color: raw.color || undefined,
    calendarId: "google-primary",
  };
}

// ---------- API calls ----------

export async function fetchEvents(): Promise<ScheduleEvent[]> {
  const resp = await apiFetch("/api/events");
  if (!resp.ok) return [];
  const data = await resp.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map(mapEvent);
}

export async function createEvent(event: {
  title: string;
  start_at: string;
  end_at: string;
  location?: string;
  description?: string;
  category?: string;
  color?: string;
  is_all_day?: boolean;
}): Promise<ScheduleEvent> {
  const resp = await apiFetch("/api/events", {
    method: "POST",
    body: JSON.stringify(event),
  });
  if (!resp.ok) throw new Error("イベントの作成に失敗しました");
  return mapEvent(await resp.json());
}

export async function updateEvent(id: string, updates: {
  title?: string;
  start_at?: string;
  end_at?: string;
  location?: string;
  description?: string;
  category?: string;
  color?: string;
}): Promise<ScheduleEvent> {
  const resp = await apiFetch(`/api/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  if (!resp.ok) throw new Error("イベントの更新に失敗しました");
  return mapEvent(await resp.json());
}

export async function deleteEvent(id: string): Promise<void> {
  const resp = await apiFetch(`/api/events/${id}`, { method: "DELETE" });
  if (!resp.ok) throw new Error("イベントの削除に失敗しました");
}

export async function submitFeedback(
  eventId: string,
  rating: Rating,
  comment: string
): Promise<void> {
  await apiFetch(`/api/events/${eventId}/feedback`, {
    method: "POST",
    body: JSON.stringify({ rating, comment }),
  });
}

export async function fetchMagicBarProposals(query: string): Promise<{ proposals: AIProposal[]; direct: boolean }> {
  const resp = await apiFetch("/api/magic-bar", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
  if (!resp.ok) throw new Error("AI提案の取得に失敗しました");
  const data = await resp.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proposals: AIProposal[] = (data.proposals || []).map((p: any) => ({
    id: `ai-${Math.random()}`,
    title: p.title,
    startAt: new Date(p.start_at),
    endAt: new Date(p.end_at),
    location: p.location || undefined,
    reasoning: p.reasoning,
  }));
  return { proposals, direct: !!data.direct };
}
