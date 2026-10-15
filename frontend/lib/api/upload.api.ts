import axiosClient, { getApiBaseUrl } from "./index";
import { ApiResponse } from "../types";

export interface UploadFileResult {
  url: string;
  filename: string;
  original_name: string;
  size: number;
  extension: string;
}

export const uploadApi = {
  uploadFile: async (
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<ApiResponse<UploadFileResult>> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axiosClient.post<ApiResponse<UploadFileResult>>(
      "/api/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percent);
          }
        },
      }
    );
    return res.data;
  },

  uploadMultipleFiles: async (
    files: File[]
  ): Promise<ApiResponse<{ files: UploadFileResult[] }>> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await axiosClient.post<
      ApiResponse<{ files: UploadFileResult[] }>
    >("/api/upload/multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  getFullMediaUrl: (path: string): string => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const base = getApiBaseUrl();
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  },
};

export default uploadApi;
