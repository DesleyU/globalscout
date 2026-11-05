"use client";

import { Camera, ImageIcon, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createBrowserUsersApi } from "@/lib/api/users-browser";
import { uploadBannerFile } from "@/lib/storage/banner-upload";
import { validateBannerFile } from "@/lib/validation/media";

const usersApi = createBrowserUsersApi();

type BannerUploadProps = {
  bannerUrl?: string | null;
  onBannerUpdated?: (bannerUrl: string | null) => void;
};

export function BannerUpload({ bannerUrl, onBannerUpdated }: BannerUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentBannerUrl = previewUrl ?? bannerUrl ?? null;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateBannerFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);

    try {
      const result = await uploadBannerFile({
        initiateUpload: usersApi.initiateBannerUpload.bind(usersApi),
        completeUpload: usersApi.completeBannerUpload.bind(usersApi),
        file,
      });

      const nextBannerUrl = result.profile.banner ?? null;
      onBannerUpdated?.(nextBannerUrl);
      toast.success("Banner image updated");
      router.refresh();
    } catch (error) {
      setPreviewUrl(null);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload banner",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg bg-muted">
        {currentBannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentBannerUrl}
            alt="Profile banner"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          JPG, PNG, GIF, or WebP up to 10 MB.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          {isUploading ? "Uploading..." : "Change banner"}
        </Button>
      </div>
    </div>
  );
}
