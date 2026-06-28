import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignOutButton } from "@/features/auth/sign-out-button";
import {
  createRouteSkeletonMetadata,
  RouteSkeletonPage,
} from "@/features/dashboard/route-skeleton-page";

export const metadata = createRouteSkeletonMetadata("Agent Profile");

export default function AgentProfilePage() {
  return (
    <RouteSkeletonPage
      title="Agent Profile"
      description="Agency details, managed players, and verification status will live here. This is a placeholder for the agent profile section."
      footer={
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Sign out of your GlobalScout account on this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignOutButton />
          </CardContent>
        </Card>
      }
    />
  );
}
