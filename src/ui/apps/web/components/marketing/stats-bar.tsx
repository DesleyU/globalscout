import { landingStats } from "@/components/marketing/content";
import { cn } from "@/lib/utils";

interface StatsBarProps {
  className?: string;
}

export function StatsBar({ className }: StatsBarProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-8 rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md md:grid-cols-4",
        className,
      )}
      aria-label="Platform statistics"
    >
      {landingStats.map(({ value, label }) => (
        <div key={label} className="text-center">
          <p className="mb-2 text-4xl font-bold text-blue-400">{value}</p>
          <p className="text-gray-300">{label}</p>
        </div>
      ))}
    </div>
  );
}
