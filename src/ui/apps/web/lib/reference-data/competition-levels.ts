import type { CompetitionLevel } from "@/lib/api/reference-data-types";

export type CompetitionLevelOption = {
  value: CompetitionLevel;
  label: string;
  description: string;
};

/** Selectable levels for players and admins (excludes Unknown). */
export const COMPETITION_LEVEL_SELECT_OPTIONS: CompetitionLevelOption[] = [
  {
    value: "ProfessionalTier1",
    label: "Top division (Tier 1)",
    description:
      "Highest national competition in the country — e.g. Premier League, Liga I",
  },
  {
    value: "ProfessionalTier2",
    label: "Second division (Tier 2)",
    description:
      "Second tier nationally — e.g. Championship, Liga II, Serie B",
  },
  {
    value: "ProfessionalTier3",
    label: "Third division (Tier 3)",
    description:
      "Third tier or lower professional leagues — e.g. League One, Liga III",
  },
  {
    value: "SemiPro",
    label: "Semi-professional",
    description:
      "Paid or part-time adult leagues below the main professional pyramid",
  },
  {
    value: "Amateur",
    label: "Amateur",
    description: "Adult amateur leagues with no professional status",
  },
  {
    value: "YouthAcademy",
    label: "Youth academy",
    description: "Youth and academy competitions — e.g. U17, U19 leagues",
  },
  {
    value: "SchoolUniversity",
    label: "School / university",
    description: "School or university championships",
  },
];

export const COMPETITION_LEVEL_LABELS: Record<CompetitionLevel, string> = {
  Unknown: "Level not set",
  ...Object.fromEntries(
    COMPETITION_LEVEL_SELECT_OPTIONS.map((option) => [
      option.value,
      option.label,
    ]),
  ) as Record<Exclude<CompetitionLevel, "Unknown">, string>,
};

/** @deprecated Use COMPETITION_LEVEL_SELECT_OPTIONS */
export const COMPETITION_LEVEL_HINT_OPTIONS = COMPETITION_LEVEL_SELECT_OPTIONS.map(
  (option) => ({ value: option.value, label: option.label }),
);

export function getCompetitionLevelOption(
  level: CompetitionLevel,
): CompetitionLevelOption | undefined {
  if (level === "Unknown") {
    return undefined;
  }

  return COMPETITION_LEVEL_SELECT_OPTIONS.find(
    (option) => option.value === level,
  );
}

export function formatCompetitionLevel(level: CompetitionLevel): string {
  return COMPETITION_LEVEL_LABELS[level] ?? level;
}

export function formatCompetitionLevelDescription(
  level: CompetitionLevel,
): string | undefined {
  return getCompetitionLevelOption(level)?.description;
}
