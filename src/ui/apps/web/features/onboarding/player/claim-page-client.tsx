"use client";

import type { PlayerIdentityClaimDto } from "@globalscout/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  ClaimProfileComparison,
  ClaimReviewInfoPanel,
} from "@/components/onboarding/claim-profile-comparison";
import { EvidenceUpload } from "@/components/onboarding/evidence-upload";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { Button } from "@/components/ui/button";
import {
  formatDateLabel,
  formatPositionLabel,
} from "@/features/onboarding/player/formatters";
import {
  loadSearchCriteria,
  loadSelectedMatch,
} from "@/features/onboarding/player/storage";
import { createBrowserPlayerIdentityApi } from "@/lib/api/player-identity-browser";
import {
  formatPlayerIdentityDisplayName,
  type AddLinkEvidenceFormValues,
} from "@/lib/validation/player-identity";

type ClaimPageClientProps = {
  initialClaim: PlayerIdentityClaimDto | null;
  userFullName: string;
};

export function ClaimPageClient({
  initialClaim,
  userFullName,
}: ClaimPageClientProps) {
  const router = useRouter();
  const [claim, setClaim] = useState<PlayerIdentityClaimDto | null>(
    initialClaim,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchCriteria = loadSearchCriteria();
  const selectedMatch = loadSelectedMatch();

  const refreshClaim = useCallback(async () => {
    const api = createBrowserPlayerIdentityApi();
    const result = await api.getMyClaim();
    setClaim(result.claim);
    return result;
  }, []);

  useEffect(() => {
    if (!claim && !searchCriteria && !selectedMatch) {
      router.replace("/onboarding/player/connect");
    }
  }, [claim, router, searchCriteria, selectedMatch]);

  const comparisonSource = claim ?? selectedMatch;
  if (!comparisonSource) {
    return null;
  }

  const userDisplayName = searchCriteria
    ? formatPlayerIdentityDisplayName(searchCriteria) || userFullName
    : claim?.fullName || userFullName;

  const userFields = [
    {
      label: "Name",
      value: userDisplayName,
    },
    {
      label: "Date of Birth",
      value: formatDateLabel(
        searchCriteria?.dateOfBirth ?? claim?.dateOfBirth,
      ),
    },
    {
      label: "Nationality",
      value: searchCriteria?.nationality ?? claim?.nationality ?? "—",
    },
    {
      label: "Club",
      value: searchCriteria?.currentTeamName ?? claim?.currentClub ?? "—",
    },
    {
      label: "Position",
      value: formatPositionLabel(
        searchCriteria?.position ?? claim?.position,
      ),
    },
  ];

  const candidateFields = [
    {
      label: "Name",
      value: claim?.candidateName ?? selectedMatch?.name ?? "—",
    },
    {
      label: "Date of Birth",
      value: formatDateLabel(
        searchCriteria?.dateOfBirth ?? claim?.dateOfBirth,
      ),
    },
    {
      label: "Nationality",
      value: claim?.candidateNationality ?? selectedMatch?.nationality ?? "—",
    },
    {
      label: "Club",
      value: claim?.candidateClub ?? selectedMatch?.club ?? "—",
    },
    {
      label: "Position",
      value: formatPositionLabel(
        claim?.candidatePosition ?? selectedMatch?.position,
      ),
    },
  ];

  async function handleFileUpload(
    file: File,
    type: AddLinkEvidenceFormValues["type"],
  ) {
    const api = createBrowserPlayerIdentityApi();
    await api.uploadEvidenceFile(file, type);
    await refreshClaim();
    toast.success("File evidence uploaded");
  }

  async function handleLinkSubmit(values: AddLinkEvidenceFormValues) {
    const api = createBrowserPlayerIdentityApi();
    await api.addLinkEvidence({
      type: values.type,
      url: values.url,
      note: values.note ?? null,
    });
    await refreshClaim();
    toast.success("Link evidence added");
  }

  async function handleSubmitForReview() {
    setIsSubmitting(true);
    try {
      const result = await refreshClaim();
      const evidenceCount = result.claim?.evidence.length ?? 0;

      if (evidenceCount === 0) {
        toast.error("Add at least one piece of evidence before submitting.");
        return;
      }

      if (result.status === "PendingVerification") {
        router.push("/onboarding/player/submitted");
        router.refresh();
        return;
      }

      toast.error("Your claim is not ready for review yet.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Submission failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const evidenceCount = claim?.evidence.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHeader
        step={4}
        totalSteps={4}
        backHref="/onboarding/player/match-results"
      />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
            <Shield className="h-7 w-7 text-blue-600" aria-hidden />
          </div>
          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            Claim Football Profile
          </h1>
          <p className="text-gray-500">
            Review the details and submit verification evidence.
          </p>
        </div>

        <ClaimProfileComparison
          userFields={userFields}
          candidateFields={candidateFields}
        />

        <EvidenceUpload
          onFileUpload={handleFileUpload}
          onLinkSubmit={handleLinkSubmit}
          uploadedCount={evidenceCount}
          disabled={isSubmitting}
        />

        <ClaimReviewInfoPanel />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="flex-1"
            disabled={isSubmitting}
            onClick={() => void handleSubmitForReview()}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit for Review"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1"
            render={<Link href="/onboarding/player/match-results" />}
          >
            Choose Another Profile
          </Button>
        </div>
      </main>
    </div>
  );
}
