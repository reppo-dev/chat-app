import axiosClient from "./index";
import { ApiResponse, Notification } from "../types";

const notificationApi = {
  getNotifications(limit = 50) {
    return axiosClient.get<ApiResponse<{ notifications: Notification[] }>>(
      "/api/notifications",
      {
        params: { limit },
      }
    );
  },

  markRead(notificationId: number) {
    return axiosClient.put<ApiResponse<null>>(
      `/api/notifications/${notificationId}/read`
    );
  },

  markAllRead() {
    return axiosClient.put<ApiResponse<null>>("/api/notifications/read-all");
  },
};

export default notificationApi;
