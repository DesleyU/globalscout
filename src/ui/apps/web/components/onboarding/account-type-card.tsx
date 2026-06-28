import { ChevronRight, Loader2, Users, Zap } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountTypeVariant = "player" | "agent";

type AccountTypeCardProps = {
  variant: AccountTypeVariant;
  href?: string;
  onSelect?: () => void;
  loading?: boolean;
  disabled?: boolean;
};

type VariantConfig = {
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  cardClassName: string;
  iconWrapClassName: string;
  descriptionClassName: string;
  ctaClassName: string;
};

const VARIANT_CONFIG: Record<AccountTypeVariant, VariantConfig> = {
  player: {
    icon: Users,
    title: "Player",
    description:
      "Showcase your career, statistics, achievements and get discovered by scouts and clubs.",
    cta: "Continue as Player",
    cardClassName:
      "border-blue-500 bg-gradient-to-br from-blue-600 to-blue-700 hover:border-blue-400",
    iconWrapClassName: "bg-white/20",
    descriptionClassName: "text-blue-100",
    ctaClassName: "bg-white font-semibold text-blue-700 hover:bg-blue-50",
  },
  agent: {
    icon: Zap,
    title: "Agent",
    description:
      "Manage players, discover talent and connect with clubs and scouts.",
    cta: "Continue as Agent",
    cardClassName:
      "border-emerald-500 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:border-emerald-400",
    iconWrapClassName: "bg-white/20",
    descriptionClassName: "text-emerald-50",
    ctaClassName: "bg-white font-semibold text-emerald-700 hover:bg-emerald-50",
  },
};

export function AccountTypeCard({
  variant,
  href,
  onSelect,
  loading = false,
  disabled = false,
}: AccountTypeCardProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  const content = (
    <>
      <div className="absolute inset-0 -z-10 rounded-2xl bg-current opacity-0 blur-xl transition-opacity group-hover:opacity-10" />
      <div
        className={cn(
          "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl",
          config.iconWrapClassName,
        )}
      >
        <Icon className="h-8 w-8 text-white" aria-hidden />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-white">{config.title}</h2>
      <p className={cn("mb-8 leading-relaxed", config.descriptionClassName)}>
        {config.description}
      </p>
      <div
        aria-hidden
        className={cn(
          buttonVariants(),
          "w-full",
          config.ctaClassName,
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
            {config.cta}
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </div>
    </>
  );

  const className = cn(
    "group relative rounded-2xl border p-8 text-left transition-all duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-70",
    config.cardClassName,
  );

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
