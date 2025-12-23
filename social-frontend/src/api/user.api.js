import { http } from "./http";

export const userApi = {
  profile: (userId) => http.get(`/auth/users/${userId}`), // GET /api/v1/users/:username
  me: () => http.get(`/users/me`),
  followers: (page = 1, limit = 20) =>
    http.get(`/users/me/following-ids`, {
      params: { page, limit },
    }),
  getProfileById: (userId) => http.get(`/users/${userId}/profile`),
  updateMe: (data) => http.patch(`/users/me`, data),
  postCount: (userId) => http.get(`/posts/users/${userId}/count`),
  followerCount: (userId) => http.get(`/users/${userId}/followers-count`),

  followingCount: (userId) => http.get(`/users/${userId}/following-count`),
 followById: (targetUserId) => http.post(`/users/${targetUserId}/follow`),
  unfollowById: (targetUserId) => http.delete(`/users/${targetUserId}/follow`),
};
