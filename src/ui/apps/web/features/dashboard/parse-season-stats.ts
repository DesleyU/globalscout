export type SeasonStatsSummary = {
  goals: string;
  assists: string;
  matches: string;
  passAccuracy: string;
  yellowCards: string;
  redCards: string;
};

const emptyStats: SeasonStatsSummary = {
  goals: "—",
  assists: "—",
  matches: "—",
  passAccuracy: "—",
  yellowCards: "—",
  redCards: "—",
};

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function formatStat(value: number | null, suffix = ""): string {
  if (value === null) {
    return "—";
  }

  return `${value}${suffix}`;
}

export function parseSeasonStats(data: unknown[] | undefined | null): SeasonStatsSummary {
  const latest = data?.[0];
  const record = readRecord(latest);

  if (!record) {
    return emptyStats;
  }

  const passAccuracy = readNumber(record.passesAccuracy);

  return {
    goals: formatStat(readNumber(record.goals)),
    assists: formatStat(readNumber(record.assists)),
    matches: formatStat(readNumber(record.matches)),
    passAccuracy:
      passAccuracy === null ? "—" : `${Math.round(passAccuracy)}%`,
    yellowCards: formatStat(readNumber(record.yellowCards)),
    redCards: formatStat(readNumber(record.redCards)),
  };
}
