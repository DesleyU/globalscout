"use client";

import type { MediaPhotoListItem } from "@globalscout/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBrowserMediaApi,
  MediaBrowserError,
} from "@/lib/api/media-browser";
import { uploadPhotoFile } from "@/lib/storage/photo-upload";
import { mediaQueryKeys } from "./query-keys";

const mediaApi = createBrowserMediaApi();

type UsePhotosQueryOptions = {
  initialData?: MediaPhotoListItem[];
};

export function usePhotosQuery(options: UsePhotosQueryOptions = {}) {
  return useQuery({
    queryKey: mediaQueryKeys.photos(),
    queryFn: () => mediaApi.getMyPhotos(),
    initialData: options.initialData,
    staleTime: 0,
  });
}

export function usePhotoMutations() {
  const queryClient = useQueryClient();

  async function invalidatePhotos() {
    await queryClient.invalidateQueries({
      queryKey: mediaQueryKeys.photos(),
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
      uploadPhotoFile({
        initiateUpload: mediaApi.initiatePhotoUpload.bind(mediaApi),
        completeUpload: mediaApi.completePhotoUpload.bind(mediaApi),
        file,
        metadata,
        onProgress,
      }),
    onSuccess: async () => {
      await invalidatePhotos();
      toast.success("Photo uploaded successfully");
    },
    onError: (error: unknown) => {
      if (error instanceof MediaBrowserError && error.limit !== undefined) {
        toast.error(
          error.message ||
            `Photo limit reached (${error.current ?? "?"} of ${error.limit}).`,
        );
        return;
      }

      toast.error(
        error instanceof Error ? error.message : "Failed to upload photo",
      );
    },
  });

  const remove = useMutation({
    mutationFn: (photoId: string) => mediaApi.deletePhoto(photoId),
    onSuccess: async () => {
      await invalidatePhotos();
      toast.success("Photo deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete photo");
    },
  });

  return {
    upload,
    remove,
    isPending: upload.isPending || remove.isPending,
  };
}
