import { Activity } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

type RecentActivityItem = {
  action: string;
  time: string;
};

type RecentActivityListProps = {
  items: readonly RecentActivityItem[];
};

export function RecentActivityList({ items }: RecentActivityListProps) {
  return (
    <Card className="h-[260px] border-0 shadow-sm">
      <CardContent className="flex h-full flex-col p-3">
        <div className="mb-2 flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-gray-900">
            Recent Activity
          </CardTitle>
          <Activity className="size-4 text-gray-400" aria-hidden />
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {items.map((activity) => (
            <div key={`${activity.action}-${activity.time}`} className="flex items-start gap-2">
              <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
              <div className="flex-1">
                <div className="text-xs text-gray-900">{activity.action}</div>
                <div className="mt-0.5 text-xs text-gray-500">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
