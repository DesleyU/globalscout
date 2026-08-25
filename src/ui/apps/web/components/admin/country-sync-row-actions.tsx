"use client";

import type { AdminReferenceDataCountry } from "@/lib/api/reference-data-types";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/features/admin/formatters";

type CountrySyncRowActionsProps = {
  country: AdminReferenceDataCountry;
  disabled?: boolean;
  syncing?: boolean;
  onSync: (countryCode: string) => Promise<void>;
};

export function CountrySyncRowActions({
  country,
  disabled = false,
  syncing = false,
  onSync,
}: CountrySyncRowActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const countryCode = country.code?.trim();

  if (!countryCode) {
    return (
      <span className="text-xs text-muted-foreground">No country code</span>
    );
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            render={<Link href={`/admin/reference-data/${encodeURIComponent(countryCode)}`} />}
          >
            Review
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || syncing}
            onClick={() => setConfirmOpen(true)}
          >
            <RefreshCw className={syncing ? "size-3.5 animate-spin" : "size-3.5"} />
            {syncing ? "Syncing..." : "Sync"}
          </Button>
        </div>
        {country.lastSyncedAt ? (
          <span className="text-xs text-muted-foreground">
            Last synced {formatRelativeTime(country.lastSyncedAt)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Not synced yet</span>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Sync ${country.name}?`}
        description={`This pulls all competitions and teams for ${country.name} from API-Football and upserts them into the catalog. Existing rows are updated; nothing is deleted.`}
        confirmLabel="Start sync"
        loading={syncing}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void onSync(countryCode).finally(() => setConfirmOpen(false));
        }}
      />
    </>
  );
}
