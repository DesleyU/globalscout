import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

type MatchHistoryItem = {
  opponent: string;
  date: string;
  result: string;
  goals: number;
  assists: number;
};

type MatchHistoryListProps = {
  items: readonly MatchHistoryItem[];
};

export function MatchHistoryList({ items }: MatchHistoryListProps) {
  return (
    <Card className="h-[260px] border-0 shadow-sm">
      <CardContent className="flex h-full flex-col p-3">
        <div className="mb-3 flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-gray-900">
            Match History
          </CardTitle>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600">
            View All
          </Button>
        </div>
        <div className="space-y-2 overflow-y-auto">
          {items.map((match) => (
            <div
              key={`${match.opponent}-${match.date}`}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition hover:bg-gray-100"
            >
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">
                  {match.opponent}
                </div>
                <div className="text-xs text-gray-500">{match.date}</div>
              </div>
              <div className="px-3 text-center">
                <div className="text-sm font-bold text-gray-900">
                  {match.result}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="text-center">
                  <div className="text-gray-500">Goals</div>
                  <div className="font-bold text-blue-600">{match.goals}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Assists</div>
                  <div className="font-bold text-green-600">{match.assists}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
