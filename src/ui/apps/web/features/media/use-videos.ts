"use client";

import type { MediaVideoListItem } from "@globalscout/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBrowserMediaApi,
  MediaBrowserError,
} from "@/lib/api/media-browser";
import { uploadVideoFile } from "@/lib/storage/video-upload";
import { mediaQueryKeys } from "./query-keys";

const mediaApi = createBrowserMediaApi();

type UseVideosQueryOptions = {
  initialData?: MediaVideoListItem[];
};

export function useVideosQuery(options: UseVideosQueryOptions = {}) {
  return useQuery({
    queryKey: mediaQueryKeys.videos(),
    queryFn: () => mediaApi.getMyVideos(),
    initialData: options.initialData,
    staleTime: 0,
  });
}

export function useVideoMutations() {
  const queryClient = useQueryClient();

  async function invalidateVideos() {
    await queryClient.invalidateQueries({
      queryKey: mediaQueryKeys.videos(),
    });
  }

  const upload = useMutation({
    mutationFn: async ({
      file,
      metadata,
      onProgress,
    }: {
      file: File;
      metadata?: {
        title?: string | null;
        description?: string | null;
        tags?: string | null;
      };
      onProgress?: (progress: number) => void;
    }) =>
      uploadVideoFile({
        initiateUpload: mediaApi.initiateVideoUpload.bind(mediaApi),
        completeUpload: mediaApi.completeVideoUpload.bind(mediaApi),
        file,
        metadata,
        onProgress,
      }),
    onSuccess: async () => {
      await invalidateVideos();
      toast.success("Video uploaded successfully");
    },
    onError: (error: unknown) => {
      if (error instanceof MediaBrowserError && error.limit !== undefined) {
        toast.error(
          error.message ||
            `Video limit reached (${error.current ?? "?"} of ${error.limit}).`,
        );
        return;
      }

      toast.error(
        error instanceof Error ? error.message : "Failed to upload video",
      );
    },
  });

  const remove = useMutation({
    mutationFn: (videoId: string) => mediaApi.deleteVideo(videoId),
    onSuccess: async () => {
      await invalidateVideos();
      toast.success("Video deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete video");
    },
  });

  return {
    upload,
    remove,
    isPending: upload.isPending || remove.isPending,
  };
}
