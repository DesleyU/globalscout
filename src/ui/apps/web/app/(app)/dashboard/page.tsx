import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveVerificationBannerStatus } from "@/components/dashboard/verification-banner";
import { fetchMyClaim } from "@/features/dashboard/load-dashboard-data";
import { PendingDashboardContent } from "@/features/dashboard/pending-dashboard-content";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const claimResult = await fetchMyClaim();

  if (claimResult?.status === "Verified") {
    redirect("/dashboard/verified");
  }

  const bannerStatus = resolveVerificationBannerStatus(claimResult?.status);

  return <PendingDashboardContent bannerStatus={bannerStatus} />;
}
