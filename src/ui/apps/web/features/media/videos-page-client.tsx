"use client";

import type { MediaVideoListItem } from "@globalscout/shared";
import { VideoCard } from "@/components/media/video-card";
import { VideoUploadForm } from "@/components/media/video-upload-form";
import { useVideoMutations, useVideosQuery } from "@/features/media/use-videos";

type VideosPageClientProps = {
  initialVideos: MediaVideoListItem[];
  accountType?: string | null;
};

export function VideosPageClient({
  initialVideos,
  accountType,
}: VideosPageClientProps) {
  const { data: videos = [] } = useVideosQuery({ initialData: initialVideos });
  const { upload, remove } = useVideoMutations();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Videos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload and manage your highlight reels for scouts and clubs.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,24rem)_1fr]">
        <VideoUploadForm
          accountType={accountType}
          currentVideoCount={videos.length}
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
            <h2 className="text-lg font-semibold text-foreground">Your videos</h2>
            <p className="text-sm text-muted-foreground">
              {videos.length === 0
                ? "No videos uploaded yet."
                : `${videos.length} video${videos.length === 1 ? "" : "s"} uploaded.`}
            </p>
          </div>

          {videos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/25 px-6 py-12 text-center text-sm text-muted-foreground">
              Upload your first highlight to showcase your skills.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isDeleting={remove.isPending}
                  onDelete={(videoId) => {
                    if (
                      window.confirm(
                        "Delete this video? This action cannot be undone.",
                      )
                    ) {
                      remove.mutate(videoId);
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
