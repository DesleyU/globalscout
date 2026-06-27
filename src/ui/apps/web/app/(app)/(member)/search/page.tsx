import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("Search");

export default function SearchPage() {
  return (
    <RouteSkeletonPage
      title="Search"
      description="Player and scout search will be available here in a future release."
    />
  );
}
