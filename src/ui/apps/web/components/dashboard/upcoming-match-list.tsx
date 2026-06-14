import { Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

type UpcomingMatchItem = {
  opponent: string;
  date: string;
  time: string;
};

type UpcomingMatchListProps = {
  items: readonly UpcomingMatchItem[];
};

export function UpcomingMatchList({ items }: UpcomingMatchListProps) {
  return (
    <Card className="h-[260px] border-0 shadow-sm">
      <CardContent className="flex h-full flex-col p-3">
        <div className="mb-2 flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-gray-900">
            Upcoming Matches
          </CardTitle>
          <Calendar className="size-4 text-gray-400" aria-hidden />
        </div>
        <div className="space-y-2">
          {items.map((match) => (
            <div
              key={`${match.opponent}-${match.date}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-2 transition hover:border-blue-300"
            >
              <div>
                <div className="text-xs font-semibold text-gray-900">
                  {match.opponent}
                </div>
                <div className="text-xs text-gray-500">
                  {match.date} • {match.time}
                </div>
              </div>
              <ChevronRight className="size-4 text-gray-400" aria-hidden />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
