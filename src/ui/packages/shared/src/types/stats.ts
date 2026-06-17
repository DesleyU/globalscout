export interface PlayerStatisticsResponse {
  success: boolean;
  data: unknown[];
  accountType: string;
  availableFields: unknown;
  totalSeasons: number;
  message?: string | null;
}

export interface UpsertMyStatsRequest {
  season: string;
  goals?: number | null;
  assists?: number | null;
  matches?: number | null;
  minutes?: number | null;
  yellowCards?: number | null;
  redCards?: number | null;
  rating?: number | null;
  shotsTotal?: number | null;
  shotsOnTarget?: number | null;
  passesTotal?: number | null;
  passesAccuracy?: number | null;
  tacklesTotal?: number | null;
  tacklesInterceptions?: number | null;
  duelsWon?: number | null;
  foulsCommitted?: number | null;
  foulsDrawn?: number | null;
}

export interface UpsertMyStatsResponse {
  message: string;
  stats: unknown;
  tier: string;
}

export interface RefreshMyStatsResponse {
  message?: string;
  [key: string]: unknown;
}

export interface StatisticsUpdateStatus {
  [key: string]: unknown;
}
