import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("Conversation");

type ConversationPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { userId } = await params;

  return (
    <RouteSkeletonPage
      title="Conversation"
      description={`Messaging thread with user ${userId} will be implemented in a later stage.`}
    />
  );
}
