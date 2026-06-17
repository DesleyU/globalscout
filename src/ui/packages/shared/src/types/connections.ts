import type { UserProfileDto } from "./users";
import type { PaginationDto } from "./common";

export interface ConnectionUserSummary {
  id: string;
  role: string;
  profile: UserProfileDto | null;
}

export interface SendConnectionRequest {
  receiverId: string;
  message?: string | null;
}

export interface SendConnectionResponse {
  message: string;
  connection: {
    id: string;
    status: string;
    message?: string | null;
    createdAt: string;
    sender: ConnectionUserSummary;
    receiver: ConnectionUserSummary;
  };
}

export interface RespondToConnectionRequest {
  action: "accept" | "reject";
}

export interface RespondToConnectionResponse {
  message: string;
  connection: {
    id: string;
    status: string;
    message?: string | null;
    createdAt: string;
    updatedAt: string;
    sender: ConnectionUserSummary;
    receiver: ConnectionUserSummary;
  };
}

export interface ConnectionListItem {
  id: string;
  status: string;
  message?: string | null;
  createdAt: string;
  updatedAt: string;
  user: ConnectionUserSummary;
}

export interface ConnectionRequestRow {
  id: string;
  status: string;
  message?: string | null;
  createdAt: string;
  sender: ConnectionUserSummary;
  receiver: ConnectionUserSummary;
}

export interface GetConnectionsResult {
  connections: ConnectionListItem[];
  pagination: PaginationDto;
}

export interface GetPendingConnectionRequestsResult {
  requests: ConnectionRequestRow[];
  pagination: PaginationDto;
}

export interface GetConnectionsParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface GetConnectionRequestsParams {
  type?: string;
  page?: number;
  limit?: number;
}
