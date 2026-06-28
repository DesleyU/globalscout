import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("Connections");

export default function ConnectionsPage() {
  return (
    <RouteSkeletonPage
      title="My Network"
      description="Connection requests and your professional network will appear here soon."
    />
  );
}
