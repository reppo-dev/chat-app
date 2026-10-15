import axiosClient from "./index";
import { ApiResponse, Comment } from "../types";

export interface CreateCommentDto {
  content: string;
  parent_id?: number | null;
  reply_to_user_id?: number | null;
}

export interface UpdateCommentDto {
  content: string;
}

const commentApi = {
  getPostComments(postId: number) {
    return axiosClient.get<ApiResponse<{ comments: Comment[] }>>(
      `/api/posts/${postId}/comments`
    );
  },

  createComment(postId: number, data: CreateCommentDto) {
    return axiosClient.post<ApiResponse<{ comment: Comment }>>(
      `/api/posts/${postId}/comments`,
      data
    );
  },

  updateComment(commentId: number, data: UpdateCommentDto) {
    return axiosClient.put<ApiResponse<{ comment: Comment }>>(
      `/api/comments/${commentId}`,
      data
    );
  },

  deleteComment(commentId: number) {
    return axiosClient.delete<ApiResponse<null>>(`/api/comments/${commentId}`);
  },
};

export default commentApi;
