import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8087",   // ✅ image-service
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth");
  if (token) config.headers.Authorization = token.startsWith("Bearer") ? token : `Bearer ${token}`;
  return config;
});

export const imageApi = {
  upload: (file) => {
    const form = new FormData();
    form.append("file", file);

    return api.post("/api/v1/images", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
