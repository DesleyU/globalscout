import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("Videos");

export default function VideosPage() {
  return (
    <RouteSkeletonPage
      title="Videos"
      description="Highlight uploads and video management will be implemented in a later stage."
    />
  );
}
