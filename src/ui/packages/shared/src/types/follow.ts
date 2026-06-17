import type { UserProfileDto } from "./users";
import type { PaginationDto } from "./common";

export interface FollowingUser {
  id: string;
  role: string;
  profile: UserProfileDto | null;
}

export interface FollowUserResponse {
  id: string;
  followingUser: FollowingUser;
  createdAt: string;
}

export interface FollowListEntry {
  id: string;
  user: {
    id: string;
    role: string;
    profile: UserProfileDto | null;
  };
  followedAt: string;
}

export interface GetFollowListResult {
  items: FollowListEntry[];
  pagination: PaginationDto;
}

export interface GetFollowStatusResult {
  isFollowing: boolean;
  followId?: string | null;
}

export interface GetFollowStatsResult {
  followersCount: number;
  followingCount: number;
}

export interface UnfollowUserResponse {
  message: string;
}

export interface FollowListParams {
  page?: number;
  limit?: number;
}
