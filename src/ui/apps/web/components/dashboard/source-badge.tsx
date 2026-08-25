import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SourceBadgeProps = {
  label: string;
  variant?: "default" | "self-reported" | "verified" | "superseded";
  className?: string;
};

const variantClasses: Record<NonNullable<SourceBadgeProps["variant"]>, string> = {
  default: "bg-muted text-muted-foreground",
  "self-reported": "bg-amber-100 text-amber-800 border-amber-200",
  verified: "bg-green-100 text-green-800 border-green-200",
  superseded: "bg-slate-100 text-slate-500 border-slate-200",
};

export function SourceBadge({
  label,
  variant = "default",
  className,
}: SourceBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] uppercase tracking-wide", variantClasses[variant], className)}
    >
      {label}
    </Badge>
  );
}
