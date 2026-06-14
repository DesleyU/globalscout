import { cn } from "@/lib/utils";
import { getConfidenceTone } from "@/features/admin/formatters";

type ConfidenceScoreBadgeProps = {
  score: number;
  className?: string;
};

const toneStyles = {
  high: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-red-100 text-red-800",
} as const;

export function ConfidenceScoreBadge({
  score,
  className,
}: ConfidenceScoreBadgeProps) {
  const tone = getConfidenceTone(score);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        toneStyles[tone],
        className,
      )}
    >
      {score}% match
    </span>
  );
}
