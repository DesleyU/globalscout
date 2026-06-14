import Link from "next/link";
import { BarChart3, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

type DashboardPlaceholderCardProps = {
  title: string;
  description: string;
  icon?: "chart" | "views";
  showUpgrade?: boolean;
};

export function DashboardPlaceholderCard({
  title,
  description,
  icon = "chart",
  showUpgrade = false,
}: DashboardPlaceholderCardProps) {
  const Icon = icon === "views" ? Eye : BarChart3;

  return (
    <Card className="h-[260px] border-0 shadow-sm">
      <CardContent className="flex h-full flex-col p-3">
        <CardTitle className="mb-2 text-sm font-bold text-gray-900">
          {title}
        </CardTitle>
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-blue-100">
            <Icon className="size-6 text-blue-600" />
          </div>
          <p className="mb-1 text-sm font-bold text-gray-900">{title}</p>
          <p className="mb-3 text-xs text-gray-500">{description}</p>
          {showUpgrade ? (
            <Button
              size="sm"
              className="h-7 text-xs"
              render={<Link href="/billing" />}
            >
              Upgrade to Pro
            </Button>
          ) : (
            <p className="text-xs font-medium text-blue-600">Coming soon</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
