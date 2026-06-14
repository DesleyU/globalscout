"use client";

import type { VerificationEvidenceDto } from "@globalscout/shared";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatEvidenceType,
  formatRelativeTime,
} from "@/features/admin/formatters";
import { createBrowserAdminApi } from "@/lib/api/admin-browser";

type ClaimEvidenceListProps = {
  claimId: string;
  evidence: VerificationEvidenceDto[];
};

function isFileEvidence(item: VerificationEvidenceDto): boolean {
  return Boolean(item.storageKey);
}

function fileNameFromStorageKey(storageKey: string): string {
  const parts = storageKey.split("/");
  return parts[parts.length - 1] || storageKey;
}

function isImageStorageKey(storageKey: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(storageKey);
}

type EvidenceFilePreviewProps = {
  claimId: string;
  evidenceId: string;
  storageKey: string;
};

function EvidenceFilePreview({
  claimId,
  evidenceId,
  storageKey,
}: EvidenceFilePreviewProps) {
  const [readUrl, setReadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileName = fileNameFromStorageKey(storageKey);
  const isImage = isImageStorageKey(storageKey);

  useEffect(() => {
    let cancelled = false;

    async function loadReadUrl() {
      setIsLoading(true);
      setError(null);

      try {
        const api = createBrowserAdminApi();
        const result = await api.getEvidenceReadUrl(claimId, evidenceId);
        if (!cancelled) {
          setReadUrl(result.url);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : "Could not load file";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadReadUrl();

    return () => {
      cancelled = true;
    };
  }, [claimId, evidenceId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading file...
      </div>
    );
  }

  if (error || !readUrl) {
    return (
      <p className="text-sm text-destructive">
        {error ?? "Could not load file"}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <a
        href={readUrl}
        target="_blank"
        rel="noreferrer"
        className="block truncate text-sm text-primary underline-offset-4 hover:underline"
      >
        {fileName}
      </a>

      {isImage ? (
        <a
          href={readUrl}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-lg border bg-muted/20"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={readUrl}
            alt={fileName}
            className="max-h-64 w-full object-contain"
          />
        </a>
      ) : (
        <a
          href={readUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Open document
        </a>
      )}
    </div>
  );
}

export function ClaimEvidenceList({ claimId, evidence }: ClaimEvidenceListProps) {
  if (evidence.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No evidence submitted yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {evidence.map((item) => {
        const isFile = isFileEvidence(item);

        return (
          <li key={item.id}>
            <Card size="sm" className="shadow-none">
              <CardContent className="flex items-start gap-3 py-3">
                <div
                  className={
                    isFile
                      ? "rounded-lg bg-blue-50 p-2 text-blue-600"
                      : "rounded-lg bg-violet-50 p-2 text-violet-600"
                  }
                >
                  {isFile ? (
                    <FileText className="size-4" aria-hidden />
                  ) : (
                    <ExternalLink className="size-4" aria-hidden />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {formatEvidenceType(String(item.type))}
                    </p>
                    <Badge variant="outline">
                      {isFile ? "File" : "Link"}
                    </Badge>
                  </div>

                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm text-primary underline-offset-4 hover:underline"
                    >
                      {item.url}
                    </a>
                  ) : item.storageKey ? (
                    <EvidenceFilePreview
                      claimId={claimId}
                      evidenceId={String(item.id)}
                      storageKey={item.storageKey}
                    />
                  ) : null}

                  {item.note ? (
                    <p className="text-sm text-muted-foreground">{item.note}</p>
                  ) : null}

                  <p className="text-xs text-muted-foreground">
                    Added {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
