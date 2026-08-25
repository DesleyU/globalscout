/** API-Football player bio, stored under `data.profile` for `api-football` rows. */
export interface ApiFootballPlayerProfile {
  id?: number;
  name?: string;
  firstname?: string;
  lastname?: string;
  age?: number;
  birth?: {
    date?: string | null;
    place?: string | null;
    country?: string | null;
  };
  nationality?: string;
  height?: string | null;
  weight?: string | null;
  injured?: boolean;
  photo?: string | null;
}

/** One entry of the API-Football `statistics[]` array (per team/competition). */
export interface ApiFootballCompetitionStats {
  team?: { id?: number; name?: string; logo?: string | null; catalogId?: string };
  competition?: {
    id?: number;
    name?: string;
    country?: string;
    logo?: string | null;
    flag?: string | null;
    season?: number;
    catalogId?: string;
  };
  /** @deprecated Legacy manual stats key; prefer `competition`. */
  league?: {
    id?: number;
    name?: string;
    country?: string;
    logo?: string | null;
    flag?: string | null;
    season?: number;
    catalogId?: string;
  };
  games?: {
    appearences?: number | null;
    lineups?: number | null;
    minutes?: number | null;
    position?: string | null;
    rating?: string | null;
    captain?: boolean;
  };
  goals?: {
    total?: number | null;
    conceded?: number | null;
    assists?: number | null;
    saves?: number | null;
  };
  cards?: { yellow?: number | null; red?: number | null };
  [key: string]: unknown;
}

/** Canonical aggregated season metrics computed by the backend. */
export interface AggregatedSeasonMetrics {
  goals?: number;
  assists?: number;
  appearances?: number;
  minutes?: number;
  yellowCards?: number;
  redCards?: number;
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

/** Raw JSON payload persisted in `player_statistics.data` for API-Football rows. */
export interface PlayerSeasonStatsData {
  seasonYear?: number;
  provider?: string;
  profile?: ApiFootballPlayerProfile | null;
  aggregated?: AggregatedSeasonMetrics;
  competitions?: ApiFootballCompetitionStats[];
  [key: string]: unknown;
}

/** A single season row returned by the stats API (flat metrics + raw `data`). */
export interface PlayerSeasonStatsRow {
  id?: string;
  season: string;
  source: string;
  schemaVersion?: string;
  updatedAt?: string | null;
  goals?: number;
  assists?: number;
  minutes?: number;
  matches?: number;
  appearances?: number;
  yellowCards?: number;
  redCards?: number;
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
  data?: PlayerSeasonStatsData | null;
}

export interface PlayerStatisticsResponse {
  success: boolean;
  data: PlayerSeasonStatsRow[];
  accountType: string;
  availableFields: unknown;
  totalSeasons: number;
  message?: string | null;
  hasLinkedProvider?: boolean;
}

/** One competition row in a manual season upsert. */
export interface ManualCompetitionEntry {
  teamCatalogId: string;
  competitionCatalogId: string;
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  rating?: number | null;
}

export interface UpsertMyStatsRequest {
  season: string;
  competitions: ManualCompetitionEntry[];
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
  success?: boolean;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
}

export interface StatisticsUpdateStatus {
  success?: boolean;
  status?: {
    isUpdating?: boolean;
    lastUpdate?: string | null;
    queueSize?: number;
    usersInQueue?: string[];
  };
  [key: string]: unknown;
}
