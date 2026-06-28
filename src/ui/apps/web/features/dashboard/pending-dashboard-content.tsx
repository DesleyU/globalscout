import { EmptyProfileSkeleton } from "@/components/onboarding/empty-profile-skeleton";
import { ConnectIdentityCard } from "@/components/onboarding/connect-identity-card";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  VerificationBanner,
  type VerificationBannerStatus,
} from "@/components/dashboard/verification-banner";

type PendingDashboardContentProps = {
  bannerStatus: VerificationBannerStatus;
};

export function PendingDashboardContent({
  bannerStatus,
}: PendingDashboardContentProps) {
  return (
    <div className="space-y-8 p-8">
      <VerificationBanner status={bannerStatus} />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <EmptyProfileSkeleton />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Goals" value="—" color="blue" />
            <StatCard label="Assists" value="—" color="green" />
            <StatCard label="Matches" value="—" color="purple" />
            <StatCard label="Pass Accuracy" value="—" color="orange" />
            <StatCard label="Yellow Cards" value="—" color="yellow" />
            <StatCard label="Red Cards" value="—" color="red" />
          </div>
        </div>

        <aside className="space-y-4">
          <ConnectIdentityCard
            connectHref="/onboarding/player/connect"
            skipHref="/dashboard"
          />
        </aside>
      </div>
    </div>
  );
}
