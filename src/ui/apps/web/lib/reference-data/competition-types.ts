import type { CompetitionType } from "@/lib/api/reference-data-types";

export type CompetitionTypeOption = {
  value: CompetitionType;
  label: string;
  description: string;
};

export const COMPETITION_TYPE_SELECT_OPTIONS: CompetitionTypeOption[] = [
  {
    value: "League",
    label: "League",
    description: "Season-long league competition with a standings table",
  },
  {
    value: "Cup",
    label: "Cup",
    description: "Knockout or tournament competition",
  },
];

export function formatCompetitionType(type: string | null | undefined): string {
  if (!type) {
    return "Unknown type";
  }

  const option = COMPETITION_TYPE_SELECT_OPTIONS.find(
    (candidate) => candidate.value === type,
  );

  return option?.label ?? type;
}

export function formatCompetitionTypeDescription(
  type: string | null | undefined,
): string | null {
  if (!type) {
    return null;
  }

  const option = COMPETITION_TYPE_SELECT_OPTIONS.find(
    (candidate) => candidate.value === type,
  );

  return option?.description ?? null;
}
