import { http } from "./http";


export const notificationsApi = {
  my: () => http.get("/notifications/me"),
  markRead: (id) => http.patch(`/notifications/${id}/read`),
};
