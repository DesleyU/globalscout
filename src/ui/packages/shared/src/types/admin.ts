import type { PaginationDto } from "./common";
import type { AdminPendingClaimItem } from "./player-identity";
import type { UserProfileDto } from "./users";
export interface AdminUserListItem {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  profile: UserProfileDto | null;
  connectionCount: number;
}

export interface AdminUsersListResult {
  users: AdminUserListItem[];
  pagination: PaginationDto;
}

export interface ListAdminUsersParams {
  status?: string;
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdateAdminUserStatusRequest {
  status: string;
}

export interface AdminUserStatusSummary {
  id: string;
  email: string;
  role: string;
  status: string;
  profile: UserProfileDto | null;
}

export interface DeleteAdminUserResponse {
  message: string;
}

export interface AdminUserStatsByRole {
  players: number;
  clubs: number;
  scouts: number;
}

export interface AdminUserStats {
  total: number;
  active: number;
  blocked: number;
  byRole: AdminUserStatsByRole;
}

export interface AdminConnectionStats {
  total: number;
  accepted: number;
  pending: number;
}

export interface AdminSystemStats {
  users: AdminUserStats;
  connections: AdminConnectionStats;
}

export interface AdminSystemStatsResult {
  stats: AdminSystemStats;
}

export interface AdminPlayerClaimNoteRequest {
  note?: string | null;
}

export interface AdminPlayerClaimRequiredNoteRequest {
  note: string;
}

export interface ListAdminPlayerClaimsParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminPlayerClaimsListResult {
  claims: AdminPendingClaimItem[];
  pagination: PaginationDto;
}
