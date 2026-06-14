import type { PlayerMatchDto } from "@globalscout/shared";
import {
  Calendar,
  Check,
  MapPin,
  Star,
  Trophy,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MatchResultCardProps = {
  match: PlayerMatchDto;
  onSelect: (match: PlayerMatchDto) => void;
  onDismiss: (match: PlayerMatchDto) => void;
};

function confidenceBadgeClass(confidence: number) {
  if (confidence >= 85) {
    return "border-green-200 bg-green-100 text-green-700";
  }
  if (confidence >= 70) {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }
  return "border-gray-200 bg-gray-100 text-gray-600";
}

export function MatchResultCard({
  match,
  onSelect,
  onDismiss,
}: MatchResultCardProps) {
  const initials = match.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card
      className={cn(
        "overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-md",
        match.recommended && "ring-2 ring-blue-500",
      )}
    >
      {match.recommended ? (
        <div className="flex items-center gap-2 bg-blue-600 px-5 py-2">
          <Star className="h-3.5 w-3.5 fill-white text-white" aria-hidden />
          <span className="text-xs font-semibold text-white">
            Recommended Match
          </span>
        </div>
      ) : null}

      <CardContent className="p-6">
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            <Avatar className="h-20 w-20 rounded-xl">
              <AvatarImage src={match.photoUrl ?? undefined} alt={match.name} />
              <AvatarFallback className="rounded-xl bg-blue-100 text-lg font-bold text-blue-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Badge
              className={cn(
                "absolute -top-2 -right-2 border text-xs font-bold",
                confidenceBadgeClass(match.confidenceScore),
              )}
            >
              {match.confidenceScore}%
            </Badge>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-lg font-bold text-gray-900">{match.name}</h3>

            <dl className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                <dd>{match.nationality}</dd>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" aria-hidden />
                <dd>{match.club}</dd>
              </div>
              <dd>{match.position}</dd>
              {match.age ? (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" aria-hidden />
                  <dd>{match.age} years</dd>
                </div>
              ) : null}
            </dl>

            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <p className="mb-2 text-xs font-semibold text-gray-500">
                Why we think this is you:
              </p>
              <ul className="space-y-1">
                {match.reasons.map((reason) => (
                  <li key={reason} className="flex items-center gap-2">
                    <Check
                      className="h-3.5 w-3.5 shrink-0 text-green-600"
                      aria-hidden
                    />
                    <span className="text-xs text-gray-700">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onSelect(match)}
              >
                <Check className="h-4 w-4" />
                This Is Me
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onDismiss(match)}
              >
                <X className="h-4 w-4" />
                Not Me
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
