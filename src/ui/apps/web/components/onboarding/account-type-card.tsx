import { ChevronRight, Loader2, Users, Zap } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountTypeCardProps = {
  variant: "player" | "agent";
  href?: string;
  onSelect?: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function AccountTypeCard({
  variant,
  href,
  onSelect,
  loading = false,
  disabled = false,
}: AccountTypeCardProps) {
  if (variant === "player" && (href || onSelect)) {
    const content = (
      <>
        <div className="absolute inset-0 -z-10 rounded-2xl bg-blue-600 opacity-0 blur-xl transition-opacity group-hover:opacity-20" />
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
          <Users className="h-8 w-8 text-white" aria-hidden />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-white">Player</h2>
        <p className="mb-8 leading-relaxed text-blue-100">
          Showcase your career, statistics, achievements and get discovered by
          scouts and clubs.
        </p>
        <div
          aria-hidden
          className={cn(
            buttonVariants(),
            "w-full bg-white font-semibold text-blue-700 hover:bg-blue-50",
            (loading || disabled) && "opacity-50",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Continue as Player
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </div>
      </>
    );

    const className =
      "group relative rounded-2xl border border-blue-500 bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-left transition-all duration-200 hover:scale-[1.02] hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-70";

    if (onSelect) {
      return (
        <button
          type="button"
          onClick={onSelect}
          disabled={loading || disabled}
          className={className}
        >
          {content}
        </button>
      );
    }

    return (
      <Link href={href!} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <div
      className="relative rounded-2xl border border-white/10 bg-white/5 p-8 opacity-70"
      aria-disabled
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
        <Zap className="h-8 w-8 text-gray-300" aria-hidden />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-white">Agent</h2>
      <p className="mb-8 leading-relaxed text-gray-400">
        Manage players, discover talent and connect with clubs and scouts.
      </p>
      <Button
        variant="outline"
        className="w-full border-white/20 bg-white/5 font-semibold text-white hover:bg-white/10"
        disabled={disabled}
      >
        Coming Soon
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
