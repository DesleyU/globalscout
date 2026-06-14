import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatColor =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "yellow"
  | "red"
  | "amber";

const colorMap: Record<StatColor, string> = {
  blue: "border-l-blue-500 bg-blue-50",
  green: "border-l-green-500 bg-green-50",
  purple: "border-l-purple-500 bg-purple-50",
  orange: "border-l-orange-500 bg-orange-50",
  yellow: "border-l-yellow-500 bg-yellow-50",
  amber: "border-l-amber-500 bg-amber-50",
  red: "border-l-red-500 bg-red-50",
};

type StatCardProps = {
  label: string;
  value: string;
  color: StatColor;
};

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <Card
      className={cn(
        "rounded-xl border-0 border-l-4 border-t-0 border-r-0 border-b-0 shadow-sm",
        colorMap[color],
      )}
    >
      <CardContent className="p-4">
        <p className="mb-1 text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
