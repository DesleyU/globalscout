"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COOLDOWN_MS = 60 * 60 * 1000;

type RefreshStatsButtonProps = {
  lastUpdated: string | null;
};

function formatRelative(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) {
    return "recently";
  }

  const diffMinutes = Math.round((Date.now() - parsed) / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function RefreshStatsButton({ lastUpdated }: RefreshStatsButtonProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const lastMs = lastUpdated ? Date.parse(lastUpdated) : Number.NaN;
  const nextAvailableMs = Number.isFinite(lastMs) ? lastMs + COOLDOWN_MS : 0;
  const remainingMs = nextAvailableMs - now;
  const inCooldown = remainingMs > 0;

  useEffect(() => {
    if (!inCooldown) {
      return;
    }

    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [inCooldown]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/stats/refresh", { method: "POST" });
      const body = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        toast.error(body?.error ?? "Could not refresh statistics.");
        return;
      }

      toast.success(body?.message ?? "Statistics refreshed.");
      setNow(Date.now());
      router.refresh();
    } catch {
      toast.error("Could not refresh statistics.");
    } finally {
      setIsRefreshing(false);
    }
  }

  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing || inCooldown}
      >
        <RefreshCw className={cn(isRefreshing && "animate-spin")} aria-hidden />
        {isRefreshing ? "Refreshing..." : "Refresh stats"}
      </Button>
      {inCooldown ? (
        <span className="text-xs text-muted-foreground">
          Available again in {remainingMinutes} min
        </span>
      ) : lastUpdated ? (
        <span className="text-xs text-muted-foreground">
          Updated {formatRelative(lastUpdated)}
        </span>
      ) : null}
    </div>
  );
}
