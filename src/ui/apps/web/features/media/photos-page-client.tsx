"use client";

import type { MediaPhotoListItem } from "@globalscout/shared";
import { PhotoCard } from "@/components/media/photo-card";
import { PhotoUploadForm } from "@/components/media/photo-upload-form";
import { usePhotoMutations, usePhotosQuery } from "@/features/media/use-photos";

type PhotosPageClientProps = {
  initialPhotos: MediaPhotoListItem[];
  accountType?: string | null;
};

export function PhotosPageClient({
  initialPhotos,
  accountType,
}: PhotosPageClientProps) {
  const { data: photos = [] } = usePhotosQuery({ initialData: initialPhotos });
  const { upload, remove } = usePhotoMutations();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Photos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload and manage photos for scouts and clubs to see.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,24rem)_1fr]">
        <PhotoUploadForm
          accountType={accountType}
          currentPhotoCount={photos.length}
          disabled={upload.isPending}
          onUpload={async ({ file, metadata, onProgress }) => {
            await upload.mutateAsync({
              file,
              metadata: {
                title: metadata.title || null,
                description: metadata.description || null,
                tags: metadata.tags || null,
              },
              onProgress,
            });
          }}
        />

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Your photos</h2>
            <p className="text-sm text-muted-foreground">
              {photos.length === 0
                ? "No photos uploaded yet."
                : `${photos.length} photo${photos.length === 1 ? "" : "s"} uploaded.`}
            </p>
          </div>

          {photos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/25 px-6 py-12 text-center text-sm text-muted-foreground">
              Upload your first photo to showcase your profile.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  isDeleting={remove.isPending}
                  onDelete={(photoId) => {
                    if (
                      window.confirm(
                        "Delete this photo? This action cannot be undone.",
                      )
                    ) {
                      remove.mutate(photoId);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
