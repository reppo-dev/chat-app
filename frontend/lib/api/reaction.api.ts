import axiosClient from "./index";
import { ApiResponse, Reaction, ReactionType } from "../types";

const reactionApi = {
  getReaction(postId: number) {
    return axiosClient.get<ApiResponse<{ reaction: Reaction | null }>>(
      `/api/posts/${postId}/reactions`
    );
  },

  createOrUpdateReaction(postId: number, type: ReactionType) {
    return axiosClient.post<ApiResponse<{ reaction: Reaction | null }>>(
      `/api/posts/${postId}/reactions`,
      { type }
    );
  },

  deleteReaction(postId: number) {
    return axiosClient.delete<ApiResponse<null>>(
      `/api/posts/${postId}/reactions`
    );
  },
};

export default reactionApi;
