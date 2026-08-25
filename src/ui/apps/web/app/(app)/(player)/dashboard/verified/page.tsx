import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  buildDashboardPlayerViewModel,
  fetchMyClaim,
  fetchMyStats,
  fetchProfileVisitors,
} from "@/features/dashboard/load-dashboard-data";
import { VerifiedDashboardContent } from "@/features/dashboard/verified-dashboard-content";
import {
  VerificationBanner,
  resolveVerificationBannerStatus,
} from "@/components/dashboard/verification-banner";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function VerifiedDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const [claimResult, statsResult, visitorsResult] = await Promise.all([
    fetchMyClaim(),
    fetchMyStats(),
    fetchProfileVisitors(),
  ]);

  if (
    claimResult?.status !== "Verified" &&
    claimResult?.status !== "SelfReported"
  ) {
    redirect("/dashboard");
  }

  const player = buildDashboardPlayerViewModel({
    user: session.user,
    claimResult,
    statsResult,
    visitorsResult,
  });

  const isPremium = visitorsResult?.tier?.toLowerCase() === "premium";
  const bannerStatus = resolveVerificationBannerStatus(claimResult?.status);
  const identityBadge =
    claimResult?.status === "SelfReported" ? "Self-reported profile" : null;

  return (
    <div>
      <div className="px-8 pt-8">
        <VerificationBanner status={bannerStatus} />
      </div>
      <VerifiedDashboardContent
        name={player.name}
        position={player.position}
        positionShort={player.positionShort}
        club={player.club}
        nationality={player.nationality}
        age={player.age}
        imageUrl={player.imageUrl}
        profileViews={player.profileViews}
        stats={player.stats}
        isPremium={isPremium}
        identityBadge={identityBadge}
      />
    </div>
  );
}
