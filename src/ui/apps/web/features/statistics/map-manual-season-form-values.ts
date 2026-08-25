import type { ApiFootballCompetitionStats, PlayerSeasonStatsRow } from "@globalscout/shared";
import type { ManualSeasonFormValues } from "@/lib/validation/stats";

function readCatalogId(
  entity: Record<string, unknown> | undefined,
): string {
  const id = entity?.catalogId;
  return typeof id === "string" ? id : "";
}

function readName(entity: Record<string, unknown> | undefined): string {
  const name = entity?.name;
  return typeof name === "string" ? name : "";
}

function readInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function readRating(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readCompetitionEntity(comp: ApiFootballCompetitionStats | Record<string, unknown>) {
  const typed = comp as ApiFootballCompetitionStats;
  return (typed.competition ?? typed.league) as Record<string, unknown> | undefined;
}

function mapCompetition(comp: ApiFootballCompetitionStats) {
  const team = comp.team as Record<string, unknown> | undefined;
  const competition = readCompetitionEntity(comp);

  return {
    teamCatalogId: readCatalogId(team),
    teamName: readName(team),
    competitionCatalogId: readCatalogId(competition),
    competitionName: readName(competition),
    appearances: readInt(comp.games?.appearences),
    minutes: readInt(comp.games?.minutes),
    goals: readInt(comp.goals?.total),
    assists: readInt(comp.goals?.assists),
    yellowCards: readInt(comp.cards?.yellow),
    redCards: readInt(comp.cards?.red),
    rating: readRating(comp.games?.rating),
  };
}

/** Map a persisted manual stats row into form values for edit. */
export function mapManualSeasonRowToFormValues(
  row: PlayerSeasonStatsRow,
): ManualSeasonFormValues | null {
  if (row.source !== "manual") {
    return null;
  }

  const rawCompetitions = row.data?.competitions;
  if (!Array.isArray(rawCompetitions) || rawCompetitions.length === 0) {
    return null;
  }

  const competitions = rawCompetitions.map((comp) =>
    mapCompetition(comp as ApiFootballCompetitionStats),
  );
  const firstCompetition = readCompetitionEntity(
    rawCompetitions[0] as ApiFootballCompetitionStats,
  );
  const country =
    typeof firstCompetition?.country === "string" ? firstCompetition.country : "";

  return {
    season: row.season,
    country,
    competitions,
    shotsTotal: row.shotsTotal ?? null,
    shotsOnTarget: row.shotsOnTarget ?? null,
    passesTotal: row.passesTotal ?? null,
    passesAccuracy: row.passesAccuracy ?? null,
    tacklesTotal: row.tacklesTotal ?? null,
    tacklesInterceptions: row.tacklesInterceptions ?? null,
    duelsWon: row.duelsWon ?? null,
    foulsCommitted: row.foulsCommitted ?? null,
    foulsDrawn: row.foulsDrawn ?? null,
  };
}
