import axiosClient from "./index";
import { ApiResponse, Conversation, ConversationType, User } from "../types";

export interface CreateConversationDto {
  conversation_type: ConversationType;
  member_ids: number[];
  group_name?: string;
}

const conversationApi = {
  getUserConversations() {
    return axiosClient.get<ApiResponse<{ conversations: Conversation[] }>>(
      "/api/conversations"
    );
  },

  getConversationByID(conversationId: number) {
    return axiosClient.get<ApiResponse<{ conversation: Conversation }>>(
      `/api/conversations/${conversationId}`
    );
  },

  createConversation(data: CreateConversationDto) {
    return axiosClient.post<ApiResponse<{ conversation: Conversation }>>(
      "/api/conversations",
      data
    );
  },

  getConversationMembers(conversationId: number) {
    return axiosClient.get<ApiResponse<{ members: User[] }>>(
      `/api/conversations/${conversationId}/members`
    );
  },

  addMember(conversationId: number, userId: number) {
    return axiosClient.post<ApiResponse<null>>(
      `/api/conversations/${conversationId}/members`,
      { user_id: userId }
    );
  },

  removeMember(conversationId: number, memberId: number) {
    return axiosClient.delete<ApiResponse<null>>(
      `/api/conversations/${conversationId}/members/${memberId}`
    );
  },
};

export default conversationApi;
