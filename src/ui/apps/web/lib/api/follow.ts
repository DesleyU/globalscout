import {
  followPaths,
  type ApiTransport,
  type FollowListParams,
  type FollowUserResponse,
  type GetFollowListResult,
  type GetFollowStatsResult,
  type GetFollowStatusResult,
  type UnfollowUserResponse,
} from "@globalscout/shared";

function toQueryString(params: FollowListParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function createFollowApi(client: ApiTransport) {
  return {
    followUser(userId: string) {
      return client.post<FollowUserResponse>(followPaths.follow(userId));
    },

    unfollowUser(userId: string) {
      return client.delete<UnfollowUserResponse>(followPaths.unfollow(userId));
    },

    getFollowers(userId: string, params: FollowListParams = {}) {
      return client.get<GetFollowListResult>(
        `${followPaths.followers(userId)}${toQueryString(params)}`,
      );
    },

    getFollowing(userId: string, params: FollowListParams = {}) {
      return client.get<GetFollowListResult>(
        `${followPaths.following(userId)}${toQueryString(params)}`,
      );
    },

    getFollowStats(userId: string) {
      return client.get<GetFollowStatsResult>(followPaths.stats(userId));
    },

    getFollowStatus(userId: string) {
      return client.get<GetFollowStatusResult>(followPaths.status(userId));
    },
  };
}

export type FollowApi = ReturnType<typeof createFollowApi>;
