import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname || "localhost";
    return `http://${host}:9090`;
  }
  return "http://localhost:9090";
};

const axiosClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;

interface FailedQueueItem {
  resolve: (token: string | null) => void;
  reject: (reason: unknown) => void;
}

let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const getStoredToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("chat_access_token");
  }
  return null;
};

export const setStoredToken = (token: string | null): void => {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("chat_access_token", token);
    } else {
      localStorage.removeItem("chat_access_token");
    }
  }
};

// Request interceptor
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiBaseUrl();
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

interface RetryableAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as
      | RetryableAxiosRequestConfig
      | undefined;

    // Do not retry refresh-session or login/register requests
    if (
      originalRequest &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/refresh-session") &&
      !originalRequest.url?.includes("/api/auth/login-email") &&
      !originalRequest.url?.includes("/api/auth/register-email")
    ) {
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosClient(originalRequest);
          })
          .catch((err: unknown) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post<{
          data?: { access_token?: string };
        }>(
          `${getApiBaseUrl()}/api/auth/refresh-session`,
          {},
          { withCredentials: true },
        );

        const newAccessToken = refreshResponse.data?.data?.access_token;
        if (newAccessToken) {
          setStoredToken(newAccessToken);
          axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          processQueue(null, newAccessToken);
          return axiosClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setStoredToken(null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:logout"));
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
