import { z } from "zod";

export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
export const MAX_BANNER_BYTES = 10 * 1024 * 1024;
export const BASIC_VIDEO_LIMIT = 1;
export const BASIC_PHOTO_LIMIT = 3;

export const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi"] as const;

export const VIDEO_CONTENT_TYPES = [
  "video/mp4",
  "video/mov",
  "video/avi",
  "video/quicktime",
  "video/x-msvideo",
] as const;

export const AVATAR_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"] as const;

export const AVATAR_CONTENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

export const PHOTO_CONTENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const BANNER_EXTENSIONS = AVATAR_EXTENSIONS;

export const BANNER_CONTENT_TYPES = AVATAR_CONTENT_TYPES;

export const initiateUploadBodySchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  contentLength: z.number().int().positive(),
});

export const completeVideoUploadBodySchema = z.object({
  storageKey: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
});

export const completeAvatarUploadBodySchema = z.object({
  storageKey: z.string().min(1),
});

export const completePhotoUploadBodySchema = z.object({
  storageKey: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
});

export const completeBannerUploadBodySchema = z.object({
  storageKey: z.string().min(1),
});

export const videoUploadFormSchema = z.object({
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  tags: z.string().trim().optional(),
});

export type VideoUploadFormValues = z.infer<typeof videoUploadFormSchema>;

export const photoUploadFormSchema = videoUploadFormSchema;

export type PhotoUploadFormValues = z.infer<typeof photoUploadFormSchema>;

function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

export function isBasicAccount(accountType?: string | null): boolean {
  return !accountType || accountType.toUpperCase() === "BASIC";
}

export function validateVideoFile(file: File): string | null {
  const extension = getFileExtension(file.name);
  if (!VIDEO_EXTENSIONS.includes(extension as (typeof VIDEO_EXTENSIONS)[number])) {
    return "Only MP4, MOV, and AVI videos are allowed.";
  }

  const contentType = file.type.toLowerCase();
  if (
    contentType &&
    !VIDEO_CONTENT_TYPES.includes(contentType as (typeof VIDEO_CONTENT_TYPES)[number])
  ) {
    return "Invalid video type. Only MP4, MOV, and AVI videos are allowed.";
  }

  if (file.size > MAX_VIDEO_BYTES) {
    return "Video must be 500 MB or smaller.";
  }

  return null;
}

export function validateAvatarFile(file: File): string | null {
  const extension = getFileExtension(file.name);
  if (!AVATAR_EXTENSIONS.includes(extension as (typeof AVATAR_EXTENSIONS)[number])) {
    return "Avatar must be a JPG, PNG, GIF, or WebP image.";
  }

  const contentType = file.type.toLowerCase();
  if (
    contentType &&
    !AVATAR_CONTENT_TYPES.includes(contentType as (typeof AVATAR_CONTENT_TYPES)[number])
  ) {
    return "Avatar must be a JPG, PNG, GIF, or WebP image.";
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return "Avatar must be 5 MB or smaller.";
  }

  return null;
}

export function validatePhotoFile(file: File): string | null {
  const extension = getFileExtension(file.name);
  if (!PHOTO_EXTENSIONS.includes(extension as (typeof PHOTO_EXTENSIONS)[number])) {
    return "Only JPG, PNG, or WebP photos are allowed.";
  }

  const contentType = file.type.toLowerCase();
  if (
    contentType &&
    !PHOTO_CONTENT_TYPES.includes(contentType as (typeof PHOTO_CONTENT_TYPES)[number])
  ) {
    return "Invalid photo type. Only JPG, PNG, or WebP photos are allowed.";
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return "Photo must be 15 MB or smaller.";
  }

  return null;
}

export function validateBannerFile(file: File): string | null {
  const extension = getFileExtension(file.name);
  if (!BANNER_EXTENSIONS.includes(extension as (typeof BANNER_EXTENSIONS)[number])) {
    return "Banner must be a JPG, PNG, GIF, or WebP image.";
  }

  const contentType = file.type.toLowerCase();
  if (
    contentType &&
    !BANNER_CONTENT_TYPES.includes(contentType as (typeof BANNER_CONTENT_TYPES)[number])
  ) {
    return "Banner must be a JPG, PNG, GIF, or WebP image.";
  }

  if (file.size > MAX_BANNER_BYTES) {
    return "Banner must be 10 MB or smaller.";
  }

  return null;
}
