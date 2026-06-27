import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("Billing");

export default function BillingPage() {
  return (
    <RouteSkeletonPage
      title="Billing"
      description="Subscription management and upgrade checkout will be available here soon."
    />
  );
}
