import { create } from "zustand";

export const useAuthStore = create((set) => {
  const saved = localStorage.getItem("auth");
  const initial = saved ? JSON.parse(saved) : { user: null, token: null };

  return {
    user: initial.user,
    token: initial.token,
    isAuthenticated: !!initial.token,

    setAuth: ({ user, token }) => {
      localStorage.setItem("auth", JSON.stringify({ user, token }));
      set({ user, token, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem("auth");
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});
