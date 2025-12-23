import axios from "axios";

export const API_BASE_URL = "/api/v1";


export const http = axios.create({
  baseURL: API_BASE_URL,
});

// request interceptor: token ekle
http.interceptors.request.use((config) => {
  const raw = localStorage.getItem("auth");
  const auth = raw ? JSON.parse(raw) : null;
  const token = auth?.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// response interceptor: 401 olursa logout (opsiyonel)
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("auth");
      // yönlendirme router tarafında da yapılacak
    }
    return Promise.reject(err);
  }
);
