/**
 * Zustand auth store — manages authentication state across the app.
 */

import { create } from "zustand";
import { authApi, type TokenResponse } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  has_completed_onboarding: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setFromTokenResponse: (data: TokenResponse) => void;
  clearError: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(email, password);
      set({
        user: data.user,
        token: data.access_token,
        refreshToken: data.refresh_token,
        isLoading: false,
      });
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("moodmeld_token", data.access_token);
        localStorage.setItem("moodmeld_refresh", data.refresh_token);
        localStorage.setItem("moodmeld_user", JSON.stringify(data.user));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.register(name, email, password);
      set({
        user: data.user,
        token: data.access_token,
        refreshToken: data.refresh_token,
        isLoading: false,
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("moodmeld_token", data.access_token);
        localStorage.setItem("moodmeld_refresh", data.refresh_token);
        localStorage.setItem("moodmeld_user", JSON.stringify(data.user));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: () => {
    set({ user: null, token: null, refreshToken: null });
    if (typeof window !== "undefined") {
      localStorage.removeItem("moodmeld_token");
      localStorage.removeItem("moodmeld_refresh");
      localStorage.removeItem("moodmeld_user");
    }
  },

  setFromTokenResponse: (data) => {
    set({
      user: data.user,
      token: data.access_token,
      refreshToken: data.refresh_token,
    });
  },

  clearError: () => set({ error: null }),

  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("moodmeld_token");
    const refresh = localStorage.getItem("moodmeld_refresh");
    const userStr = localStorage.getItem("moodmeld_user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, refreshToken: refresh });
      } catch {
        // Invalid stored data
      }
    }
  },
}));
