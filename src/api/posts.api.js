import { http } from "./http";

export const postsApi = {
  listMine: () => http.get("/posts/me"),                 // ✅ listmine endpointin
  listByUser: (userId) => http.get(`/posts/users/${userId}`), // ✅ yeni endpoint

  list: (params) => http.get("/posts/list", { params }),          // GET /api/v1/posts
  detail: (id) => http.get(`/posts/${id}`),                 // GET /api/v1/posts/:id
  create: (payload) => http.post("/posts", payload),        // POST /api/v1/posts
  like: (id) => http.post(`/posts/${id}/like`),             // POST /api/v1/posts/:id/like
  comment: (id, payload) => http.post(`/posts/${id}/comments`, payload), // POST /api/v1/posts/:id/comments
  createWithFile: (formData) =>
  http.post("/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
};
