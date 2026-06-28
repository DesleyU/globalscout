import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("Search");

export default function AgentSearchPage() {
  return (
    <RouteSkeletonPage
      title="Search"
      description="Discover and filter players, clubs, and scouts. This is a placeholder for the agent search section."
    />
  );
}
