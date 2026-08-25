import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  buildDashboardPlayerViewModel,
  fetchMyClaim,
  fetchMyStats,
  fetchProfileVisitors,
} from "@/features/dashboard/load-dashboard-data";
import {
  buildStatisticsViewModel,
  lockedProviderSeasons,
} from "@/features/statistics/build-statistics-view";
import { StatisticsContent } from "@/features/statistics/statistics-content";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Statistics",
};

function identityBadgeForStatus(status: string | undefined): string | null {
  if (status === "SelfReported") {
    return "Self-reported profile";
  }
  return null;
}

export default async function StatisticsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const [claimResult, statsResult, visitorsResult] = await Promise.all([
    fetchMyClaim(),
    fetchMyStats(),
    fetchProfileVisitors(),
  ]);

  const player = buildDashboardPlayerViewModel({
    user: session.user,
    claimResult,
    statsResult,
    visitorsResult,
  });

  const model = buildStatisticsViewModel(statsResult);
  const isPremium =
    session.user.accountType?.toLowerCase() === "premium" ||
    visitorsResult?.tier?.toLowerCase() === "premium";

  return (
    <StatisticsContent
      header={{
        name: player.name,
        position: player.position,
        positionShort: player.positionShort,
        club: player.club,
        nationality: player.nationality,
        age: player.age,
        imageUrl: player.imageUrl,
        profileViews: player.profileViews,
        identityBadge: identityBadgeForStatus(claimResult?.status),
      }}
      model={model}
      lockedSeasons={lockedProviderSeasons(statsResult)}
      isPremium={isPremium}
      defaultCountry=""
    />
  );
}
