export type UserRole = "user" | "admin";

export type PostPrivacy = "public" | "friends" | "private";

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

export type ConversationType = "direct" | "group" | "channel";

export type FriendRequestStatus = "pending" | "accept" | "reject";

export type NotificationType = "friend_request" | "reaction" | "comment";

/**
 * Go backend database/sql serialization types
 */
export interface SqlNullString {
  String: string;
  Valid: boolean;
}

export interface SqlNullRawMessage {
  RawMessage: string | null;
  Valid: boolean;
}

export interface SqlNullTime {
  Time: string;
  Valid: boolean;
}

export type NullableStringValue = string | SqlNullString | null | undefined;
export type NullableMediaValue = string | SqlNullRawMessage | null | undefined;
export type NullableDateValue = string | SqlNullTime | null | undefined;

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  bio?: NullableStringValue;
  avatar?: NullableMediaValue;
  cover_photo?: NullableMediaValue;
  birthdate?: NullableDateValue;
  phone_number?: NullableStringValue;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  author_id: number;
  background_color: string;
  content: string;
  media_files?: string[] | null;
  like_count: number;
  wow_count: number;
  love_count: number;
  angry_count: number;
  haha_count: number;
  sad_count: number;
  privacy: PostPrivacy;
  created_at: string;
  updated_at: string;
  author?: User;
}

export interface Comment {
  id: number;
  post_id: number;
  parent_id?: number | null;
  user_id: number;
  reply_to_user_id?: number | null;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
  reply_to_user?: User;
}

export interface Reaction {
  id: number;
  user_id: number;
  post_id: number;
  type: ReactionType;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  is_group: boolean;
  group_owner_id?: number | null;
  group_name?: NullableStringValue;
  group_avatar?: NullableMediaValue;
  last_message_id?: number | null;
  last_message_at?: NullableDateValue;
  created_at: string;
  updated_at: string;
  conversation_type: ConversationType;
  members?: User[];
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  text?: NullableStringValue;
  media_files?: string[] | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender?: User;
}

export interface FriendRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  status: FriendRequestStatus;
  created_at: string;
  updated_at: string;
  sender?: User;
  receiver?: User;
}

export interface Notification {
  id: number;
  sender_id: number;
  receiver_id: number;
  type: NotificationType;
  content: string;
  is_read: boolean;
  link_to_id?: number | null;
  created_at: string;
  updated_at: string;
  sender?: User;
}

export interface ApiResponse<T = unknown> {
  status: number;
  success: boolean;
  message: string;
  data: T;
}

export type RealtimeEventType =
  | "current_users"
  | "online"
  | "offline"
  | "new_private"
  | "message"
  | "message_updated"
  | "message_deleted"
  | "delivered"
  | "read"
  | "typing"
  | "error"
  | "heartbeat"
  | "shutdown"
  | "notification"
  | "friend_request"
  | "friendship_created"
  | "comment"
  | "reaction";

export interface CurrentUsersPayload {
  online_user_ids: number[];
}

export interface OnlineOfflinePayload {
  id: number;
  name: string;
  email: string;
}

export interface MessagePayload {
  message: Message;
}

export interface TypingPayload {
  conversation_id: number;
  user_id: number;
  user_name: string;
  is_typing: boolean;
}

export interface ReactionPayload {
  post_id: number;
  user_id: number;
  type: ReactionType;
}

export interface CommentPayload {
  post_id: number;
  comment_id: number;
}

export interface RealtimeEvent<T = unknown> {
  event_type: RealtimeEventType;
  payload: T;
}
