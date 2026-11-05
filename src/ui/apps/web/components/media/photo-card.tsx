"use client";

import { ImageOff, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { MediaPhotoListItem } from "@globalscout/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserMediaApi } from "@/lib/api/media-browser";

const mediaApi = createBrowserMediaApi();

type PhotoCardProps = {
  photo: MediaPhotoListItem;
  onDelete?: (photoId: string) => void;
  isDeleting?: boolean;
};

function formatFileSize(bytes?: number | null): string | null {
  if (!bytes) {
    return null;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PhotoCard({ photo, onDelete, isDeleting = false }: PhotoCardProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUrl() {
      setIsLoadingUrl(true);
      setUrlError(null);

      try {
        const result = await mediaApi.getMediaUrl(photo.id);
        if (!cancelled) {
          setPhotoUrl(result.url);
        }
      } catch (error) {
        if (!cancelled) {
          setUrlError(
            error instanceof Error ? error.message : "Could not load photo",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingUrl(false);
        }
      }
    }

    void loadUrl();

    return () => {
      cancelled = true;
    };
  }, [photo.id]);

  const displayTitle =
    photo.title?.trim() ||
    photo.originalName?.trim() ||
    photo.filename?.trim() ||
    "Untitled photo";

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <div className="relative aspect-video bg-muted">
        {isLoadingUrl ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : urlError ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
            {urlError}
          </div>
        ) : photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={displayTitle}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </div>

      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{displayTitle}</CardTitle>
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={isDeleting}
              onClick={() => onDelete(photo.id)}
              aria-label="Delete photo"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          ) : null}
        </div>
        {photo.description ? (
          <p className="text-sm text-muted-foreground">{photo.description}</p>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {formatFileSize(photo.size) ? (
            <Badge variant="secondary">{formatFileSize(photo.size)}</Badge>
          ) : null}
          {photo.mimeType ? (
            <Badge variant="outline">{photo.mimeType}</Badge>
          ) : null}
        </div>
        {photo.tags ? (
          <p className="text-xs text-muted-foreground">Tags: {photo.tags}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
