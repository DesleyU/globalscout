import {
  SelectItem,
} from "@/components/ui/select";
import {
  COMPETITION_LEVEL_SELECT_OPTIONS,
  type CompetitionLevelOption,
} from "@/lib/reference-data/competition-levels";

type CompetitionLevelSelectItemsProps = {
  includeUnknown?: boolean;
};

function CompetitionLevelOptionLabel({ option }: { option: CompetitionLevelOption }) {
  return (
    <span className="flex flex-col gap-0.5 py-0.5 text-left">
      <span className="font-medium leading-snug">{option.label}</span>
      <span className="text-xs leading-snug text-muted-foreground">
        {option.description}
      </span>
    </span>
  );
}

export function CompetitionLevelSelectItems({
  includeUnknown = false,
}: CompetitionLevelSelectItemsProps) {
  return (
    <>
      {includeUnknown ? (
        <SelectItem value="Unknown">
          <CompetitionLevelOptionLabel
            option={{
              value: "Unknown",
              label: "Needs level",
              description: "Not classified yet — assign a level when ready",
            }}
          />
        </SelectItem>
      ) : null}
      {COMPETITION_LEVEL_SELECT_OPTIONS.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          <CompetitionLevelOptionLabel option={option} />
        </SelectItem>
      ))}
    </>
  );
}

export function CompetitionLevelSelectValueLabel({
  level,
  placeholder = "Select level",
}: {
  level: string | null | undefined;
  placeholder?: string;
}) {
  if (!level || level === "Unknown") {
    return placeholder;
  }

  const option = COMPETITION_LEVEL_SELECT_OPTIONS.find(
    (candidate) => candidate.value === level,
  );

  return option?.label ?? level;
}
