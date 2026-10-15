import axiosClient from "./index";
import { ApiResponse, Post, PostPrivacy } from "../types";

export interface CreatePostDto {
  content: string;
  background_color?: string;
  media_files?: string[] | null;
  privacy?: PostPrivacy;
}

export interface UpdatePostDto {
  content?: string;
  background_color?: string;
  privacy?: PostPrivacy;
}

const postApi = {
  getFeed(limit = 10, offset = 0) {
    return axiosClient.get<ApiResponse<{ posts: Post[] }>>("/api/posts/feed", {
      params: { limit, offset },
    });
  },

  getUserPosts(userId: number, limit = 20) {
    return axiosClient.get<ApiResponse<{ posts: Post[] }>>(
      `/api/posts/user/${userId}`,
      {
        params: { limit },
      }
    );
  },

  getPost(postId: number) {
    return axiosClient.get<ApiResponse<{ post: Post }>>(`/api/posts/${postId}`);
  },

  createPost(data: CreatePostDto) {
    return axiosClient.post<ApiResponse<{ post: Post }>>("/api/posts", data);
  },

  updatePost(postId: number, data: UpdatePostDto) {
    return axiosClient.put<ApiResponse<{ post: Post }>>(
      `/api/posts/${postId}`,
      data
    );
  },

  deletePost(postId: number) {
    return axiosClient.delete<ApiResponse<null>>(`/api/posts/${postId}`);
  },
};

export default postApi;
