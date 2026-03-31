import { create } from "zustand";
import * as authService from "@/services/auth";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("audo_auth_token"),
  refreshToken: localStorage.getItem("audo_refresh_token"),
  isAuthenticated: false,
  isLoading: !!localStorage.getItem("audo_auth_token"),

  login: async (email: string, password: string) => {
    const data = await authService.login(email, password);
    localStorage.setItem("audo_auth_token", data.token);
    localStorage.setItem("audo_refresh_token", data.refreshToken);
    set({
      user: data.user,
      token: data.token,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
    });
  },

  signup: async (email: string, password: string) => {
    const data = await authService.signup(email, password);
    localStorage.setItem("audo_auth_token", data.token);
    localStorage.setItem("audo_refresh_token", data.refreshToken);
    set({
      user: data.user,
      token: data.token,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem("audo_auth_token");
    localStorage.removeItem("audo_refresh_token");
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("audo_auth_token");
    const refreshToken = localStorage.getItem("audo_refresh_token");

    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const data = await authService.fetchCurrentUser(token);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      if (!refreshToken) {
        localStorage.removeItem("audo_auth_token");
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }

      try {
        const refreshData = await authService.refreshAccessToken(refreshToken);
        localStorage.setItem("audo_auth_token", refreshData.token);

        const userData = await authService.fetchCurrentUser(refreshData.token);
        set({
          user: userData.user,
          token: refreshData.token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem("audo_auth_token");
        localStorage.removeItem("audo_refresh_token");
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    }
  },
}));

export function clearAuthState(): void {
  useAuthStore.getState().logout();
}

export default useAuthStore;
