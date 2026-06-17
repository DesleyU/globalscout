import type { PresignedReadUrlResult, PresignedUploadResult } from "./common";

export interface InitiateVideoUploadRequest {
  fileName: string;
  contentType: string;
  contentLength: number;
}

export interface CompleteVideoUploadRequest {
  storageKey: string;
  fileName: string;
  contentType: string;
  title?: string | null;
  description?: string | null;
  tags?: string | null;
}

export interface CompleteVideoUploadResponse {
  id: string;
  storageKey: string;
  title?: string | null;
  description?: string | null;
  tags?: string | null;
  createdAt: string;
}

export interface MediaVideoListItem {
  id: string;
  userId: string;
  type: string;
  storageKey: string;
  filename?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  title?: string | null;
  description?: string | null;
  tags?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeleteVideoResponse {
  message: string;
}

export type InitiateVideoUploadResult = PresignedUploadResult;
export type MediaReadUrlResult = PresignedReadUrlResult;
