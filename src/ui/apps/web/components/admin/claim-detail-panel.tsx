import type { AdminPendingClaimItem } from "@globalscout/shared";
import { UserRound } from "lucide-react";
import { ClaimActionForm } from "@/components/admin/claim-action-form";
import { ClaimEvidenceList } from "@/components/admin/claim-evidence-list";
import { ConfidenceScoreBadge } from "@/components/admin/confidence-score-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  formatClaimStatus,
  formatRelativeTime,
  hasRequestedMoreInfo,
} from "@/features/admin/formatters";
import { formatPositionLabel } from "@/features/onboarding/player/formatters";

type ClaimDetailPanelProps = {
  item: AdminPendingClaimItem | null;
  disabled?: boolean;
  onApprove: (note?: string | null) => Promise<void>;
  onReject: (note: string) => Promise<void>;
  onRequestInfo: (note: string) => Promise<void>;
};

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export function ClaimDetailPanel({
  item,
  disabled = false,
  onApprove,
  onReject,
  onRequestInfo,
}: ClaimDetailPanelProps) {
  if (!item) {
    return (
      <Card className="h-full min-h-96 shadow-none">
        <CardContent className="flex h-full items-center justify-center py-16 text-center">
          <div>
            <p className="text-sm font-medium">Select a claim to review</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pending verification requests appear in the queue on the left.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { claim, userId, email, userFullName } = item;
  const infoRequested = hasRequestedMoreInfo(
    String(claim.status),
    claim.adminNote,
  );
  const canReview = String(claim.status) === "PendingVerification";
  const initials = (userFullName || email)
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-4">
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Claim review</CardTitle>
              <CardDescription>
                Submitted {formatRelativeTime(claim.createdAt)}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {formatClaimStatus(String(claim.status))}
              </Badge>
              {infoRequested ? (
                <Badge variant="outline">Info requested</Badge>
              ) : null}
              <ConfidenceScoreBadge score={claim.confidenceScore} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">User identity</h3>
            <div className="flex items-center gap-3">
              <Avatar>
                {claim.candidatePhotoUrl ? (
                  <AvatarImage
                    src={claim.candidatePhotoUrl}
                    alt={userFullName || email}
                  />
                ) : null}
                <AvatarFallback>{initials || "GS"}</AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {userFullName || "Name not provided"}
                </p>
                <p className="text-sm text-muted-foreground">{email}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {userId}
                </p>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Candidate profile</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Name" value={claim.candidateName} />
              <DetailField
                label="Position"
                value={formatPositionLabel(claim.candidatePosition)}
              />
              <DetailField label="Club" value={claim.candidateClub} />
              <DetailField
                label="Nationality"
                value={claim.candidateNationality}
              />
              <DetailField
                label="Age"
                value={claim.candidateAge?.toString() ?? "—"}
              />
              <DetailField
                label="External ID"
                value={`${claim.externalProvider} #${claim.externalPlayerId}`}
              />
            </div>
          </section>

          {claim.adminNote ? (
            <>
              <Separator />
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Previous admin note</h3>
                <p className="rounded-lg bg-muted/40 p-3 text-sm">
                  {claim.adminNote}
                </p>
                {claim.reviewedAt ? (
                  <p className="text-xs text-muted-foreground">
                    Last reviewed {formatRelativeTime(claim.reviewedAt)}
                  </p>
                ) : null}
              </section>
            </>
          ) : null}

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Evidence</h3>
            </div>
            <ClaimEvidenceList
              claimId={claim.id}
              evidence={claim.evidence}
            />
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Review actions</h3>
            {canReview ? (
              <ClaimActionForm
                disabled={disabled}
                onApprove={onApprove}
                onReject={onReject}
                onRequestInfo={onRequestInfo}
              />
            ) : (
              <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                Review actions are available only for claims in pending
                verification status.
              </p>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
