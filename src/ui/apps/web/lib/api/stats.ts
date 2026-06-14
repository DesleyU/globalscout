import {
  statsPaths,
  type ApiTransport,
  type PlayerStatisticsResponse,
  type RefreshMyStatsResponse,
  type StatisticsUpdateStatus,
  type UpsertMyStatsRequest,
  type UpsertMyStatsResponse,
} from "@globalscout/shared";

export function createStatsApi(client: ApiTransport) {
  return {
    getMyStats() {
      return client.get<PlayerStatisticsResponse>(statsPaths.me);
    },

    updateMyStats(body: UpsertMyStatsRequest) {
      return client.put<UpsertMyStatsResponse>(statsPaths.me, body);
    },

    getUserStats(userId: string) {
      return client.get<PlayerStatisticsResponse>(statsPaths.user(userId));
    },

    refresh() {
      return client.post<RefreshMyStatsResponse>(statsPaths.refresh);
    },

    refreshAll() {
      return client.post<RefreshMyStatsResponse>(statsPaths.refreshAll);
    },

    getUpdateStatus() {
      return client.get<StatisticsUpdateStatus>(statsPaths.updateStatus);
    },
  };
}

export type StatsApi = ReturnType<typeof createStatsApi>;
