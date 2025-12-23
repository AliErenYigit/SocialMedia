import { http } from "./http";

export const authApi = {
  login: (payload) => http.post("/auth/login", payload),
  register: (payload) => http.post("/auth/register", payload),
  me: () => http.get("/auth/me"),
};
