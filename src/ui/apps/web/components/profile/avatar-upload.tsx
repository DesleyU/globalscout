"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createBrowserUsersApi } from "@/lib/api/users-browser";
import { uploadAvatarFile } from "@/lib/storage/avatar-upload";
import { validateAvatarFile } from "@/lib/validation/media";
import { formatUserDisplayName } from "@/lib/auth/format-user-display";
import type { AuthUserDto } from "@globalscout/shared";

const usersApi = createBrowserUsersApi();

type AvatarUploadProps = {
  user: AuthUserDto;
  avatarUrl?: string | null;
  onAvatarUpdated?: (avatarUrl: string | null) => void;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AvatarUpload({
  user,
  avatarUrl,
  onAvatarUpdated,
}: AvatarUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const displayName = formatUserDisplayName(user);
  const currentAvatarUrl = previewUrl ?? avatarUrl ?? null;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateAvatarFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);

    try {
      const result = await uploadAvatarFile({
        initiateUpload: usersApi.initiateAvatarUpload.bind(usersApi),
        completeUpload: usersApi.completeAvatarUpload.bind(usersApi),
        file,
      });

      const nextAvatarUrl = result.profile.avatar ?? null;
      onAvatarUpdated?.(nextAvatarUrl);
      toast.success("Profile photo updated");
      router.refresh();
    } catch (error) {
      setPreviewUrl(null);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          {currentAvatarUrl ? (
            <AvatarImage src={currentAvatarUrl} alt={displayName} />
          ) : null}
          <AvatarFallback className="text-lg">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          JPG, PNG, GIF, or WebP up to 5 MB.
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
          {isUploading ? "Uploading..." : "Change photo"}
        </Button>
      </div>
    </div>
  );
}
