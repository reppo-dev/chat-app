import axiosClient from "./index";
import { ApiResponse, User } from "../types";

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseData {
  access_token: string;
  user?: User;
}

const authApi = {
  register(data: RegisterDto) {
    return axiosClient.post<ApiResponse<AuthResponseData>>(
      "/api/auth/register-email",
      data
    );
  },

  login(data: LoginDto) {
    return axiosClient.post<ApiResponse<AuthResponseData>>(
      "/api/auth/login-email",
      data
    );
  },

  logout() {
    return axiosClient.post<ApiResponse<null>>("/api/auth/logout");
  },

  refreshSession() {
    return axiosClient.post<ApiResponse<{ access_token: string }>>(
      "/api/auth/refresh-session"
    );
  },

  getCurrentUser() {
    return axiosClient.post<ApiResponse<{ user: User }>>(
      "/api/auth/current-user"
    );
  },
};

export default authApi;
