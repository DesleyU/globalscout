import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("My Network");

export default function AgentConnectionsPage() {
  return (
    <RouteSkeletonPage
      title="My Network"
      description="Your connections with players, clubs, and other scouts will appear here. This is a placeholder for the agent network section."
    />
  );
}
