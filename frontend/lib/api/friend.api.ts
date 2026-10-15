import axiosClient from "./index";
import { ApiResponse, FriendRequest, User } from "../types";

const friendApi = {
  getFriends(userId?: number) {
    return axiosClient.get<ApiResponse<{ friends: User[] }>>("/api/friends", {
      params: userId ? { user_id: userId } : {},
    });
  },

  removeFriend(friendId: number) {
    return axiosClient.delete<ApiResponse<null>>(`/api/friends/${friendId}`);
  },

  sendFriendRequest(receiverId: number) {
    return axiosClient.post<ApiResponse<{ friend_request: FriendRequest }>>(
      `/api/friends/requests/send/${receiverId}`
    );
  },

  getReceivedRequests() {
    return axiosClient.get<ApiResponse<{ friend_requests: FriendRequest[] }>>(
      "/api/friends/requests/received"
    );
  },

  getSentRequests() {
    return axiosClient.get<ApiResponse<{ friend_requests: FriendRequest[] }>>(
      "/api/friends/requests/sent"
    );
  },

  acceptRequest(requestId: number) {
    return axiosClient.post<ApiResponse<{ friend_request: FriendRequest }>>(
      `/api/friends/requests/${requestId}/accept`
    );
  },

  rejectRequest(requestId: number) {
    return axiosClient.post<ApiResponse<{ friend_request: FriendRequest }>>(
      `/api/friends/requests/${requestId}/reject`
    );
  },

  cancelRequest(requestId: number) {
    return axiosClient.delete<ApiResponse<null>>(
      `/api/friends/requests/${requestId}`
    );
  },
};

export default friendApi;
