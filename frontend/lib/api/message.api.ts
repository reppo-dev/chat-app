import axiosClient from "./index";
import { ApiResponse, Message } from "../types";

export interface SendMessageDto {
  text?: string;
  media_files?: string[];
}

const messageApi = {
  getConversationMessages(conversationId: number, limit = 50) {
    return axiosClient.get<ApiResponse<{ messages: Message[] }>>(
      `/api/conversations/${conversationId}/messages`,
      {
        params: { limit },
      }
    );
  },

  sendMessage(conversationId: number, data: SendMessageDto) {
    return axiosClient.post<ApiResponse<{ message: Message }>>(
      `/api/conversations/${conversationId}/messages`,
      data
    );
  },

  getMessageByID(messageId: number) {
    return axiosClient.get<ApiResponse<{ message: Message }>>(
      `/api/messages/${messageId}`
    );
  },

  updateMessage(messageId: number, text: string) {
    return axiosClient.put<ApiResponse<{ message: Message }>>(
      `/api/messages/${messageId}`,
      { text }
    );
  },

  deleteMessage(messageId: number) {
    return axiosClient.delete<ApiResponse<null>>(`/api/messages/${messageId}`);
  },

  markMessageSeen(messageId: number) {
    return axiosClient.post<ApiResponse<null>>(
      `/api/messages/${messageId}/seen`
    );
  },
};

export default messageApi;
