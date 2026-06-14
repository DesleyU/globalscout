import {
  connectionsPaths,
  type ApiTransport,
  type GetConnectionRequestsParams,
  type GetConnectionsParams,
  type GetConnectionsResult,
  type GetPendingConnectionRequestsResult,
  type RespondToConnectionRequest,
  type RespondToConnectionResponse,
  type SendConnectionRequest,
  type SendConnectionResponse,
} from "@globalscout/shared";

function toQueryString(
  params: GetConnectionsParams | GetConnectionRequestsParams,
): string {
  const search = new URLSearchParams();
  if ("status" in params && params.status) search.set("status", params.status);
  if ("type" in params && params.type) search.set("type", params.type);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function createConnectionsApi(client: ApiTransport) {
  return {
    getConnections(params: GetConnectionsParams = {}) {
      return client.get<GetConnectionsResult>(
        `${connectionsPaths.list}${toQueryString(params)}`,
      );
    },

    sendRequest(body: SendConnectionRequest) {
      return client.post<SendConnectionResponse>(connectionsPaths.send, body);
    },

    respondToRequest(connectionId: string, body: RespondToConnectionRequest) {
      return client.put<RespondToConnectionResponse>(
        connectionsPaths.respond(connectionId),
        body,
      );
    },

    getPendingRequests(params: GetConnectionRequestsParams = {}) {
      return client.get<GetPendingConnectionRequestsResult>(
        `${connectionsPaths.requests}${toQueryString(params)}`,
      );
    },
  };
}

export type ConnectionsApi = ReturnType<typeof createConnectionsApi>;
