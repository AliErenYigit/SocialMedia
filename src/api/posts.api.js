import { http } from "./http";

export const postsApi = {
  list: (params) => http.get("/posts", { params }),          // GET /api/v1/posts
  detail: (id) => http.get(`/posts/${id}`),                 // GET /api/v1/posts/:id
  create: (payload) => http.post("/posts", payload),        // POST /api/v1/posts
  like: (id) => http.post(`/posts/${id}/like`),             // POST /api/v1/posts/:id/like
  comment: (id, payload) => http.post(`/posts/${id}/comments`, payload), // POST /api/v1/posts/:id/comments
  createWithFile: (formData) =>
  http.post("/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
};
