import type {
  ApiFootballCompetitionStats,
  PlayerSeasonStatsRow,
  PlayerStatisticsResponse,
} from "@globalscout/shared";
import type { ManualSeasonFormValues } from "@/lib/validation/stats";
import { mapManualSeasonRowToFormValues } from "@/features/statistics/map-manual-season-form-values";

export type StatisticsProfileExtras = {
  height: string | null;
  weight: string | null;
  birthDate: string | null;
  birthPlace: string | null;
};

export type StatisticsMetric = {
  label: string;
  value: string;
};

export type StatisticsCompetitionRow = {
  key: string;
  league: string;
  team: string;
  appearances: string;
  minutes: string;
  goals: string;
  assists: string;
  yellowCards: string;
  redCards: string;
  rating: string;
};

export type StatisticsSeasonView = {
  key: string;
  season: string;
  seasonLabel: string;
  source: string;
  sourceLabel: string;
  sourceBadgeVariant: "default" | "self-reported" | "verified" | "superseded";
  editable: boolean;
  superseded: boolean;
  editFormValues: ManualSeasonFormValues | null;
  metrics: StatisticsMetric[];
  competitions: StatisticsCompetitionRow[];
};

export type StatisticsCareerTotals = {
  goals: string;
  assists: string;
  appearances: string;
  minutes: string;
  yellowCards: string;
  redCards: string;
  rating: string;
  selfReportedSeasons: number;
  totalSeasons: number;
};

export type StatisticsViewModel = {
  profileExtras: StatisticsProfileExtras | null;
  seasons: StatisticsSeasonView[];
  career: StatisticsCareerTotals | null;
  lastUpdated: string | null;
  hasLinkedProvider: boolean;
};

function num(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "—";
}

