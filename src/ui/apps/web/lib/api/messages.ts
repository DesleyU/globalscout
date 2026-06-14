import {
  messagesPaths,
  type ApiTransport,
  type GetConversationParams,
  type GetConversationResult,
  type GetConversationsResult,
  type MarkMessagesReadResponse,
  type SendMessageRequest,
  type SendMessageResponse,
} from "@globalscout/shared";

function toQueryString(params: GetConversationParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function createMessagesApi(client: ApiTransport) {
  return {
    sendMessage(body: SendMessageRequest) {
      return client.post<SendMessageResponse>(messagesPaths.send, body);
    },

    getConversations() {
      return client.get<GetConversationsResult>(messagesPaths.conversations);
    },

    getConversation(otherUserId: string, params: GetConversationParams = {}) {
      return client.get<GetConversationResult>(
        `${messagesPaths.conversation(otherUserId)}${toQueryString(params)}`,
      );
    },

    markAsRead(otherUserId: string) {
      return client.put<MarkMessagesReadResponse>(
        messagesPaths.read(otherUserId),
      );
    },
  };
}

export type MessagesApi = ReturnType<typeof createMessagesApi>;
