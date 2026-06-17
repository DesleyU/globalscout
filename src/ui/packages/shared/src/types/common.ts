export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PresignedUploadResult {
  storageKey: string;
  uploadUrl: string;
  httpMethod: string;
  expiresAt: string;
}

export interface PresignedReadUrlResult {
  url: string;
  expiresAt: string;
}
