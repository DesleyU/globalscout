export interface SendMessageRequest {
  receiverId: string;
  content: string;
}

export interface MessageParticipantProfile {
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

export interface MessageParticipant {
  id: string;
  email: string;
  profile: MessageParticipantProfile | null;
}

export interface MessageDetail {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender: MessageParticipant;
  receiver: MessageParticipant;
}

export interface SendMessageResponse {
  message: string;
  data: MessageDetail;
}

export interface MessageSenderPreview {
  id: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string | null;
  } | null;
}

export interface MessageThreadItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender: MessageSenderPreview | null;
}

export interface ConversationLastMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
}

export interface ConversationPartnerProfile {
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
}

export interface ConversationPartner {
  id: string;
  email: string;
  profile: ConversationPartnerProfile | null;
}

export interface ConversationListItem {
  id: string;
  lastMessage: ConversationLastMessage;
  otherUser: ConversationPartner;
  unreadCount: number;
}

export interface GetConversationsResult {
  conversations: ConversationListItem[];
}

export interface GetConversationResult {
  messages: MessageThreadItem[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface GetConversationParams {
  page?: number;
  limit?: number;
}

export interface MarkMessagesReadResponse {
  message: string;
}
