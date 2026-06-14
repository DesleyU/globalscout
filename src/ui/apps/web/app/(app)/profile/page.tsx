import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("Profile");

export default function ProfilePage() {
  return (
    <RouteSkeletonPage
      title="My Profile"
      description="Profile editing, avatar uploads, and account details will be implemented in a later stage."
    />
  );
}
