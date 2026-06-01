/**
 * MoodMeld API client — connects frontend to FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      data?.detail || `Request failed with status ${res.status}`,
      res.status,
      data
    );
  }

  return data as T;
}

// ── Auth API ──

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    name: string;
    email: string;
    created_at: string;
    has_completed_onboarding: boolean;
  };
}

export const authApi = {
  register: (name: string, email: string, password: string) =>
    request<TokenResponse>("/auth/register", {
      method: "POST",
      body: { name, email, password },
    }),

  login: (email: string, password: string) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  refresh: (refreshToken: string) =>
    request<TokenResponse>("/auth/refresh", {
      method: "POST",
      body: refreshToken,
    }),
};

// ── Profile API ──

export const profileApi = {
  getProfile: (token: string) =>
    request("/profile/", { token }),

  completeOnboarding: (token: string, data: Record<string, unknown>) =>
    request("/profile/onboarding", { method: "POST", body: data, token }),

  updateProfile: (token: string, data: Record<string, unknown>) =>
    request("/profile/", { method: "PUT", body: data, token }),
};

// ── Mood API ──

export const moodApi = {
  analyze: (token: string, text: string, behavioralScores?: Record<string, unknown>) =>
    request("/mood/analyze", {
      method: "POST",
      body: { text, behavioral_scores: behavioralScores },
      token,
    }),

  getHistory: (token: string, days = 7) =>
    request(`/mood/history?days=${days}`, { token }),

  getPredictions: (token: string) =>
    request("/mood/predictions", { token }),

  getAnalytics: (token: string, days = 30) =>
    request(`/mood/analytics?days=${days}`, { token }),

  downloadReport: async (token: string, days = 30) => {
    const res = await fetch(`${API_BASE}/mood/report?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Report generation failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MoodMeld_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ── Activities API ──

export const activitiesApi = {
  log: (token: string, type: string, value: number, date?: string, notes?: string) =>
    request("/activities/", {
      method: "POST",
      body: { type, value, date, notes },
      token,
    }),

  getAll: (token: string, days = 7, type?: string) =>
    request(`/activities/?days=${days}${type ? `&type=${type}` : ""}`, { token }),

  getToday: (token: string) =>
    request("/activities/today", { token }),
};

// ── Conversations API ──

export interface AIResponseData {
  message: string;
  detected_emotion: string;
  emotion_confidence: number;
  is_distress_detected: boolean;
  recommendations?: Record<string, unknown>[];
  auto_logged_activities?: { type: string; value: number; unit: string; snippet: string }[];
}

export const conversationsApi = {
  sendMessage: (token: string, content: string) =>
    request<AIResponseData>("/conversations/message", {
      method: "POST",
      body: { content },
      token,
    }),

  getAll: (token: string, limit = 10) =>
    request(`/conversations/?limit=${limit}`, { token }),

  getById: (token: string, id: string) =>
    request(`/conversations/${id}`, { token }),
};

// ── Feedback API ──

export const feedbackApi = {
  submit: (token: string, data: Record<string, unknown>) =>
    request("/feedback/", { method: "POST", body: data, token }),

  getStats: (token: string) =>
    request("/feedback/stats", { token }),
};

// ── Recommendations API ──

export const recommendationsApi = {
  getAll: (token: string) =>
    request("/recommendations/", { token }),
};
