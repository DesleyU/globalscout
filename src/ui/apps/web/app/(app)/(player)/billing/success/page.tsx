import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("Payment Success");

export default function BillingSuccessPage() {
  return (
    <RouteSkeletonPage
      title="Payment Successful"
      description="Your subscription upgrade was successful. Premium features will unlock here once billing is fully integrated."
    />
  );
}
