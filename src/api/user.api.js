import { http } from "./http";

export const userApi = {
  profile: (userId) => http.get(`/auth/users/${userId}`), // GET /api/v1/users/:username
  me: () => http.get(`/users/me`),
  followers: ( page = 1, limit = 20) =>
    http.get(`/users/me/following-ids`, {
      params: { page, limit },
    }),

  postCount: (userId) => http.get(`/posts/users/${userId}/count`),
  followerCount: (userId) => http.get(`/users/${userId}/followers-count`),

  followingCount: (userId) => http.get(`/users/${userId}/following-count`),
  follow: (username) => http.post(`/users/${username}/follow`), // POST /api/v1/users/:username/follow
  unfollow: (username) => http.post(`/users/${username}/unfollow`), // POST /api/v1/users/:username/unfollow
};
