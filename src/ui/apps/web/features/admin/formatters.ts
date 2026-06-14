import { EVIDENCE_TYPE_OPTIONS } from "@/features/onboarding/player/constants";

export function formatClaimStatus(status: string): string {
  return status
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");
}

export function hasRequestedMoreInfo(
  status: string,
  adminNote?: string | null,
): boolean {
  return status === "PendingVerification" && Boolean(adminNote?.trim());
}

export function formatEvidenceType(type: string): string {
  const match = EVIDENCE_TYPE_OPTIONS.find((option) => option.value === type);
  return match?.label ?? type.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getConfidenceTone(score: number): "high" | "medium" | "low" {
  if (score >= 80) {
    return "high";
  }
  if (score >= 50) {
    return "medium";
  }
  return "low";
}
