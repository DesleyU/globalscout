import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("Payment Cancelled");

export default function BillingCancelPage() {
  return (
    <RouteSkeletonPage
      title="Payment Cancelled"
      description="Your checkout was cancelled. You can return to billing anytime to upgrade your plan."
    />
  );
}
