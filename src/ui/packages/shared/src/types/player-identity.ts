import type { PresignedUploadResult } from "./common";

export const evidenceTypes = [
  "RosterListing",
  "FederationCard",
  "ClubId",
  "ProfileUrl",
  "SocialAccount",
  "Other",
  "Passport",
  "CountryPersonalId",
] as const;

export type EvidenceType = (typeof evidenceTypes)[number];

export const claimStatuses = [
  "Unmatched",
  "Suggested",
  "Claimed",
  "PendingVerification",
  "Verified",
  "Rejected",
] as const;

export type ClaimStatus = (typeof claimStatuses)[number];

export interface PlayerIdentitySearchRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  currentCountry: string;
  currentTeamId: number;
  currentTeamName: string;
  position: string;
  league?: string | null;
}

export interface CreatePlayerIdentityClaimRequest {
  externalPlayerId: number;
  provider?: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  currentCountry: string;
  currentTeamId: number;
  currentClub: string;
  position: string;
  league?: string | null;
}

export interface InitiateEvidenceUploadRequest {
  fileName: string;
  contentType: string;
  contentLength: number;
}

export interface CompleteEvidenceUploadRequest {
  storageKey: string;
  fileName: string;
  contentType: string;
  type: EvidenceType;
  note?: string | null;
}

export interface AddLinkEvidenceRequest {
  type: EvidenceType;
  url: string;
  note?: string | null;
}

export interface PlayerMatchDto {
  externalPlayerId: number;
  provider: string;
  name: string;
  club: string;
  position: string;
  nationality: string;
  age?: number | null;
  photoUrl?: string | null;
  confidenceScore: number;
  reasons: string[];
  recommended: boolean;
}

export interface SearchPlayersResult {
  matches: PlayerMatchDto[];
}

export interface VerificationEvidenceDto {
  id: string;
  type: EvidenceType | string;
  storageKey?: string | null;
  url?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface PlayerIdentityClaimDto {
  id: string;
  status: ClaimStatus | string;
  externalPlayerId: number;
  externalProvider: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  currentClub: string;
  position: string;
  candidateName: string;
  candidateClub: string;
  candidatePosition: string;
  candidateNationality: string;
  candidateAge?: number | null;
  candidatePhotoUrl?: string | null;
  confidenceScore: number;
  adminNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  evidence: VerificationEvidenceDto[];
}

export interface GetMyPlayerIdentityClaimResult {
  status: ClaimStatus | string;
  claim: PlayerIdentityClaimDto | null;
}

export interface AdminPendingClaimItem {
  claim: PlayerIdentityClaimDto;
  userId: string;
  email: string;
  userFullName?: string | null;
}

export interface ListPendingPlayerClaimsResult {
  claims: AdminPendingClaimItem[];
}

export type InitiateEvidenceUploadResult = PresignedUploadResult;
