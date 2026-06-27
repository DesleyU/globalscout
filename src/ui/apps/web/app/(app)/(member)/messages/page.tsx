import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("Messages");

export default function MessagesPage() {
  return (
    <RouteSkeletonPage
      title="Messages"
      description="Direct messaging with scouts and clubs will be implemented in a later stage."
    />
  );
}
