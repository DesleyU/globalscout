/** Shared claim verification states aligned with backend ClaimStatus. */
export type ClaimStatus =
  | "Unmatched"
  | "Suggested"
  | "Claimed"
  | "PendingVerification"
  | "Verified"
  | "Rejected";

export type UserRole = "PLAYER" | "SCOUT" | "ADMIN";

export interface ApiProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  type?: string;
}
