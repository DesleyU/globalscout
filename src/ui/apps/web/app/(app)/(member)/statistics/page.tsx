import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("Statistics");

export default function StatisticsPage() {
  return (
    <RouteSkeletonPage
      title="Statistics"
      description="Season performance metrics and detailed stats will be implemented in a later stage."
    />
  );
}
