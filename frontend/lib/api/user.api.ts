import axiosClient from "./index";
import { ApiResponse, User } from "../types";

export interface UpdateProfileDto {
  name: string;
  bio?: string | null;
  birthdate?: string | null;
  phone_number?: string | null;
}

const userApi = {
  getProfile(userId: number) {
    return axiosClient.get<ApiResponse<{ user: User }>>(
      `/api/users/profile/${userId}`
    );
  },

  updateProfile(data: UpdateProfileDto) {
    return axiosClient.put<ApiResponse<{ user: User }>>(
      "/api/users/profile",
      data
    );
  },

  searchUsers(name: string, limit = 20) {
    return axiosClient.get<ApiResponse<{ users: User[] }>>("/api/users/search", {
      params: { name, limit },
    });
  },

  listUsers(limit = 20, offset = 0) {
    return axiosClient.get<ApiResponse<{ users: User[] }>>("/api/users", {
      params: { limit, offset },
    });
  },
};

export default userApi;
