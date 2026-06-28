import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("User Profile");

type UserProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params;

  return (
    <RouteSkeletonPage
      title="User Profile"
      description={`Public profile view for user ${id} will be implemented in a later stage.`}
    />
  );
}
