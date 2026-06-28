import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  buildDashboardPlayerViewModel,
  fetchMyClaim,
  fetchMyStats,
  fetchProfileVisitors,
} from "@/features/dashboard/load-dashboard-data";
import { VerifiedDashboardContent } from "@/features/dashboard/verified-dashboard-content";
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

  if (claimResult?.status !== "Verified") {
    redirect("/dashboard");
  }

  const player = buildDashboardPlayerViewModel({
    user: session.user,
    claimResult,
    statsResult,
    visitorsResult,
  });

  const isPremium = visitorsResult?.tier?.toLowerCase() === "premium";

  return (
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
    />
  );
}
