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

export const metadata = createRouteSkeletonMetadata("Profile");

export default function ProfilePage() {
  return (
    <RouteSkeletonPage
      title="My Profile"
      description="Profile editing, avatar uploads, and account details will be implemented in a later stage."
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
