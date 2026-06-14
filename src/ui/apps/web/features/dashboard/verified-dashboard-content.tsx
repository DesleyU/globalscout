import { DashboardPlaceholderCard } from "@/components/dashboard/dashboard-placeholder-card";
import { MatchHistoryList } from "@/components/dashboard/match-history-list";
import { PlayerProfileHeader } from "@/components/dashboard/player-profile-header";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { StatCard } from "@/components/dashboard/stat-card";
import { UpcomingMatchList } from "@/components/dashboard/upcoming-match-list";
import { VideoHighlightCard } from "@/components/dashboard/video-highlight-card";
import {
  placeholderMatchHistory,
  placeholderRecentActivity,
  placeholderUpcomingMatches,
} from "@/features/dashboard/placeholder-data";
import type { SeasonStatsSummary } from "@/features/dashboard/parse-season-stats";

type VerifiedDashboardContentProps = {
  name: string;
  position: string;
  positionShort: string;
  club?: string | null;
  nationality?: string | null;
  age?: number | null;
  imageUrl?: string | null;
  profileViews?: number | null;
  stats: SeasonStatsSummary;
  isPremium?: boolean;
};

export function VerifiedDashboardContent({
  name,
  position,
  positionShort,
  club,
  nationality,
  age,
  imageUrl,
  profileViews,
  stats,
  isPremium = false,
}: VerifiedDashboardContentProps) {
  return (
    <div className="p-8">
      <PlayerProfileHeader
        name={name}
        position={position}
        positionShort={positionShort}
        club={club}
        nationality={nationality}
        age={age}
        imageUrl={imageUrl}
        profileViews={profileViews}
        profileViewsTrend="+12.5%"
      />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Goals" value={stats.goals} color="blue" />
        <StatCard label="Assists" value={stats.assists} color="green" />
        <StatCard label="Matches" value={stats.matches} color="purple" />
        <StatCard label="Pass Accuracy" value={stats.passAccuracy} color="orange" />
        <StatCard label="Yellow Cards" value={stats.yellowCards} color="yellow" />
        <StatCard label="Red Cards" value={stats.redCards} color="red" />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <VideoHighlightCard isPremium={isPremium} />
          <DashboardPlaceholderCard
            title="Performance Overview"
            description="Detailed performance charts will appear here in a future update."
          />
          <MatchHistoryList items={placeholderMatchHistory} />
        </div>

        <div className="flex flex-col gap-6">
          <DashboardPlaceholderCard
            title="Profile Views"
            description="Unlock detailed analytics with Pro."
            icon="views"
            showUpgrade={!isPremium}
          />
          <RecentActivityList items={placeholderRecentActivity} />
          <UpcomingMatchList items={placeholderUpcomingMatches} />
        </div>
      </div>
    </div>
  );
}