function pct(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value)}%`
    : "—";
}

function ratingStr(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(2);
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : "—";
  }

  return "—";
}

function nonEmpty(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function formatSeasonLabel(season: string): string {
  if (/^\d{4}$/.test(season)) {
    const start = Number.parseInt(season, 10);
    const end = String(start + 1).slice(-2);
    return `${start}/${end}`;
  }
  return season;
}

function sourceLabelFor(source: string, superseded: boolean): string {
  if (superseded) return "Superseded";
  if (source === "api-football") return "API-Football";
  if (source === "manual") return "Self-reported";
  return source;
}

function sourceBadgeVariantFor(
  source: string,
  superseded: boolean,
): StatisticsSeasonView["sourceBadgeVariant"] {
  if (superseded) return "superseded";
  if (source === "manual") return "self-reported";
  if (source === "api-football") return "verified";
  return "default";
}

function readCompetitionName(competition: ApiFootballCompetitionStats): string {
  return competition.competition?.name ?? competition.league?.name ?? "—";
}

function readCompetitionId(competition: ApiFootballCompetitionStats): string | number | undefined {
  return competition.competition?.id ?? competition.league?.id;
}

function buildCompetitions(
  competitions: ApiFootballCompetitionStats[] | undefined,
): StatisticsCompetitionRow[] {
  if (!Array.isArray(competitions)) {
    return [];
  }

  return competitions.map((competition, index) => ({
    key: `${readCompetitionId(competition) ?? "competition"}-${competition.team?.id ?? "team"}-${index}`,
    league: readCompetitionName(competition),
    team: competition.team?.name ?? "—",
    appearances: num(competition.games?.appearences),
    minutes: num(competition.games?.minutes),
    goals: num(competition.goals?.total),
    assists: num(competition.goals?.assists),
    yellowCards: num(competition.cards?.yellow),
    redCards: num(competition.cards?.red),
    rating: ratingStr(competition.games?.rating),
  }));
}

function buildMetrics(row: PlayerSeasonStatsRow): StatisticsMetric[] {
  return [
    { label: "Goals", value: num(row.goals) },
    { label: "Assists", value: num(row.assists) },
    { label: "Matches", value: num(row.matches ?? row.appearances) },
    { label: "Minutes", value: num(row.minutes) },
    { label: "Pass Accuracy", value: pct(row.passesAccuracy) },
    { label: "Rating", value: ratingStr(row.rating) },
    { label: "Yellow Cards", value: num(row.yellowCards) },
    { label: "Red Cards", value: num(row.redCards) },
  ];
}

function buildProfileExtras(
  rows: PlayerSeasonStatsRow[],
): StatisticsProfileExtras | null {
  const withProfile = rows.find(
    (row) => row.source === "api-football" && row.data?.profile,
  );
  const profile = withProfile?.data?.profile;
  if (!profile) {
    return null;
  }

  const extras: StatisticsProfileExtras = {
    height: nonEmpty(profile.height),
    weight: nonEmpty(profile.weight),
    birthDate: nonEmpty(profile.birth?.date),
    birthPlace:
      [profile.birth?.place, profile.birth?.country]
        .filter((part) => nonEmpty(part))
        .join(", ") || null,
  };

  const hasAny =
    extras.height || extras.weight || extras.birthDate || extras.birthPlace;
  return hasAny ? extras : null;
}

function latestApiUpdate(rows: PlayerSeasonStatsRow[]): string | null {
  const timestamps = rows
    .filter((row) => row.source === "api-football")
    .map((row) => row.updatedAt)
    .filter((value): value is string => typeof value === "string");

  if (timestamps.length === 0) {
    return null;
  }

  return timestamps.reduce((latest, current) =>
    current > latest ? current : latest,
  );
}

function providerSeasons(rows: PlayerSeasonStatsRow[]): Set<string> {
  return new Set(
    rows
      .filter((row) => row.source === "api-football")
      .map((row) => row.season),
  );
}

function weightedRating(
  rows: PlayerSeasonStatsRow[],
): number | null {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const row of rows) {
    const appearances = row.matches ?? row.appearances ?? 0;
    const rating =
      typeof row.rating === "number" && Number.isFinite(row.rating)
        ? row.rating
        : null;

    if (rating !== null && appearances > 0) {
      weightedSum += rating * appearances;
      totalWeight += appearances;
    }
  }

  if (totalWeight === 0) {
    return null;
  }

  return weightedSum / totalWeight;
}

function buildCareerTotals(
  rows: PlayerSeasonStatsRow[],
  providerSeasonKeys: Set<string>,
): StatisticsCareerTotals | null {
  const deduped = new Map<string, PlayerSeasonStatsRow>();

  for (const row of rows) {
    const existing = deduped.get(row.season);
    if (!existing) {
      deduped.set(row.season, row);
      continue;
    }

    if (row.source === "api-football" && existing.source !== "api-football") {
      deduped.set(row.season, row);
    }
  }

  const seasons = [...deduped.values()];
  if (seasons.length === 0) {
    return null;
  }

  const sum = (key: keyof PlayerSeasonStatsRow) =>
    seasons.reduce((total, row) => {
      const value = row[key];
      return total + (typeof value === "number" && Number.isFinite(value) ? value : 0);
    }, 0);

  const appearances = seasons.reduce(
    (total, row) =>
      total +
      (typeof row.matches === "number"
        ? row.matches
        : typeof row.appearances === "number"
          ? row.appearances
          : 0),
    0,
  );

  const selfReportedSeasons = seasons.filter(
    (row) => row.source === "manual" && !providerSeasonKeys.has(row.season),
  ).length;

  return {
    goals: String(sum("goals")),
    assists: String(sum("assists")),
    appearances: String(appearances),
    minutes: String(sum("minutes")),
    yellowCards: String(sum("yellowCards")),
    redCards: String(sum("redCards")),
    rating: ratingStr(weightedRating(seasons)),
    selfReportedSeasons,
    totalSeasons: seasons.length,
  };
}

export function buildStatisticsViewModel(
  response: PlayerStatisticsResponse | null,
): StatisticsViewModel {
  const rows = Array.isArray(response?.data) ? response.data : [];
  const providerSeasonKeys = providerSeasons(rows);

  const seasons: StatisticsSeasonView[] = rows.map((row, index) => {
    const superseded =
      row.source === "manual" && providerSeasonKeys.has(row.season);

    return {
      key: `${row.season}-${row.source}-${index}`,
      season: row.season,
      seasonLabel: formatSeasonLabel(row.season),
      source: row.source,
      sourceLabel: sourceLabelFor(row.source, superseded),
      sourceBadgeVariant: sourceBadgeVariantFor(row.source, superseded),
      editable: row.source === "manual" && !superseded,
      superseded,
      editFormValues:
        row.source === "manual" && !superseded
          ? mapManualSeasonRowToFormValues(row)
          : null,
      metrics: buildMetrics(row),
      competitions: buildCompetitions(row.data?.competitions),
    };
  });

  return {
    profileExtras: buildProfileExtras(rows),
    seasons,
    career: buildCareerTotals(rows, providerSeasonKeys),
    lastUpdated: latestApiUpdate(rows),
    hasLinkedProvider: response?.hasLinkedProvider ?? false,
  };
}

export function lockedProviderSeasons(
  response: PlayerStatisticsResponse | null,
): string[] {
  const rows = Array.isArray(response?.data) ? response.data : [];
  return rows
    .filter((row) => row.source === "api-football")
    .map((row) => row.season);
}
