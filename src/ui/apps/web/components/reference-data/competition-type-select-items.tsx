import { SelectItem } from "@/components/ui/select";
import {
  COMPETITION_TYPE_SELECT_OPTIONS,
  type CompetitionTypeOption,
} from "@/lib/reference-data/competition-types";

type CompetitionTypeSelectItemsProps = {
  includeUnknown?: boolean;
};

function CompetitionTypeOptionLabel({ option }: { option: CompetitionTypeOption }) {
  return (
    <span className="flex flex-col gap-0.5 py-0.5 text-left">
      <span className="font-medium leading-snug">{option.label}</span>
      <span className="text-xs leading-snug text-muted-foreground">
        {option.description}
      </span>
    </span>
  );
}

export function CompetitionTypeSelectItems({
  includeUnknown = false,
}: CompetitionTypeSelectItemsProps) {
  return (
    <>
      {includeUnknown ? (
        <SelectItem value="Unknown">
          <CompetitionTypeOptionLabel
            option={{
              value: "League",
              label: "Needs type",
              description: "Not classified yet — assign league or cup",
            }}
          />
        </SelectItem>
      ) : null}
      {COMPETITION_TYPE_SELECT_OPTIONS.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          <CompetitionTypeOptionLabel option={option} />
        </SelectItem>
      ))}
    </>
  );
}

export function CompetitionTypeSelectValueLabel({
  type,
  placeholder = "Select type",
}: {
  type: string | null | undefined;
  placeholder?: string;
}) {
  if (!type || type === "Unknown") {
    return placeholder;
  }

  const option = COMPETITION_TYPE_SELECT_OPTIONS.find(
    (candidate) => candidate.value === type,
  );

  return option?.label ?? type;
}
