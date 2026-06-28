import Link from "next/link";
import { AlertCircle, BadgeCheck, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type VerificationBannerStatus =
  | "none"
  | "pending"
  | "rejected"
  | "verified";

type VerificationBannerProps = {
  status: VerificationBannerStatus;
};

const config = {
  none: {
    icon: AlertCircle,
    wrapperClass: "border-amber-200 bg-amber-50",
    iconClass: "text-amber-600",
    titleClass: "text-amber-900",
    descClass: "text-amber-700",
    title: "Your profile is incomplete",
    description:
      "Connect your football identity to unlock stats, highlights, and scout visibility.",
    cta: null,
    href: null,
  },
  pending: {
    icon: Clock,
    wrapperClass: "border-amber-200 bg-amber-50",
    iconClass: "text-amber-600",
    titleClass: "text-amber-900",
    descClass: "text-amber-700",
    title: "Verification in Progress",
    description:
      "Our team is reviewing your football identity. Estimated review time: 24–48 hours.",
    cta: "View Verification Status",
    href: "/onboarding/player/submitted",
  },
  rejected: {
    icon: AlertCircle,
    wrapperClass: "border-red-200 bg-red-50",
    iconClass: "text-red-600",
    titleClass: "text-red-900",
    descClass: "text-red-700",
    title: "Verification Needs Attention",
    description:
      "We could not verify your football identity. Review your claim and submit updated evidence.",
    cta: "Review Claim",
    href: "/onboarding/player/claim",
  },
  verified: {
    icon: BadgeCheck,
    wrapperClass: "border-green-200 bg-green-50",
    iconClass: "text-green-600",
    titleClass: "text-green-900",
    descClass: "text-green-700",
    title: "Verified Football Profile",
    description: "Your identity has been confirmed by the GlobalScout team.",
    cta: null,
    href: null,
  },
} as const;

export function VerificationBanner({ status }: VerificationBannerProps) {
  if (status === "verified") {
    return null;
  }

  const current = config[status];
  const Icon = current.icon;

  return (
    <Alert
      className={cn(
        "flex items-start gap-4 border shadow-none",
        current.wrapperClass,
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", current.iconClass)} />
      <div className="flex-1">
        <AlertTitle className={cn("font-semibold", current.titleClass)}>
          {current.title}
        </AlertTitle>
        <AlertDescription className={current.descClass}>
          {current.description}
        </AlertDescription>
      </div>
      {current.cta && current.href ? (
        <Button
          size="sm"
          className="shrink-0 bg-amber-600 hover:bg-amber-700"
          render={<Link href={current.href} />}
        >
          {current.cta}
        </Button>
      ) : null}
    </Alert>
  );
}

export function resolveVerificationBannerStatus(
  claimStatus: string | null | undefined,
): VerificationBannerStatus {
  switch (claimStatus) {
    case "Verified":
      return "verified";
    case "PendingVerification":
      return "pending";
    case "Rejected":
      return "rejected";
    default:
      return "none";
  }
}
