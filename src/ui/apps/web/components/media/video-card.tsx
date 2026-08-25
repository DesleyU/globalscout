"use client";

import { Loader2, Play, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { MediaVideoListItem } from "@globalscout/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserMediaApi } from "@/lib/api/media-browser";

const mediaApi = createBrowserMediaApi();

type VideoCardProps = {
  video: MediaVideoListItem;
  onDelete?: (videoId: string) => void;
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

export function VideoCard({ video, onDelete, isDeleting = false }: VideoCardProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUrl() {
      setIsLoadingUrl(true);
      setUrlError(null);

      try {
        const result = await mediaApi.getMediaUrl(video.id);
        if (!cancelled) {
          setVideoUrl(result.url);
        }
      } catch (error) {
        if (!cancelled) {
          setUrlError(
            error instanceof Error ? error.message : "Could not load video",
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
  }, [video.id]);

  const displayTitle =
    video.title?.trim() ||
    video.originalName?.trim() ||
    video.filename?.trim() ||
    "Untitled highlight";

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
        ) : videoUrl ? (
          <video
            src={videoUrl}
            controls
            preload="metadata"
            className="h-full w-full bg-black object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Play className="h-10 w-10 text-muted-foreground" />
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
              onClick={() => onDelete(video.id)}
              aria-label="Delete video"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          ) : null}
        </div>
        {video.description ? (
          <p className="text-sm text-muted-foreground">{video.description}</p>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {formatFileSize(video.size) ? (
            <Badge variant="secondary">{formatFileSize(video.size)}</Badge>
          ) : null}
          {video.mimeType ? (
            <Badge variant="outline">{video.mimeType}</Badge>
          ) : null}
        </div>
        {video.tags ? (
          <p className="text-xs text-muted-foreground">Tags: {video.tags}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
