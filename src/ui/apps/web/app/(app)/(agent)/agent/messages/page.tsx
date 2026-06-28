import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("Messages");

export default function AgentMessagesPage() {
  return (
    <RouteSkeletonPage
      title="Messages"
      description="Conversations with players, clubs, and scouts will appear here. This is a placeholder for the agent messaging section."
    />
  );
}
